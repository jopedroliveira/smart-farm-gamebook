<!--
  Pokémon-style interaction menu — appears at the bottom of the farm map
  when the player reaches a bed.
-->
<script>
  import { bedReady, bedStatusLabel } from '$lib/stores/farm.js';
  import { cropsIn, cropStage, cropDaysIn } from '$lib/data/cycles.js';
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';

  export let bedId;
  export let state;
  export let cursor = 0;

  const dispatch = createEventDispatcher();

  const STAGES = ['germinacao', 'crescimento', 'maturacao', 'pronto'];
  const OUTCOMES = [
    { id: 'colhida', label: 'COLHIDA' },
    { id: 'falhada', label: 'FALHOU' },
    { id: 'retirada', label: 'RETIREI' },
  ];

  let view = 'main';
  let picked = null;
  let outcome = null;
  let note = '';

  $: bed = state.beds.find(b => b.id === bedId);
  $: ready = bed ? bedReady(bed) : false;
  $: crops = bed ? cropsIn(bed) : [];

  // Reset on bed change
  $: if (bedId) { view = 'main'; picked = null; outcome = null; note = ''; cursor = 0; }

  function cropTag(c) {
    const days = cropDaysIn(c);
    return days === null ? 'por semear' : `${STAGES[cropStage(c)]} · ${days}d`;
  }

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
    if (view === 'pickCrop' && bed) {
      const list = crops.map(c => ({
        id: 'crop:' + c.id,
        label: c.species?.name || c.speciesId,
        family: cropTag(c),
        crop: c,
        tool: 'pickCrop',
      }));
      list.push({ id: 'back', label: '◀ VOLTAR', tool: 'back' });
      return list;
    }
    if (view === 'pickOutcome') {
      return [
        ...OUTCOMES.map(o => ({ id: 'out:' + o.id, label: o.label, outcome: o.id, tool: 'pickOutcome' })),
        { id: 'back', label: '◀ VOLTAR', tool: 'back' },
      ];
    }
    if (view === 'note') {
      return [
        { id: 'save', label: 'GUARDAR', tool: 'save' },
        { id: 'back', label: '◀ VOLTAR', tool: 'back' },
      ];
    }
    // main
    return [
      { id: 'shovel',  label: 'SACHAR',   tool: 'shovel' },
      { id: 'harvest', label: 'A CULTURA SAIU', tool: 'harvest', disabled: !crops.length },
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
    const name = picked ? (picked.species?.name || picked.speciesId) : '';
    if (view === 'pickCrop') return 'Que cultura saiu?';
    if (view === 'pickOutcome') return `${name}: como acabou?`;
    if (view === 'note') return `${name} · ${outcome} · nota?`;
    if (!bed) return '';
    const first = crops[0];
    return first ? `${first.species?.name || first.speciesId} · ${bedStatusLabel(bed)}` : 'Vazia';
  })();

  function select(item) {
    if (item.tool === 'close') {
      dispatch('close');
      return;
    }
    if (item.tool === 'back') {
      goBack();
      cursor = 0;
      return;
    }
    if (item.tool === 'harvest' && bed) {
      view = 'pickCrop';
      cursor = 0;
      return;
    }
    if (item.tool === 'pickCrop') {
      picked = item.crop;
      view = 'pickOutcome';
      cursor = 0;
      return;
    }
    if (item.tool === 'pickOutcome') {
      outcome = item.outcome;
      view = 'note';
      cursor = 0;
      return;
    }
    if (item.tool === 'save') {
      dispatch('action', { tool: 'harvest', payload: { cropId: picked.id, outcome, note: note.trim() || null, count: picked.count } });
      return;
    }
    dispatch('action', { tool: item.tool });
  }

  function goBack() {
    if (view === 'note') view = 'pickOutcome';
    else if (view === 'pickOutcome') { view = 'pickCrop'; outcome = null; }
    else { view = 'main'; picked = null; }
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
        if (view !== 'main') {
          goBack();
          cursor = 0;
        } else {
          dispatch('close');
        }
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
    {#if view === 'note'}
      <input id="menu-note" class="interaction-note" bind:value={note} placeholder={outcome === 'falhada' ? 'causa (ex: larvas nas raizes)' : 'nota (opcional)'} />
    {/if}
    <div class="interaction-menu-grid" class:interaction-menu-list={view === 'pickCrop'}>
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

<style>
  .interaction-note {
    font-family: 'VT323', monospace;
    font-size: 18px;
    width: 100%;
    box-sizing: border-box;
    padding: 6px 8px;
    margin-bottom: 6px;
    border: none;
    border-radius: 2px;
    box-shadow: inset 0 0 0 2px var(--ink);
    background: #fff;
  }
</style>
