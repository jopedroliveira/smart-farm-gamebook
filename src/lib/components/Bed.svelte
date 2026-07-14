<!--
  One raised bed on the farm map.
  Renders plant sprites inside a wooden frame with soil texture.
-->
<script>
  import PlantSprite from './PlantSprite.svelte';
  import { PLANT_SPECIES } from '$lib/data/plant-species.js';
  import { bedReady, bedStatusLabel, bedDaysSincePlanting, weedLevel, weedColor, thirstColor } from '$lib/stores/farm.js';
  import { bedCycleProgress, bedAvgCycle, speciesStage, activeRotations } from '$lib/data/beds.js';
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  export let bed;
  export let x;
  export let y;
  export let width;
  export let height;
  export let selected = false;
  export let highlighted = false;
  export let bedMode = 'default';

  $: ready = bedReady(bed);
  $: status = bedStatusLabel(bed);
  $: sincePlanting = bedDaysSincePlanting(bed) || 0;
  $: progress = bedCycleProgress(bed);
  $: active = activeRotations(bed);
  $: plantings = bed.allPlantings || [];

  // Distribute cultures across tiles (from all active rotations)
  $: tilesAcross = Math.max(3, Math.floor(width / 30));
  $: totalTiles = tilesAcross * 2;
  $: tiles = (() => {
    if (!plantings.length) return [];
    const totalCount = plantings.reduce((s, p) => s + p.count, 0);
    const sequence = [];
    plantings.forEach(p => {
      const n = Math.max(1, Math.round((p.count / totalCount) * totalTiles));
      for (let i = 0; i < n; i++) sequence.push(p);
    });
    const result = [];
    for (let i = 0; i < totalTiles; i++) {
      result.push(sequence[i % sequence.length]);
    }
    return result;
  })();

  $: soilBg = 'linear-gradient(180deg, #5a3a1a, #3a2410)';

  $: statusBg = ready ? '#ffe16a'
    : status === 'SEDE' || status === 'REGAR' ? thirstColor(bed)
    : status === 'ERVAS' ? weedColor(bed)
    : status === 'VAZIA' ? '#e0e0e0'
    : '#5cd96b';

  $: progressBg = progress > 0.95 ? '#ffe16a'
    : progress > 0.55 ? '#5cd96b'
    : progress > 0.15 ? '#a4d96b'
    : '#7ec8a8';

  $: wl = weedLevel(bed);
  $: showWeeds = wl === 'yellow' || wl === 'orange' || wl === 'red' || wl === 'brown';
  $: weedCount = wl === 'yellow' ? 1 : wl === 'orange' ? 2 : wl === 'red' ? 3 : wl === 'brown' ? 5 : 0;
</script>

<div
  class="bed"
  class:bed-selected={selected}
  class:bed-ready={ready}
  class:bed-highlighted={highlighted}
  style:left="{x}px"
  style:top="{y}px"
  style:width="{width}px"
  style:height="{height}px"
  on:click
>
  <div class="bed-frame"></div>
  <div class="bed-soil" style:background={soilBg}>
    {#if bedMode === 'default'}
      <div class="bed-tiles" style:grid-template-columns="repeat({tilesAcross}, 1fr)">
        {#each tiles as p, i}
          {@const species = PLANT_SPECIES[p.species]}
          {@const spriteKind = species ? species.sprite : 'lettuce'}
          {@const stage = speciesStage(p.species, sincePlanting)}
          <div class="bed-tile" title={species ? species.name : ''}>
            <PlantSprite kind={spriteKind} {stage} scale={2} />
          </div>
        {/each}
        {#if tiles.length === 0}
          <div class="bed-tile" style:grid-column="1 / -1">
            <div class="empty-label">VAZIA</div>
          </div>
        {/if}
      </div>
    {:else}
      <div class="bed-monitor">
        <div class="bed-monitor-cell">
          <div class="bed-monitor-label">REGA</div>
          <div class="bed-monitor-val" style:color={thirstColor(bed)}>
            {#if bed.horasSemRega !== null}
              {bed.horasSemRega}<span class="bed-monitor-pct">h</span>
            {:else}
              --
            {/if}
          </div>
        </div>
        <div class="bed-monitor-cell">
          <div class="bed-monitor-label">ERVAS</div>
          <div class="bed-monitor-val" style:color={weedColor(bed)}>
            {#if bed.diasSemSachar !== null}
              {bed.diasSemSachar}<span class="bed-monitor-pct">d</span>
            {:else}
              --
            {/if}
          </div>
        </div>
        <div class="bed-monitor-cell">
          <div class="bed-monitor-label">VALVULA</div>
          <div class="bed-monitor-val" style:color={bed.valvula === 'on' ? '#4fc3f7' : '#999'}>
            {bed.valvula === 'on' ? 'ON' : bed.valvula === 'off' ? 'OFF' : '--'}
          </div>
        </div>
      </div>
    {/if}

    {#if bedMode === 'default' && showWeeds}
      <div class="weeds-overlay">
        {#each Array(weedCount) as _, i}
          <div style:position="absolute" style:left="{(i * 37) % 90 + 5}%" style:top="{(i * 53) % 80 + 10}%">
            <PlantSprite kind="weed" scale={1.5} />
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Status pill -->
  <div class="bed-status" style:background={statusBg}>
    {bed.notionCode} · {status}{active.length > 1 ? ` (${active.length} rot.)` : ''}
  </div>

  <!-- Progress micro bar -->
  <div class="bed-microbar" title="Ciclo: {Math.round(progress * 100)}% ({sincePlanting}/{bedAvgCycle(bed)} dias)">
    <div class="bed-microbar-fill" style:width="{progress * 100}%" style:background={progressBg}></div>
  </div>

  <!-- Dimensions tag -->
  {#if bedMode === 'default'}
    <div class="bed-dims">{bed.widthM}×{bed.heightM}m</div>
  {/if}

  <!-- Harvest sparkle -->
  {#if ready}
    <div
      class="bed-ready-sparkle"
      on:click|stopPropagation={() => dispatch('sparkleClick')}
      title="Pronta para colheita"
    >!</div>
  {/if}
</div>

<style>
  .empty-label {
    font-family: 'Press Start 2P', monospace;
    font-size: 10px;
    color: #fff;
    opacity: 0.85;
  }
</style>
