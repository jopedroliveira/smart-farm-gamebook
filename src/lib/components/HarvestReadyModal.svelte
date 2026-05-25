<!--
  Modal disparado ao clicar no `!` amarelo de uma cama.
  Mostra o progresso de cada cultura na cama (germinação → maturação → pronto)
  e oferece um botão "IR COLHER" que faz walk-to-bed.
-->
<script>
  import { PLANT_SPECIES } from '$lib/data/plant-species.js';
  import { bedDaysSincePlanting, bedDaysUntilHarvest } from '$lib/stores/farm.js';
  import { speciesStage } from '$lib/data/beds.js';
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';

  export let bedId;
  export let state;

  const dispatch = createEventDispatcher();
  $: bed = state.beds.find(b => b.id === bedId);
  $: since = bed ? bedDaysSincePlanting(bed) || 0 : 0;
  $: tilHarvest = bed ? bedDaysUntilHarvest(bed) : null;

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

  const stageLabels = ['GERMINAÇÃO', 'CRESCIMENTO', 'MATURAÇÃO', 'PRONTO'];
  const stageColors = ['#7ec8a8', '#a4d96b', '#5cd96b', '#ffe16a'];
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
          Esta cama está em <strong>{bed.estado}</strong>. Plantada há
          <strong>{since} dias</strong>{#if tilHarvest !== null} · janela
          {tilHarvest >= 0 ? `começa em ${tilHarvest} dias` : `aberta há ${-tilHarvest} dias`}{/if}.
        </div>

        <div class="harvest-list">
          {#each bed.plantings as p}
            {@const s = PLANT_SPECIES[p.species]}
            {#if s}
              {@const stage = speciesStage(p.species, since)}
              {@const pct = Math.min(100, Math.round((since / s.growthDays) * 100))}
              <div class="harvest-row">
                <div class="harvest-row-head">
                  <div class="harvest-row-name">
                    <span>{s.name}</span>
                    <span class="harvest-row-count">×{p.count}</span>
                  </div>
                  <div class="harvest-row-stage" style:background={stageColors[stage]}>
                    {stageLabels[stage]}
                  </div>
                </div>
                <div class="harvest-row-bar">
                  <div
                    class="harvest-row-bar-fill"
                    style:width="{pct}%"
                    style:background={stageColors[stage]}
                  ></div>
                </div>
                <div class="harvest-row-meta">
                  {s.family} · ciclo {s.growthDays} dias · {pct}% completo
                </div>
              </div>
            {/if}
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
