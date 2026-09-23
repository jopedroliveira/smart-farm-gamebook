<!--
  Mobile bottom sheet for a selected bed (or the composter / lawn).
  Replaces the inline RPG menu on phones: big touch targets, no keyboard hints.
  Irrigation is automatic (Home Assistant), so it is shown as information only.
-->
<script>
  import { PLANT_SPECIES } from '$lib/data/plant-species.js';
  import { bedStatusLabel, weedColor, thirstColor } from '$lib/stores/farm.js';
  import { activeRotations } from '$lib/data/beds.js';
  import { createEventDispatcher } from 'svelte';

  export let bedId;
  export let state;

  const dispatch = createEventDispatcher();

  let view = 'main';
  let pickedRotation = null;
  let picked = null;

  $: bed = state.beds.find(b => b.id === bedId);
  $: active = bed ? activeRotations(bed) : [];
  $: hasPlantings = active.some(r => r.plantings?.length > 0);
  $: if (bedId) { view = 'main'; picked = null; pickedRotation = null; }

  $: title = bedId === 'composter' ? 'COMPOSTOR'
    : bedId === 'weeds' ? 'RELVADO'
    : bed ? bed.notionCode : '';

  $: subtitle = (() => {
    if (bedId === 'composter') return `${Math.round(state.composter.fill * 100)}% cheio`;
    if (bedId === 'weeds') return 'Aparas vao para o compostor';
    if (!bed) return '';
    const names = (bed.allPlantings || []).map(p => PLANT_SPECIES[p.species]?.name || p.species.replace(/_/g, ' '));
    return names.length ? `${names.slice(0, 3).join(', ')}${names.length > 3 ? '…' : ''} · ${bedStatusLabel(bed)}` : 'Vazia';
  })();

  $: regaText = (() => {
    if (!bed) return '';
    if (bed.horasSemRega === null || bed.horasSemRega === undefined) return 'sem dados do HA';
    const when = bed.horasSemRega < 1 ? 'ha menos de 1h'
      : bed.horasSemRega < 48 ? `ha ${Math.round(bed.horasSemRega)}h`
      : `ha ${Math.round(bed.horasSemRega / 24)} dias`;
    return bed.duracaoRegaMin ? `${when} · ${bed.duracaoRegaMin} min` : when;
  })();

  $: ervasText = !bed ? ''
    : bed.diasSemSachar === null || bed.diasSemSachar === undefined ? 'nunca sachado'
    : bed.diasSemSachar === 0 ? 'sachado hoje'
    : `${bed.diasSemSachar} dias sem sachar`;

  $: rotationOptions = active.map(r => ({ id: r.id, label: r.title || r.season || 'Rotacao', estado: r.estado }));
  $: cultureOptions = (() => {
    const rot = (bed?.rotations || []).find(r => r.id === pickedRotation);
    return (rot?.plantings || []).map(p => ({
      species: p.species,
      label: PLANT_SPECIES[p.species]?.name || p.species.replace(/_/g, ' '),
      count: p.count,
    }));
  })();
  $: pickedName = picked ? (PLANT_SPECIES[picked]?.name || picked.replace(/_/g, ' ')) : '';

  function act(tool, payload) {
    dispatch('action', { tool, payload });
  }

  function startHarvest() {
    if (active.length > 1) { view = 'pickRotation'; return; }
    if (active.length === 1) { pickedRotation = active[0].id; view = 'pickCulture'; }
  }

  function back() {
    if (view === 'confirmDone') view = 'pickCulture';
    else if (view === 'pickCulture' && active.length > 1) { view = 'pickRotation'; pickedRotation = null; }
    else { view = 'main'; pickedRotation = null; }
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
      <div class="sheet-facts">
        <div class="sheet-fact">
          <span class="sheet-fact-label">REGA</span>
          <span class="sheet-fact-val" style:color={thirstColor(bed)}>{regaText}</span>
          <span class="sheet-fact-note">automatica, pelo Home Assistant</span>
        </div>
        <div class="sheet-fact">
          <span class="sheet-fact-label">ERVAS</span>
          <span class="sheet-fact-val" style:color={weedColor(bed)}>{ervasText}</span>
        </div>
      </div>
      <div class="sheet-actions">
        <button class="sheet-btn sheet-btn-primary" on:click={() => act('shovel')}>SACHAR</button>
        <button class="sheet-btn" disabled={!hasPlantings} on:click={startHarvest}>COLHEITA</button>
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

  {:else if view === 'pickRotation'}
    <div class="sheet-question">Que rotacao colher?</div>
    <div class="sheet-actions">
      {#each rotationOptions as r}
        <button class="sheet-btn" on:click={() => { pickedRotation = r.id; view = 'pickCulture'; }}>
          {r.label} <span class="sheet-btn-tag">{r.estado}</span>
        </button>
      {/each}
      <button class="sheet-btn sheet-btn-quiet" on:click={back}>◀ VOLTAR</button>
    </div>

  {:else if view === 'pickCulture'}
    <div class="sheet-question">Que cultura colher?</div>
    <div class="sheet-actions">
      {#each cultureOptions as c}
        <button class="sheet-btn" on:click={() => { picked = c.species; view = 'confirmDone'; }}>
          {c.label} <span class="sheet-btn-tag">×{c.count}</span>
        </button>
      {/each}
      <button class="sheet-btn sheet-btn-quiet" on:click={back}>◀ VOLTAR</button>
    </div>

  {:else if view === 'confirmDone'}
    <div class="sheet-question">{pickedName}: acabou?</div>
    <div class="sheet-actions">
      <button class="sheet-btn sheet-btn-primary" on:click={() => act('harvest', { species: picked, rotationId: pickedRotation, finished: true })}>SIM, ACABOU</button>
      <button class="sheet-btn" on:click={() => act('harvest', { species: picked, rotationId: pickedRotation, finished: false })}>NAO, AINDA HA</button>
      <button class="sheet-btn sheet-btn-quiet" on:click={back}>◀ VOLTAR</button>
    </div>
  {/if}
</div>
