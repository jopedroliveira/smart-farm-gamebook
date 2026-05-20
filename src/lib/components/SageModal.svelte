<!--
  Sage assistant modal — pixel-art farmhand with quick-action chat.
-->
<script>
  import PixelPanel from './PixelPanel.svelte';
  import SageCharacter from './SageCharacter.svelte';
  import { bedReady, bedStatusLabel, bedHealth } from '$lib/stores/farm.js';
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';

  export let open = false;
  export let state;

  const dispatch = createEventDispatcher();

  let thread = [
    { from: 'sage', text: 'Bem-vindo de volta, agricultor! Toca numa pergunta ou escreve a tua.' },
  ];
  let pending = false;
  let showInput = false;
  let input = '';
  let threadEl;

  // Typing effect
  let displayText = '';
  let typeDone = false;
  let typeInterval;

  $: lastMsg = thread[thread.length - 1];
  $: if (lastMsg?.from === 'sage') {
    startTyping(lastMsg.text);
  }

  function startTyping(text) {
    displayText = '';
    typeDone = false;
    clearInterval(typeInterval);
    let i = 0;
    typeInterval = setInterval(() => {
      i++;
      displayText = text.slice(0, i);
      if (i >= text.length) {
        clearInterval(typeInterval);
        typeDone = true;
      }
    }, 18);
  }

  onDestroy(() => clearInterval(typeInterval));

  function scrollThread() {
    if (threadEl) setTimeout(() => { threadEl.scrollTop = threadEl.scrollHeight; }, 50);
  }

  function pushSage(text, highlight = []) {
    thread = [...thread, { from: 'sage', text }];
    if (highlight.length) {
      dispatch('highlight', highlight);
      setTimeout(() => dispatch('highlight', []), 4000);
    }
    scrollThread();
  }

  function pushUser(text) {
    thread = [...thread, { from: 'user', text }];
    scrollThread();
  }

  // Build farm context from state
  function buildCtx() {
    return {
      beds: state.beds.map(b => ({
        id: b.notionCode || b.id,
        water: Math.round(b.watered * 100),
        soil: Math.round(b.soilHealth * 100),
        weeds: Math.round(b.weeds * 100),
        pests: Math.round(b.pests * 100),
        ready: bedReady(b),
        status: bedStatusLabel(b),
      })),
      compost: Math.round(state.composter.fill * 100),
      weather: state.weather,
    };
  }

  function runQuick(kind) {
    const ctx = buildCtx();
    const labels = {
      status: 'QUE TAL?',
      thirsty: 'QUEM TEM SEDE?',
      ready: 'O QUE ESTÁ PRONTO?',
      plan: 'PLANO DO DIA',
    };
    pushUser(labels[kind]);

    let text = '';
    let highlight = [];

    if (kind === 'status') {
      const ready = ctx.beds.filter(b => b.ready);
      const thirsty = ctx.beds.filter(b => b.water < 30);
      const weedy = ctx.beds.filter(b => b.weeds > 40);
      const parts = [];
      if (ready.length) parts.push(`${ready.length} cama${ready.length > 1 ? 's' : ''} para colher (${ready.map(b => b.id).join(', ')})`);
      if (thirsty.length) parts.push(`${thirsty.length} com sede (${thirsty.map(b => b.id).join(', ')})`);
      if (weedy.length) parts.push(`${weedy.length} com ervas (${weedy.map(b => b.id).join(', ')})`);
      text = parts.length ? `Hmm! ${parts.join('. ')}. Por onde começamos?` : `Tudo calmo na horta! Compostor a ${ctx.compost}%. Continua assim!`;
      highlight = [...ready, ...thirsty, ...weedy].map(b => b.id);
    } else if (kind === 'thirsty') {
      const thirsty = ctx.beds.filter(b => b.water < 40).sort((a, b) => a.water - b.water);
      if (!thirsty.length) { text = 'Nenhuma cama tem sede agora. Bom trabalho!'; }
      else { text = `Estas precisam de água: ${thirsty.map(b => `${b.id} (${b.water}%)`).join(', ')}. Vai REGAR!`; highlight = thirsty.map(b => b.id); }
    } else if (kind === 'ready') {
      const ready = ctx.beds.filter(b => b.ready);
      if (!ready.length) { text = 'Ainda nada maduro. Paciência!'; }
      else { text = `Hora da colheita! ${ready.map(b => b.id).join(', ')}. Vai COLHER!`; highlight = ready.map(b => b.id); }
    } else if (kind === 'plan') {
      const tasks = [];
      const ready = ctx.beds.filter(b => b.ready);
      const thirsty = ctx.beds.filter(b => b.water < 35);
      const weedy = ctx.beds.filter(b => b.weeds > 35);
      if (ready.length) tasks.push(`colher ${ready.map(b => b.id).join(', ')}`);
      if (thirsty.length) tasks.push(`regar ${thirsty.map(b => b.id).join(', ')}`);
      if (weedy.length) tasks.push(`sachar ${weedy.map(b => b.id).join(', ')}`);
      if (ctx.compost > 80) tasks.push('esvaziar o compostor');
      if (!tasks.length) tasks.push('descansar, a horta está feliz');
      text = `Plano de hoje: ${tasks.join('; ')}.`;
      highlight = [...new Set([...ready, ...thirsty, ...weedy].map(b => b.id))];
    }

    setTimeout(() => pushSage(text, highlight), 200);
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
        <div class="info-modal-title">▶ FARMHAND SAGE</div>
        <button class="info-modal-close" on:click={() => { open = false; }}>FECHAR ✕</button>
      </div>
      <div class="info-modal-body" style="padding: 18px;">
        <div class="sage-row">
          <div class="sage-portrait-wrap">
            <div class="sage-portrait-bg">
              <SageCharacter talking={!typeDone} size={4} />
            </div>
            <div class="sage-name-tag">SAGE</div>
          </div>

          <div class="sage-dialog">
            <div class="sage-thread" bind:this={threadEl}>
              {#each thread.slice(0, -1) as m}
                <div class="sage-msg sage-msg-{m.from}">
                  <span class="sage-msg-prefix">{m.from === 'user' ? 'TU' : 'SAGE'} ▶</span>
                  <span>{m.text}</span>
                </div>
              {/each}
              {#if lastMsg?.from === 'sage'}
                <div class="sage-msg sage-msg-sage">
                  <span class="sage-msg-prefix">SAGE ▶</span>
                  <span>{displayText}</span>
                  {#if !typeDone}
                    <span class="sage-cursor">▌</span>
                  {:else}
                    <span class="sage-cursor sage-cursor-blink">▼</span>
                  {/if}
                </div>
              {/if}
              {#if lastMsg?.from === 'user'}
                <div class="sage-msg sage-msg-user">
                  <span class="sage-msg-prefix">TU ▶</span>
                  <span>{lastMsg.text}</span>
                </div>
              {/if}
            </div>
          </div>
        </div>

        <div class="sage-actions">
          <button class="sage-chip" on:click={() => runQuick('status')} disabled={pending}>QUE TAL?</button>
          <button class="sage-chip" on:click={() => runQuick('thirsty')} disabled={pending}>QUEM TEM SEDE?</button>
          <button class="sage-chip" on:click={() => runQuick('ready')} disabled={pending}>O QUE ESTÁ PRONTO?</button>
          <button class="sage-chip" on:click={() => runQuick('plan')} disabled={pending}>PLANO DO DIA</button>
          <button class="sage-chip" class:sage-chip-active={showInput} on:click={() => { showInput = !showInput; }}>PERGUNTAR...</button>
        </div>

        {#if showInput}
          <div class="sage-input-row">
            <input
              class="sage-input"
              placeholder="Pergunta-me qualquer coisa sobre a horta..."
              bind:value={input}
              on:keydown={(e) => { if (e.key === 'Enter' && input.trim()) { pushUser(input.trim()); input = ''; setTimeout(() => pushSage('O rádio velho está com estática hoje — mas a horta está boa!'), 500); } }}
              disabled={pending}
            />
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .sage-modal { width: min(640px, 100%); }
</style>
