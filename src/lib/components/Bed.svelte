<!--
  One raised bed on the farm map.
  Renders plant sprites inside a wooden frame with soil texture.
-->
<script>
  import PlantSprite from './PlantSprite.svelte';
  import { PLANT_SPECIES } from '$lib/data/plant-species.js';
  import { bedReady, bedHealth, bedStatusLabel, bedDaysSincePlanting, bedStage } from '$lib/stores/farm.js';
  import { bedCycleProgress, bedAvgCycle, speciesStage } from '$lib/data/beds.js';
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

  // Distribute cultures across tiles
  $: tilesAcross = Math.max(3, Math.floor(width / 30));
  $: totalTiles = tilesAcross * 2;
  $: tiles = (() => {
    if (!bed.plantings?.length) return [];
    const totalCount = bed.plantings.reduce((s, p) => s + p.count, 0);
    const sequence = [];
    bed.plantings.forEach(p => {
      const n = Math.max(1, Math.round((p.count / totalCount) * totalTiles));
      for (let i = 0; i < n; i++) sequence.push(p);
    });
    const result = [];
    for (let i = 0; i < totalTiles; i++) {
      result.push(sequence[i % sequence.length]);
    }
    return result;
  })();

  $: soilBg = bed.watered > 0.5
    ? 'linear-gradient(180deg, #5a3a1a, #3a2410)'
    : 'linear-gradient(180deg, #7a5a32, #5a3a1a)';

  $: statusBg = ready ? '#ffe16a'
    : status === 'SEDE' ? '#4fc3f7'
    : status === 'ERVAS' ? '#a4d96b'
    : status === 'PRAGAS' ? '#ff7a7a'
    : status === 'PRÓSPERA' ? '#5cd96b'
    : '#fff';

  $: progressBg = progress > 0.95 ? '#ffe16a'
    : progress > 0.55 ? '#5cd96b'
    : progress > 0.15 ? '#a4d96b'
    : '#7ec8a8';
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
          <div class="bed-monitor-label">ÁGUA</div>
          <div class="bed-monitor-val" style:color={bed.watered < 0.25 ? '#ff7a7a' : '#4fc3f7'}>
            {Math.round(bed.watered * 100)}<span class="bed-monitor-pct">%</span>
          </div>
        </div>
        <div class="bed-monitor-cell">
          <div class="bed-monitor-label">SOLO</div>
          <div class="bed-monitor-val" style:color="#a4d96b">
            {Math.round(bed.soilHealth * 100)}<span class="bed-monitor-pct">%</span>
          </div>
        </div>
        <div class="bed-monitor-cell">
          <div class="bed-monitor-label">ERVAS</div>
          <div class="bed-monitor-val" style:color={bed.weeds > 0.4 ? '#ffe16a' : '#7ec850'}>
            {Math.round(bed.weeds * 100)}<span class="bed-monitor-pct">%</span>
          </div>
        </div>
        <div class="bed-monitor-cell">
          <div class="bed-monitor-label">PRAGAS</div>
          <div class="bed-monitor-val" style:color={bed.pests > 0.4 ? '#ff7a7a' : '#5cd96b'}>
            {Math.round(bed.pests * 100)}<span class="bed-monitor-pct">%</span>
          </div>
        </div>
      </div>
    {/if}

    {#if bedMode === 'default' && bed.weeds > 0.3}
      <div class="weeds-overlay">
        {#each Array(Math.floor(bed.weeds * 6)) as _, i}
          <div style:position="absolute" style:left="{(i * 37) % 90 + 5}%" style:top="{(i * 53) % 80 + 10}%">
            <PlantSprite kind="weed" scale={1.5} />
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Status pill -->
  <div class="bed-status" style:background={statusBg}>
    {bed.notionCode} · {status}
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
      title="Pronta para colheita — clica para info"
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
