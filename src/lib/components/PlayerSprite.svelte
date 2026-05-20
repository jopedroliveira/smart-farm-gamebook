<script>
  import PixelSprite from './PixelSprite.svelte';
  import { PLAYER_PALETTE, PLAYER_DOWN_A, PLAYER_DOWN_B } from '$lib/data/sprites.js';
  import { onMount, onDestroy } from 'svelte';

  export let dir = 'down';
  export let walking = false;
  export let scale = 3;

  let frame = 0;
  let interval;

  onMount(() => {
    interval = setInterval(() => { frame = (frame + 1) % 2; }, 200);
  });
  onDestroy(() => clearInterval(interval));

  // For simplicity, only using down sprites (the original has up/left/right too)
  $: matrix = walking && frame === 1 ? PLAYER_DOWN_B : PLAYER_DOWN_A;
</script>

<PixelSprite {matrix} palette={PLAYER_PALETTE} {scale} />
