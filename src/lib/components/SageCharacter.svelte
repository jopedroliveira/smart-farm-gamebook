<!--
  Sage assistant pixel-art character with idle animation.
-->
<script>
  import PixelSprite from './PixelSprite.svelte';
  import { SAGE_PALETTE, SAGE_IDLE_A, SAGE_IDLE_B, SAGE_TALK } from '$lib/data/sprites.js';
  import { onMount, onDestroy } from 'svelte';

  export let talking = false;
  export let size = 3;

  let frame = 0;
  let interval;

  onMount(() => {
    interval = setInterval(() => { frame = (frame + 1) % 2; }, 600);
  });
  onDestroy(() => clearInterval(interval));

  $: matrix = talking ? SAGE_TALK : (frame === 0 ? SAGE_IDLE_A : SAGE_IDLE_B);
</script>

<div class="sage-bob">
  <PixelSprite {matrix} palette={SAGE_PALETTE} scale={size} />
</div>

<style>
  .sage-bob {
    animation: sageBob 1.6s steps(2) infinite;
  }
  @keyframes sageBob {
    0%, 50% { transform: translateY(0); }
    50.01%, 100% { transform: translateY(-2px); }
  }
</style>
