<!--
  Renders a pixel-art sprite using CSS box-shadow on a 1×1 element.
  Each cell in the matrix maps to a color in the palette.
  '.' or ' ' = transparent.

  Svelte note: this is a "component". Unlike React where you'd write
  <PixelSprite matrix={m} palette={p} />, Svelte uses the same syntax
  but the component is defined in a .svelte file with <script>, markup, and <style>.
-->
<script>
  import { PIXEL } from '$lib/data/sprites.js';

  /** @type {string[]} */
  export let matrix;
  /** @type {Record<string, string>} */
  export let palette;
  /** @type {number} */
  export let scale = PIXEL;

  // Compute the box-shadow string from the matrix
  $: rows = matrix.length;
  $: cols = matrix[0]?.length ?? 0;
  $: shadows = (() => {
    const parts = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const c = matrix[y][x];
        if (c === '.' || c === ' ') continue;
        const color = palette[c];
        if (!color) continue;
        parts.push(`${x * scale}px ${y * scale}px 0 ${color}`);
      }
    }
    return parts.join(', ');
  })();
</script>

<div
  class="pixel-sprite"
  style:width="{cols * scale}px"
  style:height="{rows * scale}px"
>
  <div
    class="pixel-dot"
    style:width="{scale}px"
    style:height="{scale}px"
    style:box-shadow={shadows}
  ></div>
</div>

<style>
  .pixel-sprite {
    position: relative;
  }
  .pixel-dot {
    position: absolute;
    left: 0;
    top: 0;
  }
</style>
