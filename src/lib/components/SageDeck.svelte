<script>
  import SageCharacter from './SageCharacter.svelte';
  import ToolIcon from './ToolIcon.svelte';
  import PlantSprite from './PlantSprite.svelte';
  import { bedReady, bedStatusLabel, weedLevel, thirstLevel } from '$lib/stores/farm.js';
  import { PLANT_SPECIES } from '$lib/data/plant-species.js';
  import { createEventDispatcher, tick } from 'svelte';

  export let state;
  export let log = [];

  const dispatch = createEventDispatcher();

  let thread = [
    { from: 'sage', text: 'Bem-vindo de volta, agricultor! Toca numa pergunta ou escreve a tua.' },
  ];
  let pending = false;
  let input = '';
  let inputEl;
  let threadEl;
  let streaming = false;

  function scrollThread() {
    if (threadEl) setTimeout(() => { threadEl.scrollTop = threadEl.scrollHeight; }, 50);
  }

  $: mergedThread = buildMergedThread(thread, log);

  function buildMergedThread(msgs, logEntries) {
    const items = [];
    for (const m of msgs) {
      items.push({ type: m.from, text: m.text, from: m.from });
    }
    for (const entry of logEntries) {
      items.push({ type: 'log', text: entry.msg, time: entry.t });
    }
    return items;
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

  const quickChips = [
    { key: 'status', label: 'QUE TAL?' },
    { key: 'thirsty', label: 'QUEM TEM SEDE?' },
    { key: 'ready', label: 'O QUE ESTA PRONTO?' },
    { key: 'plan', label: 'PLANO DO DIA' },
  ];

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
        let errMsg = 'O radio esta com estatica... tenta outra vez.';
        try {
          const errData = await res.json();
          errMsg = `Erro: ${errData.error || res.status}`;
        } catch {}
        thread[thread.length - 1].text = errMsg;
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
                const msg = t.result?.message || 'Registado.';
                thread = [...thread.slice(0, -1), { from: 'system', text: msg }, thread[thread.length - 1]];
                if (t.tool === 'criar_tarefa') {
                  dispatch('taskCreated');
                }
                if (t.tool === 'criar_tarefa' && t.input?.bed_id) {
                  dispatch('highlight', [t.input.bed_id]);
                }
              }
              scrollThread();
            }
            if (parsed.text) fullText += parsed.text;
          } catch {}
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

  function runQuick(chip) {
    pushUser(chip.label);
    askSage(chip.label);
  }

  function handleSubmit() {
    if (!input.trim() || pending) return;
    const msg = input.trim();
    input = '';
    pushUser(msg);
    askSage(msg);
  }

  $: harvestedList = Object.entries(state.harvested || {}).filter(([, n]) => n > 0).slice(0, 6);

  const tools = [
    { id: 'water', label: 'REGAR' },
    { id: 'shovel', label: 'SACHAR' },
    { id: 'harvest', label: 'COLHEITA' },
  ];
</script>

<div class="sage-deck">
  <div class="sd-portrait">
    <div class="sage-portrait-bg">
      <SageCharacter talking={streaming} size={4} />
    </div>
    <div class="sage-name-tag">SAGE</div>
  </div>

  <div class="sd-chat">
    <div class="sd-thread" bind:this={threadEl}>
      {#each thread as m, i}
        {#if m.from === 'system'}
          <div class="sage-msg sage-msg-system">
            <span>{m.text}</span>
          </div>
        {:else}
          <div class="sage-msg sage-msg-{m.from}">
            <span class="sage-msg-prefix">{m.from === 'user' ? 'TU' : 'SAGE'} &#9654;</span>
            <span>{m.text}</span>
            {#if i === thread.length - 1 && m.from === 'sage' && streaming && !m.text}
              <span class="sage-thinking">
                <span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>
              </span>
            {:else if i === thread.length - 1 && m.from === 'sage' && streaming}
              <span class="sage-cursor">&#9612;</span>
            {/if}
          </div>
        {/if}
      {/each}
      {#each log as entry}
        <div class="sage-msg sage-msg-system">
          <span>[{entry.t}] {entry.msg}</span>
        </div>
      {/each}
    </div>

    <div class="sd-chips">
      {#each quickChips as chip}
        <button class="sage-chip" on:click={() => runQuick(chip)} disabled={pending}>{chip.label}</button>
      {/each}
    </div>

    <div class="sd-input-row">
      <input
        class="sage-input"
        placeholder="Pergunta-me qualquer coisa sobre a horta..."
        bind:value={input}
        bind:this={inputEl}
        on:keydown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
        disabled={pending}
      />
      <button class="sd-send-btn" on:click={handleSubmit} disabled={pending || !input.trim()}>PERGUNTAR</button>
    </div>
  </div>

  <div class="sd-sidebar">
    <div class="sd-sidebar-block">
      <div class="sd-sidebar-title">FERRAMENTAS</div>
      <div class="sd-tools">
        {#each tools as t}
          <div class="sd-tool-slot">
            <ToolIcon kind={t.id} scale={2} />
            <div class="sd-tool-label">{t.label}</div>
          </div>
        {/each}
      </div>
      <div class="sd-tool-hint">toca numa cama</div>
    </div>

    <div class="sd-sidebar-block">
      <div class="sd-sidebar-title">COLHIDO HOJE</div>
      <div class="sd-harvested">
        {#if harvestedList.length === 0}
          <div class="sd-harvest-empty">Ainda nada.</div>
        {/if}
        {#each harvestedList as [species, n]}
          {@const s = PLANT_SPECIES[species]}
          {#if s}
            <div class="seed-chip">
              <PlantSprite kind={s.sprite} stage={3} scale={2} />
              <span class="seed-chip-label">{s.name}</span>
              <span class="seed-chip-count">x{n}</span>
            </div>
          {/if}
        {/each}
      </div>
    </div>
  </div>
</div>
