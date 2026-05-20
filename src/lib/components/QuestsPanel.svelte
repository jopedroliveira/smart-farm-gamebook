<script>
  import PixelPanel from './PixelPanel.svelte';

  export let quests = [];
</script>

<PixelPanel color="#fff" accent="#1d1d1d">
  <div class="heading">▶ MISSÕES</div>
  <div class="quests-list">
    {#each quests as q}
      <div class="quest" class:quest-done={q.done}>
        <div class="quest-check" style:background={q.done ? '#5cd96b' : '#fff'}>
          {q.done ? '✓' : ''}
        </div>
        <div>
          <div class="quest-text">{q.text}</div>
          <div class="quest-meta">
            {q.prog}/{q.goal} · {q.reward}🪙
          </div>
        </div>
      </div>
    {/each}
  </div>
</PixelPanel>

<style>
  .heading {
    font-family: 'Press Start 2P', monospace;
    font-size: 13px;
    letter-spacing: 1px;
    margin-bottom: 4px;
    color: #1d1d1d;
  }
</style>
