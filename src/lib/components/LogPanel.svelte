<script>
  import PixelPanel from './PixelPanel.svelte';

  export let log = [];
</script>

<PixelPanel color="#1d2d1a" accent="#4f7d31">
  <div class="heading">▶ LOG</div>
  <div class="logbody">
    {#each log as entry}
      <span class="log-entry">
        <span class="log-time">[{entry.t}]</span> {entry.msg}
      </span>
    {/each}
  </div>
</PixelPanel>

<style>
  .heading {
    font-family: 'Press Start 2P', monospace;
    font-size: 13px;
    letter-spacing: 1px;
    margin-bottom: 8px;
    color: #c4ff8b;
  }
</style>
