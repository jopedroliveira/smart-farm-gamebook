<script>
  export let icon = '';
  export let value = '';
  export let color = '#ffe16a';
  export let accent = '#1d1d1d';
</script>

<div class="badge" style:background={color} style:--accent={accent}>
  {#if icon}<span class="badge-icon">{icon}</span>{/if}
  <span>{value}</span>
</div>

<style>
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    border-radius: 4px;
    box-shadow: 0 0 0 3px var(--accent), inset 0 0 0 2px rgba(255,255,255,0.6), 0 3px 0 var(--accent);
    font-family: 'Press Start 2P', monospace;
    font-size: 12px;
    color: var(--accent);
  }
  .badge-icon {
    font-size: 16px;
  }
</style>
