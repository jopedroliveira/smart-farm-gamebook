<!--
  Chunky pixel-bordered panel (retro RPG dialog look).
  In Svelte, <slot /> is where child content goes (like {children} in React).
-->
<script>
  export let color = '#fff';
  export let accent = '#1d1d1d';
  export let radius = 8;
  export let padding = 16;
  export let clickable = false;
</script>

<div
  class="pixel-panel"
  class:clickable
  style:background={color}
  style:padding="{padding}px"
  style:border-radius="{radius}px"
  style:--accent={accent}
  on:click
  role={clickable ? 'button' : undefined}
  tabindex={clickable ? 0 : undefined}
>
  <slot />
</div>

<style>
  .pixel-panel {
    position: relative;
    box-shadow:
      0 0 0 4px var(--accent),
      inset 0 0 0 2px rgba(255, 255, 255, 0.6),
      0 6px 0 0 var(--accent);
    font-family: 'Press Start 2P', monospace;
    color: var(--accent);
  }
  .clickable {
    cursor: pointer;
  }
</style>
