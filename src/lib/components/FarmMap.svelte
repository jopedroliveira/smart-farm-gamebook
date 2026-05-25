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

  // ---- Layout constants ----
  const MAP_W = 800, MAP_H = 380, M2PX = 60;
  const BEDS_LAYOUT = {
    A1: { x: 20, y: 40, w: 3.2*M2PX, h: 1.5*M2PX },
    B1: { x: 252, y: 40, w: 1.6*M2PX, h: 1.5*M2PX },
    C1: { x: 388, y: 40, w: 3.2*M2PX, h: 1.5*M2PX },
    A2: { x: 20, y: 220, w: 3.2*M2PX, h: 1.5*M2PX },
    B2: { x: 252, y: 220, w: 1.6*M2PX, h: 1.5*M2PX },
    C2: { x: 388, y: 220, w: 3.2*M2PX, h: 1.5*M2PX },
  };
  const COMPOSTER = { x: 620, y: 40, w: 120, h: 90 };
  const CLUSTER = { x: 20, y: 40, w: 560, h: 270 };
  const CORRIDOR_Y = 130, CORRIDOR_H = 90;
  const GAP_AB_X = 212, GAP_AB_W = 40;
  const GAP_BC_X = 348, GAP_BC_W = 40;
  const SPAWN = { x: 700, y: 280 };
  const TILE = 20;

  // ---- Player state ----
  let pos = { ...SPAWN };
  let dir = 'down';
  let walking = false;
  let menuBedId = null;
  let cursor = 0;
  let flash = null;
  let effects = [];

  // ---- Walkability + BFS ----
  function buildWalkable() {
    const cols = Math.ceil(MAP_W / TILE);
    const rows = Math.ceil(MAP_H / TILE);
    const grid = Array.from({ length: rows }, () => Array(cols).fill(false));
    function fill(x1, y1, x2, y2, val) {
      const tx1 = Math.max(0, Math.floor(x1 / TILE));
      const ty1 = Math.max(0, Math.floor(y1 / TILE));
      const tx2 = Math.min(cols, Math.ceil(x2 / TILE));
      const ty2 = Math.min(rows, Math.ceil(y2 / TILE));
      for (let y = ty1; y < ty2; y++) for (let x = tx1; x < tx2; x++) grid[y][x] = val;
    }
    fill(CLUSTER.x, CORRIDOR_Y, CLUSTER.x + CLUSTER.w, CORRIDOR_Y + CORRIDOR_H, true);
    fill(GAP_AB_X, CLUSTER.y, GAP_AB_X + GAP_AB_W, CLUSTER.y + CLUSTER.h, true);
    fill(GAP_BC_X, CLUSTER.y, GAP_BC_X + GAP_BC_W, CLUSTER.y + CLUSTER.h, true);
    fill(CLUSTER.x + CLUSTER.w, 0, MAP_W, MAP_H, true);
    fill(COMPOSTER.x, COMPOSTER.y, COMPOSTER.x + COMPOSTER.w, COMPOSTER.y + COMPOSTER.h, false);
    return grid;
  }
  const WALKABLE = buildWalkable();
  const COLS = WALKABLE[0].length;
  const ROWS = WALKABLE.length;

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
    if (id === 'composter') return { x: COMPOSTER.x + COMPOSTER.w/2, y: COMPOSTER.y + COMPOSTER.h + 25, face: 'up' };
    if (id === 'weeds') return { x: 690, y: 260, face: 'down' };
    const bed = BEDS_LAYOUT[id];
    if (!bed) return null;
    return { x: bed.x + bed.w / 2, y: CORRIDOR_Y + CORRIDOR_H / 2, face: bed.y === CLUSTER.y ? 'up' : 'down' };
  }

  // ---- Walk queue ----
  let walkQueue = [];
  let targetBed = null;
  let lastPos = { ...SPAWN };
  let walkDuration = 0;

  function nextStep() {
    if (walkQueue.length === 0) {
      walking = false;
      const bedId = targetBed;
      targetBed = null;
      if (bedId) {
        const sp = getStandpoint(bedId);
        if (sp?.face) dir = sp.face;
        menuBedId = bedId;
        cursor = 0;
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
      menuBedId = id;
      cursor = 0;
      targetBed = null;
      return;
    }
    walkQueue = simplified;
    if (!walking) nextStep();
  }

  function handleSelect(id) {
    if (menuBedId) return;
    goToTarget(id);
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
    // Emit visual effect
    const sp = getStandpoint(id);
    if (sp) {
      const effectKind = tool === 'compost' ? 'water' : tool === 'gather' ? 'shovel' : tool;
      const eid = Date.now() + Math.random();
      effects = [...effects, { id: eid, kind: effectKind, x: sp.x, y: sp.y - 40 }];
      setTimeout(() => { effects = effects.filter(e => e.id !== eid); }, 1000);
    }
    // Flash message
    const flashMap = {
      water: { text: '+ ÁGUA', color: '#4fc3f7' },
      shovel: { text: 'ERVAS FORA', color: '#a4d96b' },
      harvest: { text: '+ COLHEITA', color: '#ffe16a' },
      compost: { text: '+ COMPOSTO', color: '#b58a5a' },
      gather: { text: 'RELVA CORTADA', color: '#a4d96b' },
    };
    const fl = flashMap[tool];
    if (fl) {
      flash = fl;
      setTimeout(() => { flash = null; }, 1300);
    }
    setTimeout(() => dispatch('useTool', { id, tool, payload }), 200);
    menuBedId = null;
  }

  // Scattered weed positions (computed once)
  const weedPositions = Array.from({ length: 24 }, (_, i) => {
    const x = ((i * 47) % 170) + 12;
    const y = ((i * 73) % 320) + 30;
    // skip sprites inside composter area
    const cx = COMPOSTER.x - (CLUSTER.x + CLUSTER.w + 4);
    if (x > cx - 12 && x < cx + COMPOSTER.w + 12 && y > COMPOSTER.y - 12 && y < COMPOSTER.y + COMPOSTER.h + 12) return null;
    return { x, y };
  }).filter(Boolean);
</script>

<PixelPanel color="#86c46b" accent="var(--border, #1d1d1d)" padding={14} radius={10}>
  <div class="playfield" style:width="{MAP_W}px" style:height="{MAP_H}px">
    <div class="playfield-grass"></div>

    <!-- Cluster background -->
    <div class="cluster-bg" style:left="{CLUSTER.x - 6}px" style:top="{CLUSTER.y - 6}px"
         style:width="{CLUSTER.w + 12}px" style:height="{CLUSTER.h + 12}px"></div>

    <!-- Corridors -->
    <div class="corridor-strip" style:left="{CLUSTER.x}px" style:top="{CORRIDOR_Y}px"
         style:width="{CLUSTER.w + 8}px" style:height="{CORRIDOR_H}px"></div>
    <div class="corridor-strip vert" style:left="{GAP_AB_X}px" style:top="{CLUSTER.y}px"
         style:width="{GAP_AB_W}px" style:height="{CLUSTER.h}px"></div>
    <div class="corridor-strip vert" style:left="{GAP_BC_X}px" style:top="{CLUSTER.y}px"
         style:width="{GAP_BC_W}px" style:height="{CLUSTER.h}px"></div>

    <!-- Weed garden -->
    <div
      class="weed-garden"
      class:weed-garden-selected={menuBedId === 'weeds'}
      class:weed-garden-highlighted={highlightedBedIds.includes('weeds')}
      style:left="{CLUSTER.x + CLUSTER.w + 4}px"
      style:top="0"
      style:width="{MAP_W - (CLUSTER.x + CLUSTER.w + 4)}px"
      style:height="{MAP_H}px"
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
      style:left="{COMPOSTER.x}px" style:top="{COMPOSTER.y}px"
      style:width="{COMPOSTER.w}px" style:height="{COMPOSTER.h}px"
      style:background="#b58a5a"
      on:click|stopPropagation={() => handleSelect('composter')}
      role="button"
      tabindex="0"
    >
      <div class="prearea-tiles">
        {#each Array(6) as _}
          <PlantSprite kind="compost" scale={3} />
        {/each}
      </div>
      <div class="prearea-label">COMPOSTOR · {Math.round(state.composter.fill * 100)}%</div>
    </div>

    <!-- Fences -->
    {#each [
      [CLUSTER.x - 6, CLUSTER.y - 6, CLUSTER.x + CLUSTER.w + 6, CLUSTER.y - 6, true],
      [CLUSTER.x - 6, CLUSTER.y + CLUSTER.h + 6, CLUSTER.x + CLUSTER.w + 6, CLUSTER.y + CLUSTER.h + 6, true],
      [CLUSTER.x - 6, CLUSTER.y - 6, CLUSTER.x - 6, CLUSTER.y + CLUSTER.h + 6, false],
      [CLUSTER.x + CLUSTER.w + 6, CLUSTER.y - 6, CLUSTER.x + CLUSTER.w + 6, CORRIDOR_Y, false],
      [CLUSTER.x + CLUSTER.w + 6, CORRIDOR_Y + CORRIDOR_H, CLUSTER.x + CLUSTER.w + 6, CLUSTER.y + CLUSTER.h + 6, false],
    ] as [x1, y1, x2, y2, horiz]}
      <div
        class="fence"
        class:fence-h={horiz}
        class:fence-v={!horiz}
        style:left="{Math.min(x1, x2)}px"
        style:top="{Math.min(y1, y2)}px"
        style:width="{horiz ? Math.abs(x2 - x1) : 6}px"
        style:height="{horiz ? 6 : Math.abs(y2 - y1)}px"
      ></div>
    {/each}

    <!-- Beds -->
    {#each Object.entries(BEDS_LAYOUT) as [id, lay]}
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
    ▶ TOCA NUMA CAMA — o agricultor caminha pelo corredor e abre o menu.
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
