<!--
  The farm map: beds on a pixel-art green field with corridors, fences,
  a walking character, and interaction menus.
-->
<script>
  import PixelPanel from './PixelPanel.svelte';
  import PlantSprite from './PlantSprite.svelte';
  import PlayerSprite from './PlayerSprite.svelte';
  import Bed from './Bed.svelte';
  import InteractionMenu from './InteractionMenu.svelte';
  import ActionEffect from './ActionEffect.svelte';
  import { createEventDispatcher } from 'svelte';

  export let state;
  export let highlightedBedIds = [];
  export let bedMode = 'default';

  const dispatch = createEventDispatcher();

  // Desktop: the real 2x3 plan seen from above, corridor between the rows.
  // Mobile (compact): the same plan rotated, so it fits a phone at 1:1 with
  // legible labels. Rows become columns and the corridor runs vertically.
  export let compact = false;

  const M2PX = 60;
  const TILE = 20;

  function buildLayout(isCompact) {
    if (!isCompact) {
      const CLUSTER = { x: 20, y: 40, w: 560, h: 270 };
      const COMPOSTER = { x: 620, y: 40, w: 120, h: 90 };
      const CORRIDOR = { x: CLUSTER.x, y: 130, w: CLUSTER.w + 8, h: 90 };
      const GAPS = [
        { x: 212, y: CLUSTER.y, w: 40, h: CLUSTER.h },
        { x: 348, y: CLUSTER.y, w: 40, h: CLUSTER.h },
      ];
      return {
        MAP_W: 800, MAP_H: 380,
        beds: {
          'RB-23': { x: 20, y: 40, w: 3.2*M2PX, h: 1.5*M2PX },
          'RB-22': { x: 252, y: 40, w: 1.6*M2PX, h: 1.5*M2PX },
          'RB-21': { x: 388, y: 40, w: 3.2*M2PX, h: 1.5*M2PX },
          'RB-13': { x: 20, y: 220, w: 3.2*M2PX, h: 1.5*M2PX },
          'RB-12': { x: 252, y: 220, w: 1.6*M2PX, h: 1.5*M2PX },
          'RB-11': { x: 388, y: 220, w: 3.2*M2PX, h: 1.5*M2PX },
        },
        cluster: CLUSTER,
        composter: COMPOSTER,
        weeds: { x: CLUSTER.x + CLUSTER.w + 4, y: 0, w: 800 - (CLUSTER.x + CLUSTER.w + 4), h: 380 },
        corridors: [CORRIDOR, ...GAPS.map(g => ({ ...g, vert: true }))],
        // open ground outside the fence, minus the composter
        walkable: [CORRIDOR, ...GAPS, { x: CLUSTER.x + CLUSTER.w, y: 0, w: 800 - (CLUSTER.x + CLUSTER.w), h: 380 }],
        spawn: { x: 700, y: 280 },
        weedStand: { x: 690, y: 260, face: 'down' },
        // the fence opens onto the corridor on the right side
        fenceOpening: { side: 'right', from: CORRIDOR.y, to: CORRIDOR.y + CORRIDOR.h },
        standpoint(bed) {
          return { x: bed.x + bed.w / 2, y: CORRIDOR.y + CORRIDOR.h / 2, face: bed.y === CLUSTER.y ? 'up' : 'down' };
        },
      };
    }
    const W = 340;
    const CLUSTER = { x: 20, y: 20, w: 240, h: 540 };
    const CORRIDOR = { x: 110, y: CLUSTER.y, w: 60, h: CLUSTER.h, vert: true };
    const GAPS = [
      { x: CLUSTER.x, y: 212, w: CLUSTER.w + 8, h: 30 },
      { x: CLUSTER.x, y: 338, w: CLUSTER.w + 8, h: 30 },
    ];
    const COMPOSTER = { x: 20, y: 590, w: 110, h: 60 };
    return {
      MAP_W: W, MAP_H: 660,
      beds: {
        'RB-23': { x: 20,  y: 20,  w: 1.5*M2PX, h: 3.2*M2PX },
        'RB-22': { x: 20,  y: 242, w: 1.5*M2PX, h: 1.6*M2PX },
        'RB-21': { x: 20,  y: 368, w: 1.5*M2PX, h: 3.2*M2PX },
        'RB-13': { x: 170, y: 20,  w: 1.5*M2PX, h: 3.2*M2PX },
        'RB-12': { x: 170, y: 242, w: 1.5*M2PX, h: 1.6*M2PX },
        'RB-11': { x: 170, y: 368, w: 1.5*M2PX, h: 3.2*M2PX },
      },
      cluster: CLUSTER,
      composter: COMPOSTER,
      weeds: { x: COMPOSTER.x + COMPOSTER.w + 10, y: 574, w: W - (COMPOSTER.x + COMPOSTER.w + 10), h: 660 - 574 },
      corridors: [CORRIDOR, ...GAPS],
      walkable: [CORRIDOR, ...GAPS, { x: 0, y: 566, w: W, h: 660 - 566 }],
      spawn: { x: 260, y: 620 },
      weedStand: { x: 250, y: 615, face: 'down' },
      fenceOpening: { side: 'bottom', from: CORRIDOR.x, to: CORRIDOR.x + CORRIDOR.w },
      standpoint(bed) {
        return { x: CORRIDOR.x + CORRIDOR.w / 2, y: bed.y + bed.h / 2, face: bed.x < CORRIDOR.x ? 'left' : 'right' };
      },
    };
  }

  $: L = buildLayout(compact);
  $: WALKABLE = buildWalkable(L);
  $: COLS = WALKABLE[0].length;
  $: ROWS = WALKABLE.length;
  $: fences = buildFences(L);
  $: weedPositions = buildWeedPositions(L);
  $: if (L) resetPlayer();

  // ---- Player state ----
  let pos = { x: 0, y: 0 };
  let dir = 'down';
  let walking = false;
  let menuBedId = null;
  let cursor = 0;
  let flash = null;
  let effects = [];

  // ---- Walkability + BFS ----
  function buildWalkable(lay) {
    const cols = Math.ceil(lay.MAP_W / TILE);
    const rows = Math.ceil(lay.MAP_H / TILE);
    const grid = Array.from({ length: rows }, () => Array(cols).fill(false));
    function fill(r, val) {
      const tx1 = Math.max(0, Math.floor(r.x / TILE));
      const ty1 = Math.max(0, Math.floor(r.y / TILE));
      const tx2 = Math.min(cols, Math.ceil((r.x + r.w) / TILE));
      const ty2 = Math.min(rows, Math.ceil((r.y + r.h) / TILE));
      for (let y = ty1; y < ty2; y++) for (let x = tx1; x < tx2; x++) grid[y][x] = val;
    }
    for (const r of lay.walkable) fill(r, true);
    fill(lay.composter, false);
    return grid;
  }

  function buildFences(lay) {
    const c = lay.cluster, o = lay.fenceOpening;
    const x1 = c.x - 6, y1 = c.y - 6, x2 = c.x + c.w + 6, y2 = c.y + c.h + 6;
    const segs = [];
    const side = (name, a, b) => {
      if (o.side !== name) { segs.push([a, b]); return; }
      const horiz = name === 'top' || name === 'bottom';
      // two segments with a gap where the corridor leaves the fence
      if (horiz) { segs.push([a, { x: o.from, y: a.y }]); segs.push([{ x: o.to, y: a.y }, b]); }
      else { segs.push([a, { x: a.x, y: o.from }]); segs.push([{ x: a.x, y: o.to }, b]); }
    };
    side('top', { x: x1, y: y1 }, { x: x2, y: y1 });
    side('bottom', { x: x1, y: y2 }, { x: x2, y: y2 });
    side('left', { x: x1, y: y1 }, { x: x1, y: y2 });
    side('right', { x: x2, y: y1 }, { x: x2, y: y2 });
    return segs.map(([a, b]) => ({
      x: Math.min(a.x, b.x), y: Math.min(a.y, b.y),
      w: a.y === b.y ? Math.abs(b.x - a.x) : 6,
      h: a.y === b.y ? 6 : Math.abs(b.y - a.y),
      horiz: a.y === b.y,
    }));
  }

  // Scattered weed sprites, skipping the composter footprint
  function buildWeedPositions(lay) {
    const area = lay.weeds, comp = lay.composter;
    return Array.from({ length: 24 }, (_, i) => {
      const x = ((i * 47) % Math.max(20, area.w - 30)) + 12;
      const y = ((i * 73) % Math.max(20, area.h - 60)) + 30;
      const cx = comp.x - area.x, cy = comp.y - area.y;
      if (x > cx - 12 && x < cx + comp.w + 12 && y > cy - 12 && y < cy + comp.h + 12) return null;
      return { x, y };
    }).filter(Boolean);
  }

  function toTile(p) { return { x: Math.round(p.x / TILE), y: Math.round(p.y / TILE) }; }
  function toPx(t) { return { x: t.x * TILE + TILE/2, y: t.y * TILE + TILE/2 }; }
  function tileWalkable(tx, ty) {
    if (tx < 0 || tx >= COLS || ty < 0 || ty >= ROWS) return false;
    return WALKABLE[ty][tx];
  }
  function snapToWalkable(t) {
    if (tileWalkable(t.x, t.y)) return t;
    let best = null, bestD = Infinity;
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      if (!WALKABLE[y][x]) continue;
      const d = Math.abs(x - t.x) + Math.abs(y - t.y);
      if (d < bestD) { bestD = d; best = { x, y }; }
    }
    return best || t;
  }
  function bfsPath(start, end) {
    const s = snapToWalkable(toTile(start));
    const e = snapToWalkable(toTile(end));
    if (s.x === e.x && s.y === e.y) return [toPx(e)];
    const q = [s];
    const came = new Map([[`${s.x},${s.y}`, null]]);
    while (q.length) {
      const cur = q.shift();
      if (cur.x === e.x && cur.y === e.y) {
        const out = [];
        let k = `${cur.x},${cur.y}`;
        while (k) {
          const [cx, cy] = k.split(',').map(Number);
          out.unshift(toPx({ x: cx, y: cy }));
          k = came.get(k);
        }
        return out;
      }
      for (const [dx, dy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        const nx = cur.x + dx, ny = cur.y + dy;
        const k = `${nx},${ny}`;
        if (!tileWalkable(nx, ny) || came.has(k)) continue;
        came.set(k, `${cur.x},${cur.y}`);
        q.push({ x: nx, y: ny });
      }
    }
    return null;
  }
  function simplifyPath(path) {
    if (!path || path.length < 3) return path || [];
    const out = [path[0]];
    for (let i = 1; i < path.length - 1; i++) {
      const dx1 = path[i].x - path[i-1].x;
      const dy1 = path[i].y - path[i-1].y;
      const dx2 = path[i+1].x - path[i].x;
      const dy2 = path[i+1].y - path[i].y;
      if (Math.sign(dx1) !== Math.sign(dx2) || Math.sign(dy1) !== Math.sign(dy2)) out.push(path[i]);
    }
    out.push(path[path.length - 1]);
    return out;
  }

  function getStandpoint(id) {
    const c = L.composter;
    if (id === 'composter') {
      return compact
        ? { x: c.x + c.w / 2, y: c.y - 18, face: 'down' }
        : { x: c.x + c.w / 2, y: c.y + c.h + 25, face: 'up' };
    }
    if (id === 'weeds') return L.weedStand;
    const bed = L.beds[id];
    if (!bed) return null;
    return L.standpoint(bed);
  }

  // ---- Walk queue ----
  let walkQueue = [];
  let targetBed = null;
  let lastPos = { x: 0, y: 0 };
  let walkDuration = 0;

  function resetPlayer() {
    pos = { ...L.spawn };
    lastPos = { ...L.spawn };
    walkQueue = [];
    walking = false;
    menuBedId = null;
  }

  function nextStep() {
    if (walkQueue.length === 0) {
      walking = false;
      const bedId = targetBed;
      targetBed = null;
      if (bedId) {
        const sp = getStandpoint(bedId);
        if (sp?.face) dir = sp.face;
        openMenu(bedId);
      }
      return;
    }
    const next = walkQueue.shift();
    const dx = next.x - lastPos.x;
    const dy = next.y - lastPos.y;
    if (Math.abs(dx) > Math.abs(dy)) dir = dx > 0 ? 'right' : 'left';
    else dir = dy > 0 ? 'down' : 'up';
    walking = true;
    const dist = Math.abs(dx) + Math.abs(dy);
    walkDuration = Math.max(140, (dist / 180) * 1000);
    lastPos = next;
    pos = next;
  }

  function goToTarget(id) {
    menuBedId = null;
    const sp = getStandpoint(id);
    if (!sp) return;
    const path = bfsPath(lastPos, sp);
    if (!path) return;
    const simplified = simplifyPath(path).slice(1);
    targetBed = id;
    if (simplified.length === 0) {
      if (sp.face) dir = sp.face;
      targetBed = null;
      openMenu(id);
      return;
    }
    walkQueue = simplified;
    if (!walking) nextStep();
  }

  // The parent decides how a selection is presented on mobile (a bottom
  // sheet); the inline RPG menu is desktop only.
  function openMenu(id) {
    if (compact) { dispatch('select', id); return; }
    menuBedId = id;
    cursor = 0;
  }

  function handleSelect(id) {
    if (menuBedId) return;
    goToTarget(id);
  }

  // Effects and flash for actions taken outside the inline menu (mobile sheet)
  export function playAction(id, tool) {
    showEffect(id, tool);
  }

  function handleTransitionEnd(e) {
    if (e.propertyName !== 'transform') return;
    nextStep();
  }

  function handleMenuAction(e) {
    const { tool, payload } = e.detail;
    if (!menuBedId) return;
    const id = menuBedId;
    if (tool === 'close') { menuBedId = null; return; }
    if (tool === 'info') { dispatch('showInfo', id); menuBedId = null; return; }
    showEffect(id, tool);
    setTimeout(() => dispatch('useTool', { id, tool, payload }), 200);
    menuBedId = null;
  }

  const FLASH = {
    water: { text: '+ ÁGUA', color: '#4fc3f7' },
    shovel: { text: 'ERVAS FORA', color: '#a4d96b' },
    harvest: { text: '+ COLHEITA', color: '#ffe16a' },
    compost: { text: '+ COMPOSTO', color: '#b58a5a' },
    gather: { text: 'RELVA CORTADA', color: '#a4d96b' },
  };

  function showEffect(id, tool) {
    const sp = getStandpoint(id);
    if (sp) {
      const effectKind = tool === 'compost' ? 'water' : tool === 'gather' ? 'shovel' : tool;
      const eid = Date.now() + Math.random();
      effects = [...effects, { id: eid, kind: effectKind, x: sp.x, y: sp.y - 40 }];
      setTimeout(() => { effects = effects.filter(e => e.id !== eid); }, 1000);
    }
    const fl = FLASH[tool];
    if (fl) {
      flash = fl;
      setTimeout(() => { flash = null; }, 1300);
    }
  }
</script>

<PixelPanel color="#86c46b" accent="var(--border, #1d1d1d)" padding={compact ? 8 : 14} radius={10}>
  <div class="playfield" class:playfield-compact={compact} style:width="{L.MAP_W}px" style:height="{L.MAP_H}px">
    <div class="playfield-grass"></div>

    <!-- Cluster background -->
    <div class="cluster-bg" style:left="{L.cluster.x - 6}px" style:top="{L.cluster.y - 6}px"
         style:width="{L.cluster.w + 12}px" style:height="{L.cluster.h + 12}px"></div>

    <!-- Corridors -->
    {#each L.corridors as c}
      <div class="corridor-strip" class:vert={c.vert} style:left="{c.x}px" style:top="{c.y}px"
           style:width="{c.w}px" style:height="{c.h}px"></div>
    {/each}

    <!-- Weed garden -->
    <div
      class="weed-garden"
      class:weed-garden-selected={menuBedId === 'weeds'}
      class:weed-garden-highlighted={highlightedBedIds.includes('weeds')}
      style:left="{L.weeds.x}px"
      style:top="{L.weeds.y}px"
      style:width="{L.weeds.w}px"
      style:height="{L.weeds.h}px"
      on:click={() => handleSelect('weeds')}
      role="button"
      tabindex="0"
    >
      {#each weedPositions as wp}
        <div style:position="absolute" style:left="{wp.x}px" style:top="{wp.y}px" style:pointer-events="none">
          <PlantSprite kind="weed" scale={2} />
        </div>
      {/each}
      <div class="weed-garden-label">RELVADO</div>
    </div>

    <!-- Composter -->
    <div
      class="prearea-cell"
      class:prearea-selected={menuBedId === 'composter'}
      class:prearea-highlighted={highlightedBedIds.includes('composter')}
      style:left="{L.composter.x}px" style:top="{L.composter.y}px"
      style:width="{L.composter.w}px" style:height="{L.composter.h}px"
      style:background="#b58a5a"
      on:click|stopPropagation={() => handleSelect('composter')}
      role="button"
      tabindex="0"
    >
      <div class="prearea-tiles">
        {#each Array(compact ? 3 : 6) as _}
          <PlantSprite kind="compost" scale={3} />
        {/each}
      </div>
      <div class="prearea-label">COMPOSTOR · {Math.round(state.composter.fill * 100)}%</div>
    </div>

    <!-- Fences -->
    {#each fences as f}
      <div
        class="fence"
        class:fence-h={f.horiz}
        class:fence-v={!f.horiz}
        style:left="{f.x}px"
        style:top="{f.y}px"
        style:width="{f.w}px"
        style:height="{f.h}px"
      ></div>
    {/each}

    <!-- Beds -->
    {#each Object.entries(L.beds) as [id, lay]}
      {@const bed = state.beds.find(b => b.id === id)}
      {#if bed}
        <Bed
          {bed}
          x={lay.x}
          y={lay.y}
          width={lay.w}
          height={lay.h}
          selected={menuBedId === bed.id}
          highlighted={highlightedBedIds.includes(bed.id)}
          {bedMode}
          {compact}
          on:click={() => handleSelect(bed.id)}
          on:sparkleClick={() => dispatch('showHarvestInfo', bed.id)}
        />
      {/if}
    {/each}

    <!-- Player character -->
    <div
      class="player"
      style:transform="translate({pos.x - 18}px, {pos.y - 48}px)"
      style:transition={walking ? `transform ${walkDuration}ms linear` : 'none'}
      on:transitionend={handleTransitionEnd}
    >
      <PlayerSprite {dir} {walking} scale={3} />
      <div class="player-shadow"></div>
    </div>

    <!-- Action effects -->
    {#each effects as e (e.id)}
      <ActionEffect kind={e.kind} x={e.x} y={e.y} />
    {/each}

    <!-- Interaction menu -->
    {#if menuBedId}
      <InteractionMenu
        bedId={menuBedId}
        {state}
        {cursor}
        on:action={handleMenuAction}
        on:close={() => { menuBedId = null; }}
      />
    {/if}
  </div>

  {#if flash}
    <div class="flash-popup" style:color={flash.color} style:border-color={flash.color}>
      {flash.text}
    </div>
  {/if}

  <div class="map-hint">
    {#if compact}
      ▶ TOCA NUM CANTEIRO
    {:else}
      ▶ TOCA NUMA CAMA — o agricultor caminha pelo corredor e abre o menu.
    {/if}
  </div>
</PixelPanel>

<style>
  .cluster-bg {
    position: absolute;
    background: #7da55e;
    box-shadow: inset 0 0 0 4px #5a3a1a, 0 0 0 2px #3a2410;
    border-radius: 3px;
    z-index: 0;
  }
</style>
