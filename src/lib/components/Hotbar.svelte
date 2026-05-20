<script>
  import PixelPanel from './PixelPanel.svelte';
  import PlantSprite from './PlantSprite.svelte';
  import ToolIcon from './ToolIcon.svelte';
  import { PLANT_SPECIES } from '$lib/data/plant-species.js';

  export let harvested = {};

  const tools = [
    { id: 'water', label: 'REGAR' },
    { id: 'shovel', label: 'SACHAR' },
    { id: 'harvest', label: 'COLHEITA' },
  ];

  $: harvestedList = Object.entries(harvested).filter(([, n]) => n > 0).slice(0, 6);
</script>

<PixelPanel color="#3a4a3a" accent="#1d1d1d" padding={14}>
  <div class="hotbar">
    <div class="hotbar-tools">
      {#each tools as t}
        <div class="hotbar-slot">
          <ToolIcon kind={t.id} scale={3} />
          <div class="hotbar-label">{t.label}</div>
        </div>
      {/each}
    </div>

    <div class="hotbar-divider"></div>

    <div class="hotbar-seeds">
      <div class="hotbar-seedlabel" style="color: #fff;">COLHIDO HOJE</div>
      <div class="hotbar-seedslist">
        {#if harvestedList.length === 0}
          <div style="font-family: 'VT323', monospace; font-size: 18px; color: #a0b0a0;">
            Ainda nada — selecciona COLHEITA e toca numa cama madura.
          </div>
        {/if}
        {#each harvestedList as [species, n]}
          {@const s = PLANT_SPECIES[species]}
          {#if s}
            <div class="seed-chip">
              <PlantSprite kind={s.sprite} stage={3} scale={2} />
              <div class="seed-chip-label">{s.name}</div>
              <div class="seed-chip-count">×{n}</div>
            </div>
          {/if}
        {/each}
      </div>
    </div>
  </div>
</PixelPanel>
