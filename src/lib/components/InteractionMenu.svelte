<!--
  Pokémon-style interaction menu — appears at the bottom of the farm map
  when the player reaches a bed.
-->
<script>
  import { PLANT_SPECIES } from '$lib/data/plant-species.js';
  import { bedReady, bedStatusLabel } from '$lib/stores/farm.js';
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';

  export let bedId;
  export let state;
  export let cursor = 0;

  const dispatch = createEventDispatcher();

  let view = 'main';
  let picked = null;

  $: bed = state.beds.find(b => b.id === bedId);
  $: ready = bed ? bedReady(bed) : false;

  // Reset on bed change
  $: if (bedId) { view = 'main'; picked = null; cursor = 0; }

  $: items = (() => {
    if (bedId === 'composter') {
      return [
        { id: 'compost', label: 'USAR COMPOSTO', tool: 'compost' },
        { id: 'info', label: 'VER INFO', tool: 'info' },
        { id: 'close', label: 'FECHAR', tool: 'close' },
      ];
    }
    if (bedId === 'weeds') {
      return [
        { id: 'gather', label: 'CORTAR RELVA', tool: 'gather' },
        { id: 'info', label: 'VER INFO', tool: 'info' },
        { id: 'close', label: 'FECHAR', tool: 'close' },
      ];
    }
    if (view === 'pickCulture' && bed) {
      const list = bed.plantings.map(p => {
        const s = PLANT_SPECIES[p.species];
        return {
          id: 'pick:' + p.species,
          label: s ? s.name : p.species,
          count: p.count,
          family: s?.family,
          species: p.species,
          tool: 'pickCulture',
        };
      });
      list.push({ id: 'back', label: '◀ VOLTAR', tool: 'back' });
      return list;
    }
    if (view === 'confirmDone') {
      return [
        { id: 'yes', label: 'SIM, ACABOU', tool: 'confirmYes' },
        { id: 'no', label: 'NÃO, AINDA HÁ', tool: 'confirmNo' },
        { id: 'back', label: '◀ VOLTAR', tool: 'back' },
      ];
    }
    // main
    const hasPlantings = bed && bed.plantings && bed.plantings.length > 0;
    return [
      { id: 'water',   label: 'REGAR',    tool: 'water' },
      { id: 'shovel',  label: 'SACHAR',   tool: 'shovel' },
      { id: 'harvest', label: 'COLHEITA', tool: 'harvest', disabled: !hasPlantings },
      { id: 'info',    label: 'VER INFO', tool: 'info' },
      { id: 'close',   label: 'FECHAR',   tool: 'close' },
    ];
  })();

  $: label = bedId === 'composter' ? 'COMPOSTOR'
    : bedId === 'weeds' ? 'RELVADO'
    : bed ? bed.notionCode
    : '';

  $: subtitle = (() => {
    if (bedId === 'composter') return `${Math.round(state.composter.fill * 100)}% cheio`;
    if (bedId === 'weeds') return 'Corta a relva · rega automática';
    if (view === 'pickCulture') return 'Que cultura colher?';
    if (view === 'confirmDone' && picked) {
      const sp = PLANT_SPECIES[picked];
      return `${sp?.name || picked} — acabou?`;
    }
    if (!bed) return '';
    const primary = bed.plantings?.[0];
    const sp = primary ? PLANT_SPECIES[primary.species] : null;
    return sp ? `${sp.name} · ${bedStatusLabel(bed)}` : 'Vazia';
  })();

  function select(item) {
    if (item.tool === 'close') {
      dispatch('close');
      return;
    }
    if (item.tool === 'back') {
      view = 'main';
      cursor = 0;
      return;
    }
    if (item.tool === 'harvest' && bed) {
      view = 'pickCulture';
      cursor = 0;
      return;
    }
    if (item.tool === 'pickCulture') {
      picked = item.species;
      view = 'confirmDone';
      cursor = 0;
      return;
    }
    if (item.tool === 'confirmYes') {
      dispatch('action', { tool: 'harvest', payload: { species: picked, finished: true } });
      return;
    }
    if (item.tool === 'confirmNo') {
      dispatch('action', { tool: 'harvest', payload: { species: picked, finished: false } });
      return;
    }
    dispatch('action', { tool: item.tool });
  }

  let keyHandler;
  onMount(() => {
    keyHandler = (e) => {
      const tag = (e.target?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;

      if (e.key === 'ArrowDown') {
        let n = (cursor + 1) % items.length;
        let i = 0;
        while (items[n].disabled && i++ < items.length) n = (n + 1) % items.length;
        cursor = n;
        e.preventDefault();
      } else if (e.key === 'ArrowUp') {
        let n = (cursor - 1 + items.length) % items.length;
        let i = 0;
        while (items[n].disabled && i++ < items.length) n = (n - 1 + items.length) % items.length;
        cursor = n;
        e.preventDefault();
      } else if (['Enter', ' ', 'z', 'Z'].includes(e.key)) {
        const it = items[cursor];
        if (it && !it.disabled) select(it);
        e.preventDefault();
      } else if (['Escape', 'x', 'X'].includes(e.key)) {
        if (view !== 'main') { view = 'main'; cursor = 0; }
        else dispatch('close');
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', keyHandler);
  });
  onDestroy(() => window.removeEventListener('keydown', keyHandler));
</script>

<div class="interaction-menu-wrap">
  <div class="interaction-target">
    <div class="interaction-target-label">{label}</div>
    {#if subtitle}
      <div class="interaction-target-sub">{subtitle}</div>
    {/if}
  </div>

  <div class="interaction-menu">
    <div class="interaction-menu-grid" class:interaction-menu-list={view === 'pickCulture'}>
      {#each items as item, i}
        <div
          class="interaction-item"
          class:interaction-item-active={cursor === i}
          class:interaction-item-disabled={item.disabled}
          on:click={() => { if (!item.disabled) { cursor = i; select(item); } }}
          on:mouseenter={() => { cursor = i; }}
          role="button"
          tabindex="0"
        >
          <span class="interaction-cursor">{cursor === i ? '▶' : ''}</span>
          <span class="interaction-label">{item.label}</span>
          {#if item.count}
            <span class="interaction-count">×{item.count}</span>
          {/if}
          {#if item.family}
            <span class="interaction-family">{item.family}</span>
          {/if}
        </div>
      {/each}
    </div>
    <div class="interaction-hint-bar">
      ▲▼ navegar · Z/Enter confirmar · X/Esc {view === 'main' ? 'fechar' : 'voltar'}
    </div>
  </div>
</div>
