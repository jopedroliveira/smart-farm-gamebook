<!--
  Shown after the last crop leaves a bed: close the cycle now or leave it open.
-->
<script>
  import { createEventDispatcher } from 'svelte';
  export let bedCode;
  export let cycleTitle;
  const dispatch = createEventDispatcher();
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="info-modal-backdrop" on:click={() => dispatch('keep')}>
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="info-modal close-prompt" on:click|stopPropagation>
    <div class="info-modal-bar">
      <div class="info-modal-title">{bedCode} · CICLO VAZIO</div>
    </div>
    <div class="info-modal-body">
      <div class="close-prompt-text">Saiu a ultima cultura de "{cycleTitle}". Fechar o ciclo? O canteiro fica vazio e pronto para o proximo plano.</div>
      <div class="sheet-actions">
        <button class="sheet-btn sheet-btn-primary" on:click={() => dispatch('close')}>FECHAR CICLO</button>
        <button class="sheet-btn sheet-btn-quiet" on:click={() => dispatch('keep')}>DEIXAR ABERTO</button>
      </div>
    </div>
  </div>
</div>

<style>
  .close-prompt { max-width: 420px; }
  .close-prompt-text { font-family: 'VT323', monospace; font-size: 20px; line-height: 1.3; margin-bottom: 14px; color: var(--ink); }
</style>
