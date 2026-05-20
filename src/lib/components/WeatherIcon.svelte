<script>
  import PixelSprite from './PixelSprite.svelte';
  import { WEATHER_SPRITES, WEATHER_PALETTE } from '$lib/data/sprites.js';

  export let kind = 'sunny';
  export let scale = 3;

  $: matrix = WEATHER_SPRITES[kind] || WEATHER_SPRITES.sunny;
</script>

<PixelSprite {matrix} palette={WEATHER_PALETTE} {scale} />
