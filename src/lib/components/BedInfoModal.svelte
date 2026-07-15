<!--
  Modal showing detailed info about a bed: rotations (active + historical), notes, status.
-->
<script>
  import PlantSprite from './PlantSprite.svelte';
  import { PLANT_SPECIES } from '$lib/data/plant-species.js';
  import { bedReady, bedStatusLabel, bedDaysSincePlanting, bedDaysUntilHarvest, bedStage, bedPrimarySpecies, weedLevel, weedColor, thirstLevel, thirstColor } from '$lib/stores/farm.js';
  import { bedCycleProgress, bedAvgCycle, activeRotations, daysSince, daysUntil } from '$lib/data/beds.js';

  export let bedId;
  export let state;

  $: bed = state.beds.find(b => b.id === bedId);
  $: primary = bed ? bedPrimarySpecies(bed) : null;
  $: primarySpecies = primary ? PLANT_SPECIES[primary.species] : null;
  $: stage = bed ? bedStage(bed) : 0;
  $: ready = bed ? bedReady(bed) : false;
  $: status = bed ? bedStatusLabel(bed) : '';
  $: sincePlanting = bed ? bedDaysSincePlanting(bed) : 0;
  $: tilHarvest = bed ? bedDaysUntilHarvest(bed) : null;

  $: active = bed ? activeRotations(bed) : [];
  $: historical = bed ? (bed.rotations || []).filter(r => r.estado === 'Terminado' || r.estado === 'Em repouso') : [];
  $: planned = bed ? (bed.rotations || []).filter(r => r.estado === 'Planeado') : [];

  $: allFamilies = (() => {
    const plantings = active.flatMap(r => r.plantings || []);
    return [...new Set(plantings.map(p => PLANT_SPECIES[p.species]?.family).filter(Boolean))];
  })();
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
        <!-- Portrait row -->
        <div class="bed-detail-portrait">
          <div class="portrait-frame">
            {#if primary && primarySpecies}
              <PlantSprite kind={primarySpecies.sprite} {stage} scale={5} />
            {:else}
              <div style="font-family: 'Press Start 2P', monospace; font-size: 11px; color: #888;">VAZIA</div>
            {/if}
          </div>
          <div class="portrait-meta">
            <div class="portrait-name" style="font-size: 13px;">{primary ? primarySpecies?.name : 'VAZIA'}</div>
            <div class="portrait-stage">{bed.notionCode} · {allFamilies.length} fam.</div>
            <div class="portrait-status status-{status.toLowerCase().replace(/[^a-z]/g,'')}">
              {status}{active.length > 1 ? ` (${active.length} rotações)` : ''}
            </div>
          </div>
        </div>

        <!-- Active rotations -->
        {#if active.length > 0}
          <div class="bed-section-title">ROTAÇÕES ATIVAS ({active.length})</div>
          {#each active as rot}
            <div class="rotation-card">
              <div class="rotation-header">
                <div class="rotation-title">{rot.title || rot.season || 'Rotação'}</div>
                <div class="rotation-estado" class:rotation-colher={rot.estado === 'A colher'}>
                  {rot.estado}
                </div>
              </div>

              <div class="bed-dates">
                <div class="bed-date-chip">
                  <div class="bed-date-label">PLANTADA</div>
                  <div class="bed-date-val">{rot.plantedDate || '—'}</div>
                  {#if rot.plantedDate}
                    {@const since = daysSince(rot.plantedDate)}
                    {#if since > 0}
                      <div class="bed-date-sub">há {since} dias</div>
                    {/if}
                  {/if}
                </div>
                <div class="bed-date-chip">
                  <div class="bed-date-label">COLHEITA</div>
                  <div class="bed-date-val">{rot.harvestStart || '—'}</div>
                  {#if rot.harvestStart}
                    {@const til = daysUntil(rot.harvestStart)}
                    <div class="bed-date-sub">
                      {til > 0 ? `em ${til} dias` : til === 0 ? 'HOJE' : `há ${-til} dias`}
                    </div>
                  {/if}
                </div>
                <div class="bed-date-chip">
                  <div class="bed-date-label">ROTAÇÃO</div>
                  <div class="bed-date-val" style="font-size: 11px;">{(rot.rotation || '—').replace(/^\d+ - /, '')}</div>
                </div>
              </div>

              <div class="cultures-list">
                {#each rot.plantings || [] as p}
                  {@const s = PLANT_SPECIES[p.species]}
                  {#if s}
                    <div class="culture-row" style:border-left="4px solid {s.color}">
                      <div class="culture-sprite">
                        <PlantSprite kind={s.sprite} stage={3} scale={2} />
                      </div>
                      <div>
                        <div class="culture-name">
                          <span>{s.name}</span>
                          <span class="culture-count">×{p.count}</span>
                        </div>
                        <div class="culture-family">{s.family}</div>
                        <div class="culture-fn">{p.fn}</div>
                      </div>
                    </div>
                  {/if}
                {/each}
              </div>

              {#if rot.pestNotes}
                <div class="bed-note-text bed-note-warn" style="margin-top: 6px;">{rot.pestNotes}</div>
              {/if}
              {#if rot.notes}
                <div class="bed-note-text" style="margin-top: 4px;">{rot.notes}</div>
              {/if}
            </div>
          {/each}
        {/if}

        <!-- Planned rotations -->
        {#if planned.length > 0}
          <div class="bed-section-title">PLANEADO ({planned.length})</div>
          {#each planned as rot}
            <div class="rotation-card rotation-planned">
              <div class="rotation-header">
                <div class="rotation-title">{rot.title || rot.season || 'Rotação'}</div>
                <div class="rotation-estado">Planeado</div>
              </div>
              {#if rot.notes}
                <div class="bed-note-text">{rot.notes}</div>
              {/if}
            </div>
          {/each}
        {/if}

        {#if bed.notes}
          <div class="bed-section-title">NOTAS DO TALHÃO</div>
          <div class="bed-note-text">{bed.notes}</div>
        {/if}

        {#if bed.nextRotation}
          <div class="bed-section-title">PRÓXIMA ROTAÇÃO</div>
          <div class="bed-note-text bed-note-next">{bed.nextRotation}</div>
        {/if}

        <!-- Historical rotations -->
        {#if historical.length > 0}
          <div class="bed-section-title">HISTÓRICO ({historical.length})</div>
          <div class="bed-history">
            {#each historical as rot}
              <div class="history-row" class:history-failed={rot.failed}>
                <div class="history-season">
                  {rot.title || rot.season || '—'}
                  {#if rot.failed}
                    <span class="history-badge-failed">FALHADO</span>
                  {/if}
                </div>
                {#if rot.plantings?.length}
                  <div class="history-plants">
                    {rot.plantings.map(p => PLANT_SPECIES[p.species]?.name || p.species).join(', ')}
                  </div>
                {/if}
                {#if rot.notes}
                  <div class="history-notes">{rot.notes}</div>
                {/if}
              </div>
            {/each}
          </div>
        {/if}

        <!-- Estado -->
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
    background: rgba(0, 0, 0, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 6px;
    padding: 8px;
    margin-bottom: 8px;
  }
  .rotation-planned {
    opacity: 0.7;
    border-style: dashed;
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
    color: #e8d8a0;
  }
  .rotation-estado {
    font-family: 'Press Start 2P', monospace;
    font-size: 8px;
    color: #aaa;
    background: rgba(255, 255, 255, 0.08);
    padding: 2px 6px;
    border-radius: 3px;
  }
  .rotation-colher {
    color: #ffe16a;
    background: rgba(255, 225, 106, 0.15);
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
    color: #aaa;
    letter-spacing: 0.5px;
  }
  .bed-stat-val {
    font-family: 'VT323', monospace;
    font-size: 18px;
  }
</style>
