<!--
  Modal disparado ao clicar no `!` amarelo de uma cama.
  Mostra o progresso de cada cultura na terra (germinacao -> pronta)
  e oferece um botao "IR COLHER" que faz walk-to-bed.
-->
<script>
  import { cropsIn, cropStage, cropDaysIn, cropGrowthDays } from '$lib/data/cycles.js';
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';

  export let bedId;
  export let state;

  const dispatch = createEventDispatcher();
  $: bed = state.beds.find(b => b.id === bedId);
  $: crops = bed ? cropsIn(bed) : [];

  function close() { dispatch('close'); }
  function goHarvest() { dispatch('goHarvest', bedId); }

  let keyHandler;
  onMount(() => {
    keyHandler = (e) => {
      if (['Escape', 'x', 'X'].includes(e.key)) {
        close();
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', keyHandler);
  });
  onDestroy(() => window.removeEventListener('keydown', keyHandler));

  const stageLabels = ['GERMINACAO', 'CRESCIMENTO', 'MATURACAO', 'PRONTA'];
  const stageColors = ['#7ec8a8', '#a4d96b', '#5cd96b', '#ffe16a'];

  function pct(c) {
    const days = cropDaysIn(c);
    return days === null ? 0 : Math.min(100, Math.round((days / cropGrowthDays(c)) * 100));
  }
</script>

{#if bed}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="info-modal-backdrop" on:click={close}>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="info-modal harvest-modal" on:click|stopPropagation>
      <div class="info-modal-bar" style="background: #ffe16a;">
        <div class="info-modal-title">⚠ {bed.notionCode} — PRONTA P/ COLHEITA</div>
        <button class="info-modal-close" on:click={close}>FECHAR ✕</button>
      </div>
      <div class="info-modal-body">
        <div class="harvest-intro">
          {crops.length} cultura{crops.length === 1 ? '' : 's'} na terra.
        </div>

        <div class="harvest-list">
          {#each crops as c}
            {@const stage = cropStage(c)}
            {@const days = cropDaysIn(c)}
            <div class="harvest-row">
              <div class="harvest-row-head">
                <div class="harvest-row-name">
                  <span>{c.species?.name || c.speciesId}</span>
                  <span class="harvest-row-count">×{c.count}</span>
                </div>
                <div class="harvest-row-stage" style:background={days === null ? '#e0e0e0' : stageColors[stage]}>
                  {days === null ? 'POR SEMEAR' : stageLabels[stage]}
                </div>
              </div>
              <div class="harvest-row-bar">
                <div
                  class="harvest-row-bar-fill"
                  style:width="{pct(c)}%"
                  style:background={stageColors[stage]}
                ></div>
              </div>
              <div class="harvest-row-meta">
                {c.species?.family || '—'} · ciclo {cropGrowthDays(c)} dias · {days === null ? 'sem data' : `${days} dias · ${pct(c)}%`}
              </div>
            </div>
          {/each}
        </div>

        <div class="harvest-actions">
          <button class="harvest-go-btn" on:click={goHarvest}>▶ IR COLHER</button>
          <button class="harvest-cancel-btn" on:click={close}>MAIS TARDE</button>
        </div>
      </div>
    </div>
  </div>
{/if}
