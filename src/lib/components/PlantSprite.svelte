<script>
  import PixelSprite from './PixelSprite.svelte';
  import { PLANTS, PLANT_PALETTE, WEED_SPRITE, COMPOST_SPRITE } from '$lib/data/sprites.js';

  export let kind;
  export let stage = 3;
  export let scale = 3;
</script>

{#if kind === 'weed'}
  <PixelSprite matrix={WEED_SPRITE} palette={PLANT_PALETTE} {scale} />
{:else if kind === 'compost'}
  <PixelSprite matrix={COMPOST_SPRITE} palette={PLANT_PALETTE} {scale} />
{:else if PLANTS[kind]}
  {@const p = PLANTS[kind]}
  {@const s = Math.min(stage, p.stages.length - 1)}
  <PixelSprite matrix={p.stages[s]} palette={PLANT_PALETTE} {scale} />
{/if}
