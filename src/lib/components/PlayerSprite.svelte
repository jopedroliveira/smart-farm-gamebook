<script>
  import PixelSprite from './PixelSprite.svelte';
  import {
    PLAYER_PALETTE,
    PLAYER_DOWN_A, PLAYER_DOWN_B,
    PLAYER_UP_A, PLAYER_UP_B,
    PLAYER_SIDE_A, PLAYER_SIDE_B,
  } from '$lib/data/sprites.js';
  import { onMount, onDestroy } from 'svelte';

  export let dir = 'down';
  export let walking = false;
  export let scale = 3;

  let frame = 0;
  let interval;

  onMount(() => {
    interval = setInterval(() => { frame = (frame + 1) % 2; }, 180);
  });
  onDestroy(() => clearInterval(interval));

  const sprites = {
    down:  [PLAYER_DOWN_A, PLAYER_DOWN_B],
    up:    [PLAYER_UP_A, PLAYER_UP_B],
    right: [PLAYER_SIDE_A, PLAYER_SIDE_B],
    left:  [PLAYER_SIDE_A, PLAYER_SIDE_B],
  };

  $: flip = dir === 'left';
  $: matrix = (sprites[dir] || sprites.down)[walking ? frame : 0];
</script>

<div style:transform={flip ? 'scaleX(-1)' : 'none'} style:image-rendering="pixelated">
  <PixelSprite {matrix} palette={PLAYER_PALETTE} {scale} />
</div>
