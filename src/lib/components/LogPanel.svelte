<script>
  import PixelPanel from './PixelPanel.svelte';

  export let log = [];
</script>

<div class="panel-wrap">
  <PixelPanel color="#1d2d1a" accent="#4f7d31">
    <div class="heading">▶ DIÁRIO DA HORTA</div>
    <div class="logbody">
      {#each log as entry}
        <span class="log-entry">
          <span class="log-time">[{entry.t}]</span> {entry.msg}
        </span>
      {/each}
    </div>
  </PixelPanel>
</div>

<style>
  .panel-wrap {
    border-left: 6px solid #a4f96b;
  }
  .heading {
    font-family: 'Press Start 2P', monospace;
    font-size: 13px;
    letter-spacing: 1px;
    margin-bottom: 8px;
    color: #c4ff8b;
  }
</style>
