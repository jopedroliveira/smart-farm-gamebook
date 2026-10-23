<!--
  Modal showing a bed's timeline: open cycle and its crops, next plan, diary,
  previous cycles, notes and the live status.
-->
<script>
  import PlantSprite from './PlantSprite.svelte';
  import { bedStatusLabel, bedStage, weedColor, thirstColor } from '$lib/stores/farm.js';
  import { openCycle, closedCycles, cropsIn, cropStage, cropDaysIn, primaryCrop } from '$lib/data/cycles.js';

  export let bedId;
  export let state;

  const STAGES = ['germinacao', 'crescimento', 'maturacao', 'pronta'];
  const ACTIONS = { observacao: 'OBS', intervencao: 'INTERV', solo: 'SOLO', sachar: 'SACHAR', nota: 'NOTA' };

  $: bed = state.beds.find(b => b.id === bedId);
  $: primary = bed ? primaryCrop(bed) : null;
  $: stage = bed ? bedStage(bed) : 0;
  $: status = bed ? bedStatusLabel(bed) : '';
  $: open = bed ? openCycle(bed) : null;
  $: crops = bed ? cropsIn(bed) : [];
  $: history = bed ? closedCycles(bed) : [];
  $: diary = bed ? (bed.diary || []).slice(0, 5) : [];
  $: families = [...new Set(crops.map(c => c.species?.family).filter(Boolean))];

  function cropWhen(c) {
    if (!c.inOn) return 'por semear';
    const days = cropDaysIn(c);
    return `${c.method} em ${c.inOn} · ${STAGES[cropStage(c)]} · ${days}d`;
  }

  function cycleLine(cycle) {
    const names = cycle.crops.map(c => c.species?.name || c.speciesId);
    return names.length ? names.join(', ') : 'sem culturas registadas';
  }

  function failed(cycle) {
    return cycle.crops.some(c => c.outcome === 'falhada') || /falhad/i.test(cycle.title);
  }
</script>

{#if bed}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="info-modal-backdrop" on:click={() => { bedId = null; }}>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="info-modal" on:click|stopPropagation>
      <div class="info-modal-bar">
        <div class="info-modal-title">CADERNETA DA CAMA</div>
        <button class="info-modal-close" on:click={() => { bedId = null; }}>FECHAR ✕</button>
      </div>
      <div class="info-modal-body">
        <div class="bed-detail-portrait">
          <div class="portrait-frame">
            {#if primary}
              <PlantSprite kind={primary.species?.sprite || 'lettuce'} {stage} scale={5} />
            {:else}
              <div style="font-family: 'Press Start 2P', monospace; font-size: 11px; color: #888;">VAZIA</div>
            {/if}
          </div>
          <div class="portrait-meta">
            <div class="portrait-name" style="font-size: 13px;">{primary ? (primary.species?.name || primary.speciesId) : 'VAZIA'}</div>
            <div class="portrait-stage">{bed.notionCode} · {families.length} fam.</div>
            <div class="portrait-status status-{status.toLowerCase().replace(/[^a-z]/g,'')}">{status}</div>
          </div>
        </div>

        {#if open}
          <div class="bed-section-title">CICLO ABERTO</div>
          <div class="rotation-card">
            <div class="rotation-header">
              <div class="rotation-title">{open.title}</div>
              {#if open.startedOn}
                <div class="rotation-estado">desde {open.startedOn}</div>
              {:else}
                <div class="rotation-estado">planeado</div>
              {/if}
            </div>
            {#if open.scheme}
              <div class="bed-note-text" style="margin-bottom: 6px;">{open.scheme}</div>
            {/if}
            <div class="cultures-list">
              {#each crops as c}
                <div class="culture-row" style:border-left="4px solid {c.species?.color || '#5a8d3a'}">
                  <div class="culture-sprite">
                    <PlantSprite kind={c.species?.sprite || 'lettuce'} stage={cropStage(c)} scale={2} />
                  </div>
                  <div>
                    <div class="culture-name">
                      <span>{c.species?.name || c.speciesId}</span>
                    </div>
                    <div class="culture-family">{c.species?.family || '—'} · {c.role}</div>
                    <div class="culture-fn">{cropWhen(c)}</div>
                  </div>
                </div>
              {/each}
              {#if !crops.length}
                <div class="bed-note-text">Sem culturas na terra.</div>
              {/if}
            </div>
            {#if open.notes}
              <div class="bed-note-text bed-note-warn" style="margin-top: 6px;">{open.notes}</div>
            {/if}
          </div>
        {/if}

        {#if bed.nextRotation}
          <div class="bed-section-title">PROXIMO PLANO</div>
          <div class="bed-note-text bed-note-next">{bed.nextRotation}</div>
        {/if}

        {#if diary.length}
          <div class="bed-section-title">DIARIO</div>
          <div class="bed-history">
            {#each diary as d}
              <div class="history-row">
                <div class="history-season">{d.createdAt.slice(0, 10)} · {ACTIONS[d.action] || d.action}</div>
                <div class="history-plants">{d.details || '—'}</div>
              </div>
            {/each}
          </div>
        {/if}

        {#if history.length}
          <div class="bed-section-title">CICLOS ANTERIORES ({history.length})</div>
          <div class="bed-history">
            {#each history as cycle}
              <div class="history-row" class:history-failed={failed(cycle)}>
                <div class="history-season">
                  {cycle.title}
                  {#if failed(cycle)}
                    <span class="history-badge-failed">FALHADO</span>
                  {/if}
                </div>
                <div class="history-plants">{cycleLine(cycle)}</div>
                <div class="history-notes">{cycle.startedOn || '?'} a {cycle.closedOn}{cycle.notes ? ` · ${cycle.notes}` : ''}</div>
              </div>
            {/each}
          </div>
        {/if}

        {#if bed.notes}
          <div class="bed-section-title">NOTAS DO TALHAO</div>
          <div class="bed-note-text">{bed.notes}</div>
        {/if}

        <div class="bed-section-title">ESTADO</div>
        <div class="bed-detail-bars">
          <div class="bed-stat-row">
            <span class="bed-stat-label">REGA</span>
            <span class="bed-stat-val" style:color={thirstColor(bed)}>
              {bed.horasSemRega !== null ? `ha ${bed.horasSemRega}h` : 'sem dados HA'}
            </span>
          </div>
          <div class="bed-stat-row">
            <span class="bed-stat-label">ERVAS</span>
            <span class="bed-stat-val" style:color={weedColor(bed)}>
              {bed.diasSemSachar !== null ? `ha ${bed.diasSemSachar} dias` : 'nunca sachado'}
            </span>
          </div>
          {#if bed.litrosRega || bed.duracaoRegaMin}
            <div class="bed-stat-row">
              <span class="bed-stat-label">ULTIMA REGA</span>
              <span class="bed-stat-val">{bed.duracaoRegaMin ? `${bed.duracaoRegaMin} min` : ''}{bed.litrosRega ? ` · ~${bed.litrosRega} L` : ''}</span>
            </div>
          {/if}
          {#if bed.bateriaValvula !== null && bed.bateriaValvula !== undefined}
            <div class="bed-stat-row">
              <span class="bed-stat-label">BATERIA</span>
              <span class="bed-stat-val" style:color={bed.bateriaValvula < 20 ? '#ff5a5a' : '#5cd96b'}>{bed.bateriaValvula}%</span>
            </div>
          {/if}
          {#if bed.semAgua || bed.fugaAgua}
            <div class="bed-stat-row">
              <span class="bed-stat-label">AVISO</span>
              <span class="bed-stat-val" style:color="#ff5a5a">{[bed.semAgua ? 'sem agua' : null, bed.fugaAgua ? 'fuga' : null].filter(Boolean).join(' · ')}</span>
            </div>
          {/if}
          <div class="bed-stat-row">
            <span class="bed-stat-label">VALVULA</span>
            <span class="bed-stat-val" style:color={bed.valvula === 'on' ? '#4fc3f7' : '#999'}>
              {bed.valvula === 'on' ? 'ABERTA' : bed.valvula === 'off' ? 'FECHADA' : '--'}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .rotation-card {
    background: rgba(0, 0, 0, 0.06);
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: 6px;
    padding: 8px;
    margin-bottom: 8px;
  }
  .rotation-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }
  .rotation-title {
    font-family: 'Press Start 2P', monospace;
    font-size: 9px;
    color: var(--ink);
    line-height: 1.5;
  }
  .rotation-estado {
    font-family: 'Press Start 2P', monospace;
    font-size: 8px;
    color: var(--text-soft);
    background: rgba(0, 0, 0, 0.08);
    padding: 2px 6px;
    border-radius: 3px;
    white-space: nowrap;
  }
  .history-failed {
    border-left: 3px solid #ff7a7a;
    padding-left: 6px;
  }
  .history-badge-failed {
    font-family: 'Press Start 2P', monospace;
    font-size: 7px;
    color: #ff7a7a;
    background: rgba(255, 122, 122, 0.15);
    padding: 1px 4px;
    border-radius: 2px;
    margin-left: 6px;
  }
  .bed-stat-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }
  .bed-stat-label {
    font-family: 'Press Start 2P', monospace;
    font-size: 8px;
    color: var(--text-soft);
    letter-spacing: 0.5px;
  }
  .bed-stat-val {
    font-family: 'VT323', monospace;
    font-size: 18px;
  }
</style>
