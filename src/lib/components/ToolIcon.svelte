<script>
  import PixelSprite from './PixelSprite.svelte';
  import { TOOL_SPRITES, TOOL_PALETTE } from '$lib/data/sprites.js';

  export let kind;
  export let scale = 3;
</script>

{#if TOOL_SPRITES[kind]}
  <PixelSprite matrix={TOOL_SPRITES[kind]} palette={TOOL_PALETTE} {scale} />
{/if}
