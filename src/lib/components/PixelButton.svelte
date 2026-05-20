<script>
  export let color = '#fff';
  export let accent = '#1d1d1d';
  export let active = false;
  export let disabled = false;
  export let size = 'md';

  const sizes = {
    sm: { padding: '8px 12px', fontSize: '11px' },
    md: { padding: '12px 16px', fontSize: '12px' },
    lg: { padding: '14px 20px', fontSize: '14px' },
  };

  $: s = sizes[size] || sizes.md;
</script>

<button
  class="pixel-btn"
  class:active
  {disabled}
  style:background={active ? '#ffe16a' : color}
  style:color={accent}
  style:padding={s.padding}
  style:font-size={s.fontSize}
  style:--accent={accent}
  on:click
>
  <slot />
</button>

<style>
  .pixel-btn {
    position: relative;
    font-family: 'Press Start 2P', monospace;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    box-shadow:
      0 0 0 3px var(--accent),
      inset 0 0 0 2px rgba(255, 255, 255, 0.55),
      0 4px 0 0 var(--accent);
    letter-spacing: 0.5px;
    text-transform: uppercase;
    transform: translateY(0);
    transition: transform 80ms;
  }
  .pixel-btn:hover:not(:disabled) {
    transform: translateY(-1px);
  }
  .pixel-btn:active:not(:disabled) {
    transform: translateY(2px);
    box-shadow:
      0 0 0 3px var(--accent),
      inset 0 0 0 2px rgba(255, 255, 255, 0.55);
  }
  .pixel-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .pixel-btn.active {
    box-shadow:
      0 0 0 3px var(--accent),
      inset 0 0 0 2px rgba(255, 255, 255, 0.55),
      0 0 0 6px #f7c948;
    transform: translateY(2px);
  }
</style>
