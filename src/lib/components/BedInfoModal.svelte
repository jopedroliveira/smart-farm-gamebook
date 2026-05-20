<!--
  Modal showing detailed info about a bed — cultures, notes, pest info, history, sensor bars.
-->
<script>
  import PlantSprite from './PlantSprite.svelte';
  import StatBar from './StatBar.svelte';
  import { PLANT_SPECIES } from '$lib/data/plant-species.js';
  import { bedReady, bedStatusLabel, bedDaysSincePlanting, bedDaysUntilHarvest, bedStage, bedPrimarySpecies } from '$lib/stores/farm.js';
  import { bedCycleProgress, bedAvgCycle } from '$lib/data/beds.js';

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
  $: families = bed?.plantings
    ? [...new Set(bed.plantings.map(p => PLANT_SPECIES[p.species]?.family).filter(Boolean))]
    : [];
</script>

{#if bed}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="info-modal-backdrop" on:click={() => { bedId = null; }}>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="info-modal" on:click|stopPropagation>
      <div class="info-modal-bar">
        <div class="info-modal-title">▶ {bed.notionCode} — {bed.widthM}×{bed.heightM}m</div>
        <button class="info-modal-close" on:click={() => { bedId = null; }}>FECHAR</button>
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
            <div class="portrait-stage">{bed.season || ''}</div>
            <div class="portrait-status status-{status.toLowerCase().replace(/[^a-z]/g,'')}">
              {bed.estado || status}
            </div>
          </div>
        </div>

        <!-- Dates -->
        <div class="bed-dates">
          <div class="bed-date-chip">
            <div class="bed-date-label">PLANTADA</div>
            <div class="bed-date-val">{bed.plantedDate || '—'}</div>
            {#if sincePlanting > 0}
              <div class="bed-date-sub">há {sincePlanting} dias</div>
            {/if}
          </div>
          <div class="bed-date-chip">
            <div class="bed-date-label">COLHEITA</div>
            <div class="bed-date-val">{bed.harvestStart || '—'}</div>
            {#if tilHarvest !== null}
              <div class="bed-date-sub">
                {tilHarvest > 0 ? `em ${tilHarvest} dias` : tilHarvest === 0 ? 'HOJE' : `há ${-tilHarvest} dias`}
              </div>
            {/if}
          </div>
          <div class="bed-date-chip">
            <div class="bed-date-label">ROTAÇÃO</div>
            <div class="bed-date-val" style="font-size: 11px;">{(bed.rotation || '—').replace(/^\d+ - /, '')}</div>
            <div class="bed-date-sub">{families.length} fam.</div>
          </div>
        </div>

        <!-- Cultures -->
        <div class="bed-section-title">CULTURAS ({bed.plantings?.length || 0})</div>
        <div class="cultures-list">
          {#each bed.plantings || [] as p}
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

        {#if bed.notes}
          <div class="bed-section-title">NOTAS</div>
          <div class="bed-note-text">{bed.notes}</div>
        {/if}

        {#if bed.pestNotes}
          <div class="bed-section-title">PRAGAS & SAÚDE</div>
          <div class="bed-note-text bed-note-warn">{bed.pestNotes}</div>
        {/if}

        {#if bed.nextRotation}
          <div class="bed-section-title">PRÓXIMA ROTAÇÃO</div>
          <div class="bed-note-text bed-note-next">{bed.nextRotation}</div>
        {/if}

        {#if bed.history?.length}
          <div class="bed-section-title">HISTÓRICO</div>
          <div class="bed-history">
            {#each bed.history as h}
              <div class="history-row">
                <div class="history-season">{h.season}</div>
                <div class="history-plants">{h.plants.join(', ')}</div>
                {#if h.notes}
                  <div class="history-notes">{h.notes}</div>
                {/if}
              </div>
            {/each}
          </div>
        {/if}

        <!-- Sensors -->
        <div class="bed-section-title">SENSORES</div>
        <div class="bed-detail-bars">
          <StatBar label="ÁGUA" value={bed.watered} color="#4fc3f7" />
          <StatBar label="SOLO" value={bed.soilHealth} color="#a4682a" />
          <StatBar label="ERVAS" value={bed.weeds} color="#7ec850" />
          <StatBar label="PRAGAS" value={bed.pests} color="#ff7a7a" />
        </div>
      </div>
    </div>
  </div>
{/if}
