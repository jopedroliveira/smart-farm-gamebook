<!--
  Bed notebook: what is in the bed now, what comes next, warnings, and a
  timeline of previous cycles. Long texts stay behind "mais" toggles.
-->
<script>
  import PlantSprite from './PlantSprite.svelte';
  import { bedStatusLabel, bedStage, weedColor, thirstColor } from '$lib/stores/farm.js';
  import { openCycle, closedCycles, cropsGrowing, cropsPlanned, cropStage, cropDaysIn, primaryCrop } from '$lib/data/cycles.js';
  import { seasonOf, descriptionOf, familiesOf, cycleFamilies, cycleFailed, bedWarnings, nextSeasonLabel, avoidFamilies } from '$lib/data/bed-summary.js';

  export let bedId;
  export let state;

  const STAGE_WORD = ['germina', 'cresce', 'madura', 'colher'];
  const OUTCOME_WORD = { colhida: 'colhida', falhada: 'FALHOU', retirada: 'retirada' };
  const ACTIONS = { observacao: 'OBS', intervencao: 'INTERV', solo: 'SOLO', sachar: 'SACHAR', nota: 'NOTA' };

  let pickedCrop = null;
  let openRow = null;
  let showScheme = false;
  let showDiary = false;
  let showNotes = false;

  $: bed = state.beds.find(b => b.id === bedId);
  $: if (bedId) { pickedCrop = null; openRow = null; showScheme = false; showDiary = false; showNotes = false; }
  $: primary = bed ? primaryCrop(bed) : null;
  $: stage = bed ? bedStage(bed) : 0;
  $: status = bed ? bedStatusLabel(bed) : '';
  $: open = bed ? openCycle(bed) : null;
  $: crops = bed ? cropsGrowing(bed) : [];
  $: planned = bed ? cropsPlanned(bed) : [];
  $: families = familiesOf(crops);
  $: avoid = bed ? avoidFamilies(bed) : [];
  $: history = bed ? closedCycles(bed) : [];
  $: warnings = bed ? bedWarnings(bed) : [];
  $: diary = bed ? (bed.diary || []).slice(0, 5) : [];

  function stageWord(c) {
    return `${STAGE_WORD[cropStage(c)]} · ${cropDaysIn(c)}d`;
  }

  function cropDetail(c) {
    const when = c.inOn ? `${c.method} em ${c.inOn}` : `a ${c.method === 'semeado' ? 'semear' : 'plantar'} ${c.planWhen || 'sem data'}`;
    return `${c.species?.family || 'familia ?'} · ${c.role} · ${when}`;
  }

  function regaLine(b) {
    const rega = b.horasSemRega === null || b.horasSemRega === undefined ? 'rega sem dados' : `rega ha ${b.horasSemRega}h`;
    const ervas = b.diasSemSachar === null || b.diasSemSachar === undefined ? 'nunca sachado' : `sachado ha ${b.diasSemSachar}d`;
    return { rega, ervas };
  }

  function toggleCrop(id) { pickedCrop = pickedCrop === id ? null : id; }
  function toggleRow(id) { openRow = openRow === id ? null : id; }
</script>

{#if bed}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="info-modal-backdrop" on:click={() => { bedId = null; }}>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="info-modal" on:click|stopPropagation>
      <div class="info-modal-bar">
        <div class="info-modal-title">{bed.notionCode}</div>
        <button class="info-modal-close" on:click={() => { bedId = null; }}>FECHAR ✕</button>
      </div>
      <div class="info-modal-body">
        <div class="nb-head">
          <div class="nb-frame">
            {#if primary}
              <PlantSprite kind={primary.species?.sprite || 'lettuce'} {stage} scale={3} />
            {:else}
              <span class="nb-empty">·</span>
            {/if}
          </div>
          <div class="nb-head-meta">
            <div class="portrait-status status-{status.toLowerCase().replace(/[^a-z]/g,'')}">{status}</div>
            <div class="nb-vitals">
              <span style:color={thirstColor(bed)}>{regaLine(bed).rega}</span>
              <span style:color={weedColor(bed)}>{regaLine(bed).ervas}</span>
            </div>
          </div>
        </div>

        <div class="bed-section-title">AGORA</div>
        {#if crops.length}
          <div class="nb-pills">
            {#each crops as c (c.id)}
              <button class="nb-pill" class:nb-pill-on={pickedCrop === c.id} style:--pill={c.species?.color || '#5a8d3a'} on:click={() => toggleCrop(c.id)}>
                <span class="nb-pill-dot"></span>
                <span class="nb-pill-name">{c.species?.name || c.speciesId}</span>
                <span class="nb-pill-stage">{stageWord(c)}</span>
              </button>
            {/each}
          </div>
          {#if pickedCrop}
            {#each crops.filter(c => c.id === pickedCrop) as c}
              <div class="nb-line nb-line-soft">{cropDetail(c)}</div>
            {/each}
          {/if}
          <div class="nb-fams">
            {#each families as f}<span class="nb-fam">{f}</span>{/each}
            {#if !families.length}<span class="nb-fam">familia por definir</span>{/if}
          </div>
        {:else}
          <div class="nb-line nb-line-soft">Nada na terra.</div>
        {/if}
        {#if open?.notes}
          <div class="nb-line nb-line-warn">{open.notes}</div>
        {/if}

        <div class="bed-section-title">A SEGUIR</div>
        {#if planned.length}
          <div class="nb-pills">
            {#each planned as c (c.id)}
              <button class="nb-pill nb-pill-plan" class:nb-pill-on={pickedCrop === c.id} style:--pill={c.species?.color || '#5a8d3a'} on:click={() => toggleCrop(c.id)}>
                <span class="nb-pill-dot"></span>
                <span class="nb-pill-name">{c.species?.name || c.speciesId}</span>
                <span class="nb-pill-stage">{c.planWhen || 'sem data'}</span>
              </button>
            {/each}
          </div>
          {#each planned.filter(c => c.id === pickedCrop) as c}
            <div class="nb-line nb-line-soft">{cropDetail(c)}</div>
          {/each}
        {:else}
          <div class="nb-line nb-line-soft">Nada planeado para este ciclo. Pergunta ao Sage o que entra quando algo sair.</div>
        {/if}
        <div class="nb-line nb-line-next">
          <span class="nb-when">{nextSeasonLabel()}</span>
          {avoid.length ? `evitar ${avoid.join(', ')}` : 'sem familias a evitar'}
        </div>
        {#if open?.scheme || bed.nextRotation}
          <button class="nb-more" on:click={() => { showScheme = !showScheme; }}>{showScheme ? 'menos' : 'notas do plano'}</button>
          {#if showScheme}
            {#if open?.scheme}<div class="nb-line nb-line-soft">{open.title}. {open.scheme}</div>{/if}
            {#if bed.nextRotation}<div class="nb-line nb-line-soft">{bed.nextRotation}</div>{/if}
          {/if}
        {/if}

        {#if warnings.length}
          <div class="bed-section-title">AVISOS</div>
          {#each warnings as w}
            <div class="nb-line nb-line-warn">{w}</div>
          {/each}
        {/if}

        {#if history.length}
          <div class="bed-section-title">ANTES</div>
          <div class="nb-timeline">
            {#each history as cycle (cycle.id)}
              <button class="nb-row" class:nb-row-failed={cycleFailed(cycle)} class:nb-row-open={openRow === cycle.id} on:click={() => toggleRow(cycle.id)}>
                <span class="nb-row-season">{seasonOf(cycle.title)}</span>
                <span class="nb-row-fams">
                  {#each cycleFamilies(cycle) as f}<span class="nb-fam">{f}</span>{/each}
                  {#if !cycleFamilies(cycle).length && descriptionOf(cycle.title)}<span class="nb-fam">{descriptionOf(cycle.title)}</span>{/if}
                  {#if cycleFailed(cycle)}<span class="nb-fam nb-fam-failed">FALHOU</span>{/if}
                </span>
              </button>
              {#if openRow === cycle.id}
                <div class="nb-row-detail">
                  <div class="nb-line">{cycle.title}</div>
                  {#each cycle.crops as c}
                    <div class="nb-line nb-line-soft">{c.species?.name || c.speciesId} · {OUTCOME_WORD[c.outcome] || c.outcome || '?'}{c.outOn ? ` em ${c.outOn}` : ''}{c.outcomeNote ? ` · ${c.outcomeNote}` : ''}</div>
                  {/each}
                  <div class="nb-line nb-line-soft">{cycle.startedOn || '?'} a {cycle.closedOn}</div>
                  {#if cycle.notes}<div class="nb-line nb-line-warn">{cycle.notes}</div>{/if}
                </div>
              {/if}
            {/each}
          </div>
        {/if}

        {#if diary.length}
          <button class="nb-more" on:click={() => { showDiary = !showDiary; }}>diario ({bed.diary.length}) {showDiary ? '−' : '+'}</button>
          {#if showDiary}
            {#each diary as d}
              <div class="nb-line nb-line-soft">{d.createdAt.slice(5, 10)} · {ACTIONS[d.action] || d.action} · {d.details || ''}</div>
            {/each}
          {/if}
        {/if}
        {#if bed.notes}
          <button class="nb-more" on:click={() => { showNotes = !showNotes; }}>notas do talhao {showNotes ? '−' : '+'}</button>
          {#if showNotes}<div class="nb-line nb-line-soft">{bed.notes}</div>{/if}
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .nb-head { display: flex; align-items: center; gap: 12px; margin: 4px 0 12px; }
  .nb-frame {
    width: 56px; height: 56px; flex: none; display: flex; align-items: center; justify-content: center;
    background: #cfeeff; border-radius: 4px; box-shadow: 0 0 0 2px var(--ink);
  }
  .nb-empty { font-family: 'Press Start 2P', monospace; color: #888; }
  .nb-head-meta { display: flex; flex-direction: column; gap: 6px; }
  .nb-vitals { font-family: 'VT323', monospace; font-size: 17px; display: flex; gap: 12px; flex-wrap: wrap; }

  .nb-pills { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
  .nb-pill {
    display: inline-flex; align-items: center; gap: 6px; padding: 5px 9px 5px 7px;
    background: #fff; border: none; border-radius: 14px; cursor: pointer; text-align: left;
    box-shadow: 0 0 0 2px var(--ink);
  }
  .nb-pill-on { background: #ffe16a; }
  .nb-pill-plan { background: #f4f4f4; box-shadow: none; outline: 2px dashed var(--ink); outline-offset: -1px; }
  .nb-pill-plan.nb-pill-on { background: #ffe16a; }
  .nb-when { font-family: 'Press Start 2P', monospace; font-size: 8px; color: #4f7d31; margin-right: 6px; }
  .nb-pill-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--pill); box-shadow: 0 0 0 1px rgba(0,0,0,0.3); }
  .nb-pill-name { font-family: 'Press Start 2P', monospace; font-size: 8px; color: var(--ink); }
  .nb-pill-stage { font-family: 'VT323', monospace; font-size: 14px; color: var(--text-soft); }

  .nb-fams { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 4px; }
  .nb-fam {
    font-family: 'VT323', monospace; font-size: 14px; color: var(--text-soft); font-style: italic;
    padding: 0 6px; border-radius: 3px; background: rgba(0,0,0,0.07);
  }
  .nb-fam-failed { color: #c73030; font-style: normal; font-family: 'Press Start 2P', monospace; font-size: 7px; padding: 2px 5px; background: #ffe2e2; }

  .nb-line { font-family: 'VT323', monospace; font-size: 17px; line-height: 1.25; color: var(--ink); margin: 4px 0; }
  .nb-line-soft { color: var(--text-soft); }
  .nb-line-warn { background: #ffe2e2; box-shadow: 0 0 0 2px #c73030; border-radius: 3px; padding: 4px 8px; }
  .nb-line-next { background: #e8ffe8; box-shadow: 0 0 0 2px #4f7d31; border-radius: 3px; padding: 4px 8px; }

  .nb-more {
    display: block; background: none; border: none; padding: 4px 0; cursor: pointer;
    font-family: 'Press Start 2P', monospace; font-size: 8px; color: var(--accent); letter-spacing: 0.5px;
  }
  .nb-more-inline { display: inline; padding: 0 0 0 6px; }

  .nb-timeline { display: flex; flex-direction: column; gap: 4px; border-left: 3px solid rgba(0,0,0,0.2); padding-left: 8px; }
  .nb-row {
    width: 100%; display: flex; justify-content: space-between; align-items: center; gap: 8px;
    background: #fff8dc; border: none; padding: 6px 8px; border-radius: 3px; cursor: pointer; text-align: left;
    box-shadow: 0 0 0 1px rgba(0,0,0,0.15);
  }
  .nb-row-open { background: #ffe16a; }
  .nb-row-failed { box-shadow: 0 0 0 2px #c73030; }
  .nb-row-season { font-family: 'Press Start 2P', monospace; font-size: 8px; color: var(--accent); line-height: 1.4; }
  .nb-row-fams { display: flex; flex-wrap: wrap; gap: 4px; justify-content: flex-end; }
  .nb-row-detail { padding: 2px 8px 6px; }
</style>
