<!--
  Pokémon-style interaction menu — appears at the bottom of the farm map
  when the player reaches a bed.
-->
<script>
  import { PLANT_SPECIES } from '$lib/data/plant-species.js';
  import { bedReady, bedStatusLabel } from '$lib/stores/farm.js';
  import { createEventDispatcher } from 'svelte';

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
    const main = [
      { id: 'water', label: 'REGAR', tool: 'water' },
      { id: 'shovel', label: 'SACHAR', tool: 'shovel' },
    ];
    if (ready) {
      main.push({ id: 'harvest', label: 'COLHER', tool: 'harvest' });
    }
    main.push({ id: 'info', label: 'VER INFO', tool: 'info' });
    main.push({ id: 'close', label: 'FECHAR', tool: 'close' });
    return main;
  })();

  $: label = bedId === 'composter' ? 'COMPOSTOR'
    : bedId === 'weeds' ? 'RELVADO'
    : bed ? `${bed.notionCode} · ${bedStatusLabel(bed)}`
    : '';

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
    if (item.tool === 'harvest' && bed && bed.plantings?.length > 1) {
      view = 'pickCulture';
      cursor = 0;
      return;
    }
    if (item.tool === 'harvest' && bed && bed.plantings?.length === 1) {
      picked = bed.plantings[0].species;
      view = 'confirmDone';
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
</script>

<div class="interaction-menu-wrap">
  <div class="interaction-target">
    <div class="interaction-target-label">{label}</div>
    {#if view === 'confirmDone'}
      {@const sp = PLANT_SPECIES[picked]}
      <div class="interaction-target-sub">Acabou o {sp?.name || picked}?</div>
    {/if}
  </div>

  <div class="interaction-menu">
    <div class="interaction-menu-grid" class:interaction-menu-list={view === 'pickCulture'}>
      {#each items as item, i}
        <div
          class="interaction-item"
          class:interaction-item-active={cursor === i}
          on:click={() => { cursor = i; select(item); }}
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
    {#if view === 'main'}
      <div class="interaction-hint-bar">Z selecciona · X fecha</div>
    {/if}
  </div>
</div>
