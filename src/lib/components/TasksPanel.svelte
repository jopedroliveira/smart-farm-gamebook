<script>
  import PixelPanel from './PixelPanel.svelte';
  import { createEventDispatcher } from 'svelte';

  export let tasks = [];

  const dispatch = createEventDispatcher();

  let newTaskText = '';
  let showInput = false;

  $: autoTasks = tasks.filter(t => t.source === 'auto' && !t.done);
  $: planTasks = tasks.filter(t => (t.source === 'sage' || t.source === 'manual') && !t.done);
  $: doneTasks = tasks.filter(t => t.done);
  $: openCount = tasks.filter(t => !t.done).length;

  function srcLabel(source) {
    if (source === 'auto') return 'AUTO';
    if (source === 'sage') return 'SAGE';
    return 'MANUAL';
  }

  function srcClass(source) {
    if (source === 'auto') return 'chip-src-auto';
    if (source === 'sage') return 'chip-src-sage';
    return 'chip-src-manual';
  }

  async function toggleDone(task) {
    if (task.source === 'auto') return;
    const newDone = !task.done;
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done: newDone }),
    });
    dispatch('refresh');
  }

  async function addTask() {
    if (!newTaskText.trim()) return;
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: newTaskText.trim(), source: 'manual' }),
    });
    newTaskText = '';
    showInput = false;
    dispatch('refresh');
  }

  function clickBed(bedId) {
    if (bedId) dispatch('highlight', [bedId]);
  }
</script>

<div class="tasks-panel">
  <PixelPanel color="#fff8dc" accent="#1d1d1d">
    <div class="tasks-header">
      <span class="tasks-title">&#9654; TAREFAS</span>
      <span class="tasks-count">{openCount}</span>
    </div>

    <div class="tasks-scroll">
      {#if autoTasks.length > 0}
        <div class="tsec">
          <div class="tsec-title">AGORA · GERADAS PELO ESTADO</div>
          {#each autoTasks as task}
            <div class="task">
              <div class="task-check task-check-auto"></div>
              <div class="task-body">
                <div class="task-text">{task.text}</div>
                <div class="task-meta">
                  {#if task.bedId}
                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <span class="chip-bed" on:click={() => clickBed(task.bedId)} role="button" tabindex="0">{task.bedId}</span>
                  {/if}
                  <span class="chip-src {srcClass(task.source)}">{srcLabel(task.source)}</span>
                  {#if task.reason}
                    <span class="task-reason">{task.reason}</span>
                  {/if}
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}

      {#if planTasks.length > 0 || showInput}
        <div class="tsec">
          <div class="tsec-title">PLANO · SAGE + MANUAL</div>
          {#each planTasks as task}
            <div class="task">
              <!-- svelte-ignore a11y_click_events_have_key_events -->
              <div class="task-check" on:click={() => toggleDone(task)} role="button" tabindex="0"></div>
              <div class="task-body">
                <div class="task-text">{task.text}</div>
                <div class="task-meta">
                  {#if task.bedId}
                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <span class="chip-bed" on:click={() => clickBed(task.bedId)} role="button" tabindex="0">{task.bedId}</span>
                  {/if}
                  <span class="chip-src {srcClass(task.source)}">{srcLabel(task.source)}</span>
                  {#if task.reason}
                    <span class="task-reason">{task.reason}</span>
                  {/if}
                </div>
              </div>
            </div>
          {/each}
          {#if showInput}
            <div class="task-add-row">
              <input
                class="task-add-input"
                placeholder="Descreve a tarefa..."
                bind:value={newTaskText}
                on:keydown={(e) => { if (e.key === 'Enter') addTask(); if (e.key === 'Escape') { showInput = false; newTaskText = ''; } }}
              />
            </div>
          {/if}
        </div>
      {/if}

      {#if doneTasks.length > 0}
        <div class="tsec">
          <div class="tsec-title">FEITAS HOJE</div>
          {#each doneTasks as task}
            <div class="task task-done">
              <div class="task-check task-check-done">✓</div>
              <div class="task-body">
                <div class="task-text">{task.text}</div>
                <div class="task-meta">
                  {#if task.bedId}
                    <span class="chip-bed">{task.bedId}</span>
                  {/if}
                  <span class="chip-src {srcClass(task.source)}">{srcLabel(task.source)}</span>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div class="task-new-btn" on:click={() => { showInput = true; }} role="button" tabindex="0">+ NOVA TAREFA</div>
  </PixelPanel>
</div>

<style>
  .tasks-panel { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
  .tasks-panel :global(.pixel-panel) { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
  .tasks-scroll { flex: 1; overflow-y: auto; min-height: 0; }
  .tasks-scroll::-webkit-scrollbar { width: 6px; }
  .tasks-scroll::-webkit-scrollbar-thumb { background: #c4b898; border-radius: 3px; }
</style>
