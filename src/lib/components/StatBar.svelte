<!--
  Health bar / moisture bar — chunky pixel style.
  Svelte note: `$:` marks a reactive declaration — it re-runs whenever its dependencies change.
-->
<script>
  export let value = 0;
  export let max = 1;
  export let color = '#5cd96b';
  export let height = 18;
  export let label = '';
  export let icon = '';
  export let accent = '#1d1d1d';

  $: pct = Math.max(0, Math.min(1, value / max));

  function shade(hex, amt) {
    const c = hex.replace('#', '');
    const num = parseInt(c, 16);
    let r = (num >> 16) & 0xff;
    let g = (num >> 8) & 0xff;
    let b = num & 0xff;
    r = Math.max(0, Math.min(255, Math.round(r + 255 * amt)));
    g = Math.max(0, Math.min(255, Math.round(g + 255 * amt)));
    b = Math.max(0, Math.min(255, Math.round(b + 255 * amt)));
    return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
  }
</script>

<div class="stat-bar-wrap">
  {#if icon}
    <span class="stat-icon">{icon}</span>
  {/if}
  {#if label}
    <div class="stat-label" style:color={accent}>{label}</div>
  {/if}
  <div class="stat-track" style:height="{height}px" style:--accent={accent}>
    <div
      class="stat-fill"
      style:width="calc((100% - 8px) * {pct})"
      style:background="repeating-linear-gradient(90deg, {color} 0 4px, {shade(color, -0.15)} 4px 8px)"
      style:box-shadow="inset 0 -3px 0 {shade(color, -0.25)}, inset 0 2px 0 {shade(color, 0.3)}"
    ></div>
  </div>
</div>

<style>
  .stat-bar-wrap {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
  }
  .stat-icon {
    font-size: 16px;
  }
  .stat-label {
    font-family: 'Press Start 2P', monospace;
    font-size: 10px;
    min-width: 64px;
    letter-spacing: 0.5px;
  }
  .stat-track {
    position: relative;
    flex: 1;
    background: #2e2e2e;
    box-shadow: inset 0 0 0 2px var(--accent), inset 0 0 0 4px #5a5a5a;
    border-radius: 3px;
    overflow: hidden;
  }
  .stat-fill {
    position: absolute;
    inset: 4px;
    transition: width 250ms steps(8);
  }
</style>
