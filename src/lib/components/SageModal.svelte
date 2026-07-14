<!--
  Sage assistant modal — pixel-art farmhand with quick-action chat.
-->
<script>
  import PixelPanel from './PixelPanel.svelte';
  import SageCharacter from './SageCharacter.svelte';
  import { bedReady, bedStatusLabel, weedLevel, thirstLevel } from '$lib/stores/farm.js';
  import { createEventDispatcher, onMount, onDestroy, tick } from 'svelte';

  export let open = false;
  export let state;

  const dispatch = createEventDispatcher();

  let thread = [
    { from: 'sage', text: 'Bem-vindo de volta, agricultor! Toca numa pergunta ou escreve a tua.' },
  ];
  let pending = false;
  let input = '';
  let inputEl;
  let threadEl;

  let streaming = false;

  $: if (open && inputEl) setTimeout(() => inputEl.focus(), 100);

  function scrollThread() {
    if (threadEl) setTimeout(() => { threadEl.scrollTop = threadEl.scrollHeight; }, 50);
  }

  function pushUser(text) {
    thread = [...thread, { from: 'user', text }];
    scrollThread();
  }

  function buildCtx() {
    return {
      beds: state.beds.map(b => ({
        id: b.notionCode || b.id,
        horasSemRega: b.horasSemRega,
        diasSemSachar: b.diasSemSachar,
        rega: thirstLevel(b),
        ervas: weedLevel(b),
        ready: bedReady(b),
        status: bedStatusLabel(b),
      })),
      compost: Math.round(state.composter.fill * 100),
      weather: state.weather,
    };
  }

  const quickLabels = {
    status: 'QUE TAL?',
    thirsty: 'QUEM TEM SEDE?',
    ready: 'O QUE ESTÁ PRONTO?',
    plan: 'PLANO DO DIA',
  };

  async function askSage(message) {
    pending = true;
    streaming = true;
    const ctx = buildCtx();
    thread = [...thread, { from: 'sage', text: '' }];
    scrollThread();

    try {
      const res = await fetch('/api/sage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history: thread.slice(0, -1), context: ctx }),
      });

      if (!res.ok) {
        thread[thread.length - 1].text = 'O radio esta com estatica... tenta outra vez.';
        thread = [...thread];
        streaming = false;
        pending = false;
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6);
          if (payload === '[DONE]') break;
          try {
            const parsed = JSON.parse(payload);
            if (parsed.error) {
              fullText = 'O radio esta com estatica... tenta outra vez.';
              break;
            }
            if (parsed.tools) {
              for (const t of parsed.tools) {
                thread = [...thread.slice(0, -1), { from: 'system', text: t.result?.message || 'Registado.' }, thread[thread.length - 1]];
              }
              scrollThread();
            }
            if (parsed.text) fullText += parsed.text;
          } catch { /* ignore malformed chunks */ }
        }

        thread[thread.length - 1].text = fullText;
        thread = [...thread];
        scrollThread();
      }
    } catch {
      thread[thread.length - 1].text = 'O radio esta com estatica... tenta outra vez.';
      thread = [...thread];
    }

    streaming = false;
    pending = false;
    await tick();
    if (inputEl) inputEl.focus();
  }

  function runQuick(kind) {
    pushUser(quickLabels[kind]);
    askSage(quickLabels[kind]);
  }

  function handleKey(e) {
    if (e.key === 'Escape') { open = false; }
  }
</script>

<svelte:window on:keydown={handleKey} />

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="info-modal-backdrop" on:click={() => { open = false; }}>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="info-modal sage-modal" on:click|stopPropagation>
      <div class="info-modal-bar">
        <div class="info-modal-title">&#9654; FARMHAND SAGE</div>
        <button class="info-modal-close" on:click={() => { open = false; }}>FECHAR &#10005;</button>
      </div>
      <div class="info-modal-body sage-body">
        <div class="sage-row">
          <div class="sage-portrait-wrap">
            <div class="sage-portrait-bg">
              <SageCharacter talking={streaming} size={4} />
            </div>
            <div class="sage-name-tag">SAGE</div>
          </div>

          <div class="sage-dialog">
            <div class="sage-thread" bind:this={threadEl}>
              {#each thread as m}
                {#if m.from === 'system'}
                  <div class="sage-msg sage-msg-system">
                    <span>{m.text}</span>
                  </div>
                {:else}
                  <div class="sage-msg sage-msg-{m.from}">
                    <span class="sage-msg-prefix">{m.from === 'user' ? 'TU' : 'SAGE'} &#9654;</span>
                    <span>{m.text}</span>
                    {#if m === thread[thread.length - 1] && m.from === 'sage' && streaming}
                      <span class="sage-cursor">&#9612;</span>
                    {/if}
                  </div>
                {/if}
              {/each}
            </div>
          </div>
        </div>

        <div class="sage-actions">
          <button class="sage-chip" on:click={() => runQuick('status')} disabled={pending}>QUE TAL?</button>
          <button class="sage-chip" on:click={() => runQuick('thirsty')} disabled={pending}>QUEM TEM SEDE?</button>
          <button class="sage-chip" on:click={() => runQuick('ready')} disabled={pending}>O QUE ESTA PRONTO?</button>
          <button class="sage-chip" on:click={() => runQuick('plan')} disabled={pending}>PLANO DO DIA</button>
        </div>

        <div class="sage-input-row">
          <input
            class="sage-input"
            placeholder="Pergunta-me qualquer coisa sobre a horta..."
            bind:value={input}
            bind:this={inputEl}
            on:keydown={(e) => { if (e.key === 'Enter' && input.trim()) { const msg = input.trim(); input = ''; pushUser(msg); askSage(msg); } }}
            disabled={pending}
          />
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .sage-modal {
    width: min(780px, 95vw);
    max-height: 85vh;
  }

  .sage-body {
    padding: 18px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-height: calc(85vh - 48px);
    overflow: hidden;
  }

  .sage-row {
    display: flex;
    gap: 16px;
    flex: 1;
    min-height: 0;
  }

  .sage-dialog {
    flex: 1;
    min-height: 0;
  }

  .sage-thread {
    max-height: min(50vh, 400px);
    overflow-y: auto;
  }

  .sage-msg-system {
    font-size: 0.75em;
    opacity: 0.7;
    font-style: italic;
    padding: 2px 0;
  }
</style>
