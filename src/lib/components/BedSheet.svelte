<!--
  Mobile bottom sheet for a selected bed (or the composter / lawn).
  Replaces the inline RPG menu on phones: big touch targets, no keyboard hints.
  Irrigation is automatic (Home Assistant), so it is shown as information only.
-->
<script>
  import { bedStatusLabel, weedColor, thirstColor } from '$lib/stores/farm.js';
  import { cropsIn, cropStage, cropDaysIn } from '$lib/data/cycles.js';
  import { createEventDispatcher } from 'svelte';

  export let bedId;
  export let state;

  const dispatch = createEventDispatcher();
  const STAGES = ['germinacao', 'crescimento', 'maturacao', 'pronto'];
  const OUTCOMES = [
    { id: 'colhida', label: 'COLHIDA', primary: true },
    { id: 'falhada', label: 'FALHOU' },
    { id: 'retirada', label: 'RETIREI' },
  ];

  let view = 'main';
  let picked = null;
  let outcome = null;
  let note = '';

  $: bed = state.beds.find(b => b.id === bedId);
  $: crops = bed ? cropsIn(bed) : [];
  $: if (bedId) { view = 'main'; picked = null; outcome = null; note = ''; }

  $: title = bedId === 'composter' ? 'COMPOSTOR'
    : bedId === 'weeds' ? 'RELVADO'
    : bed ? bed.notionCode : '';

  $: subtitle = (() => {
    if (bedId === 'composter') return `${Math.round(state.composter.fill * 100)}% cheio`;
    if (bedId === 'weeds') return 'Aparas vao para o compostor';
    if (!bed) return '';
    return crops.length ? `${crops.length} cultura${crops.length === 1 ? '' : 's'} · ${bedStatusLabel(bed)}` : 'Vazia';
  })();

  $: regaText = (() => {
    if (!bed) return '';
    if (bed.horasSemRega === null || bed.horasSemRega === undefined) return 'sem dados do HA';
    const when = bed.horasSemRega < 1 ? 'ha menos de 1h'
      : bed.horasSemRega < 48 ? `ha ${Math.round(bed.horasSemRega)}h`
      : `ha ${Math.round(bed.horasSemRega / 24)} dias`;
    const detail = [bed.duracaoRegaMin ? `${bed.duracaoRegaMin} min` : null, bed.litrosRega ? `~${bed.litrosRega} L` : null].filter(Boolean).join(', ');
    return detail ? `${when} · ${detail}` : when;
  })();

  $: valveWarnings = !bed ? [] : [
    bed.semAgua ? 'sem agua na valvula' : null,
    bed.fugaAgua ? 'fuga de agua' : null,
    bed.bateriaValvula !== null && bed.bateriaValvula < 20 ? `bateria ${bed.bateriaValvula}%` : null,
  ].filter(Boolean);

  $: ervasText = !bed ? ''
    : bed.diasSemSachar === null || bed.diasSemSachar === undefined ? 'nunca sachado'
    : bed.diasSemSachar === 0 ? 'sachado hoje'
    : `${bed.diasSemSachar} dias sem sachar`;

  $: pickedName = picked ? (picked.species?.name || picked.speciesId.replace(/_/g, ' ')) : '';

  function cropTag(c) {
    const days = cropDaysIn(c);
    return days === null ? 'por semear' : `${STAGES[cropStage(c)]} · ${days}d`;
  }

  function act(tool, payload) {
    dispatch('action', { tool, payload });
  }

  function back() {
    if (view === 'note') view = 'pickOutcome';
    else if (view === 'pickOutcome') { view = 'pickCrop'; outcome = null; }
    else { view = 'main'; picked = null; }
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div class="sheet-backdrop" on:click={() => dispatch('close')} role="presentation"></div>

<div class="sheet" role="dialog" aria-label={title}>
  <div class="sheet-grip"></div>
  <div class="sheet-head">
    <div>
      <div class="sheet-title">{title}</div>
      <div class="sheet-sub">{subtitle}</div>
    </div>
    <button class="sheet-close" on:click={() => dispatch('close')} aria-label="Fechar">✕</button>
  </div>

  {#if view === 'main'}
    {#if bed}
      {#if crops.length}
        <div class="sheet-crops">
          <div class="sheet-fact-label">NA TERRA</div>
          {#each crops as c}
            <div class="sheet-crop" style:border-left="4px solid {c.species?.color || '#5a8d3a'}">
              <span class="sheet-crop-name">{c.species?.name || c.speciesId}</span>
              <span class="sheet-crop-tag">{cropTag(c)}</span>
            </div>
          {/each}
        </div>
      {/if}
      <div class="sheet-facts">
        <div class="sheet-fact">
          <span class="sheet-fact-label">REGA</span>
          <span class="sheet-fact-val" style:color={thirstColor(bed)}>{regaText}</span>
          <span class="sheet-fact-note">{valveWarnings.length ? valveWarnings.join(' · ') : 'automatica, pelo Home Assistant'}</span>
        </div>
        <div class="sheet-fact">
          <span class="sheet-fact-label">ERVAS</span>
          <span class="sheet-fact-val" style:color={weedColor(bed)}>{ervasText}</span>
        </div>
      </div>
      <div class="sheet-actions">
        <button class="sheet-btn sheet-btn-primary" on:click={() => act('shovel')}>SACHAR</button>
        <button class="sheet-btn" disabled={!crops.length} on:click={() => { view = 'pickCrop'; }}>A CULTURA SAIU</button>
        <button class="sheet-btn sheet-btn-quiet" on:click={() => dispatch('info', bedId)}>VER INFO</button>
      </div>
    {:else if bedId === 'composter'}
      <div class="sheet-actions">
        <button class="sheet-btn sheet-btn-primary" on:click={() => act('compost')}>USAR COMPOSTO</button>
        <button class="sheet-btn sheet-btn-quiet" on:click={() => dispatch('info', bedId)}>VER INFO</button>
      </div>
    {:else}
      <div class="sheet-actions">
        <button class="sheet-btn sheet-btn-primary" on:click={() => act('gather')}>CORTAR RELVA</button>
        <button class="sheet-btn sheet-btn-quiet" on:click={() => dispatch('info', bedId)}>VER INFO</button>
      </div>
    {/if}

  {:else if view === 'pickCrop'}
    <div class="sheet-question">Que cultura saiu?</div>
    <div class="sheet-actions">
      {#each crops as c}
        <button class="sheet-btn" on:click={() => { picked = c; view = 'pickOutcome'; }}>
          {c.species?.name || c.speciesId} <span class="sheet-btn-tag">{cropTag(c)}</span>
        </button>
      {/each}
      <button class="sheet-btn sheet-btn-quiet" on:click={back}>◀ VOLTAR</button>
    </div>

  {:else if view === 'pickOutcome'}
    <div class="sheet-question">{pickedName}: como acabou?</div>
    <div class="sheet-actions">
      {#each OUTCOMES as o}
        <button class="sheet-btn" class:sheet-btn-primary={o.primary} on:click={() => { outcome = o.id; view = 'note'; }}>{o.label}</button>
      {/each}
      <button class="sheet-btn sheet-btn-quiet" on:click={back}>◀ VOLTAR</button>
    </div>

  {:else if view === 'note'}
    <div class="sheet-question">{pickedName} · {outcome}</div>
    <div class="sheet-actions">
      <input id="sheet-note" class="sheet-input" bind:value={note} placeholder={outcome === 'falhada' ? 'causa (ex: larvas nas raizes)' : 'nota (opcional)'} />
      <button class="sheet-btn sheet-btn-primary" on:click={() => act('harvest', { cropId: picked.id, outcome, note: note.trim() || null, count: picked.count })}>GUARDAR</button>
      <button class="sheet-btn sheet-btn-quiet" on:click={back}>◀ VOLTAR</button>
    </div>
  {/if}
</div>

<style>
  .sheet-crops { display: flex; flex-direction: column; gap: 6px; }
  .sheet-crop {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
    background: #fff;
    padding: 6px 10px;
    border-radius: 3px;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.15);
  }
  .sheet-crop-name { font-family: 'Press Start 2P', monospace; font-size: 10px; color: var(--ink); }
  .sheet-crop-tag { font-family: 'VT323', monospace; font-size: 17px; color: var(--text-soft); white-space: nowrap; }
  .sheet-input {
    font-family: 'VT323', monospace;
    font-size: 20px;
    padding: 10px 12px;
    border: none;
    border-radius: 3px;
    box-shadow: inset 0 0 0 2px var(--ink);
    background: #fff;
    width: 100%;
    box-sizing: border-box;
  }
</style>
