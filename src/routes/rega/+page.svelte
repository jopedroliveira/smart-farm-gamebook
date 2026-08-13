<!--
  Rega — controlo das válvulas do jardim e dos canteiros, com o estado do
  smart watering (algoritmo no HA). Migrada do dashboard da casa.
  Fechar passa sempre pelo script verificado do HA (ver lib/server/irrigation.js).
-->
<script>
  import { onMount, onDestroy } from 'svelte';
  import PixelPanel from '$lib/components/PixelPanel.svelte';
  import PixelButton from '$lib/components/PixelButton.svelte';

  export let data;

  let overview = data.overview;
  let busy = {};
  let erro = null;
  let pollTimer = null;

  async function refresh() {
    try {
      const res = await fetch('/api/irrigation');
      if (res.ok) {
        overview = await res.json();
        erro = null;
      }
    } catch {
      /* mantém o último estado */
    }
  }

  async function acao(entityId, abrir) {
    busy = { ...busy, [entityId]: true };
    erro = null;
    try {
      const res = await fetch('/api/irrigation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityId, action: abrir ? 'abrir' : 'fechar' }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        erro = body.error || 'Não foi possível falar com a válvula';
      }
      // dá um momento à válvula antes de reler o estado
      setTimeout(refresh, 1500);
    } catch {
      erro = 'Não foi possível falar com a válvula';
    } finally {
      setTimeout(() => { busy = { ...busy, [entityId]: false }; }, 1500);
    }
  }

  function fmtQuando(s) {
    // "2026-08-14 06:00" -> "14/08 às 06:00"
    if (!s) return '—';
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}:\d{2})/);
    return m ? `${m[3]}/${m[2]} às ${m[4]}` : s;
  }

  onMount(() => {
    pollTimer = setInterval(refresh, 10000);
  });
  onDestroy(() => {
    if (pollTimer) clearInterval(pollTimer);
  });
</script>

<svelte:head>
  <title>Rega — SmartFarm</title>
</svelte:head>

<div class="rega-root">
  <div class="rega-head">
    <a class="back-btn" href="/">◀ QUINTA</a>
    <h1 class="rega-title">💧 REGA</h1>
  </div>

  {#if !overview}
    <PixelPanel color="var(--panel-warm)">
      <p class="empty">O Home Assistant não respondeu. Tenta recarregar.</p>
    </PixelPanel>
  {:else}
    <!-- Smart watering -->
    <PixelPanel color="var(--panel-cool)">
      <div class="smart">
        <div class="smart-cell">
          <span class="smart-label">PRÓXIMA REGA</span>
          <span class="smart-value">{fmtQuando(overview.smart.proxima)}</span>
          {#if overview.smart.duracao}<span class="smart-sub">{overview.smart.duracao}</span>{/if}
        </div>
        <div class="smart-cell">
          <span class="smart-label">ESTADO</span>
          <span class="smart-value">{overview.smart.estado || '—'}</span>
          <span class="smart-sub">última: {fmtQuando(overview.smart.anterior)}</span>
        </div>
      </div>
    </PixelPanel>

    {#if erro}<p class="erro">{erro}</p>{/if}

    <!-- Jardim -->
    <h2 class="sec-title">JARDIM</h2>
    <div class="zonas">
      {#each overview.zonas as zona (zona.id)}
        <PixelPanel color={zona.aberta ? 'var(--valve-open-bg)' : 'var(--panel)'}>
          <div class="zona">
            <div class="zona-info">
              <span class="zona-nome">{zona.nome}</span>
              <span class="zona-estado" class:aberta={zona.aberta}>
                {zona.disponivel ? (zona.aberta ? 'A REGAR' : 'FECHADA') : 'OFFLINE'}
              </span>
            </div>
            <PixelButton
              size="sm"
              active={zona.aberta}
              disabled={!zona.disponivel || busy[zona.id]}
              on:click={() => acao(zona.id, !zona.aberta)}
            >
              {zona.aberta ? 'FECHAR' : 'REGAR'}
            </PixelButton>
          </div>
        </PixelPanel>
      {/each}
    </div>

    <!-- Canteiros -->
    <h2 class="sec-title">CANTEIROS</h2>
    <div class="zonas">
      {#each overview.canteiros as v (v.id)}
        <PixelPanel color={v.aberta ? 'var(--valve-open-bg)' : 'var(--panel)'}>
          <div class="zona">
            <div class="zona-info">
              <span class="zona-nome">{v.nome}</span>
              <span class="zona-estado" class:aberta={v.aberta}>
                {v.disponivel ? (v.aberta ? 'A REGAR' : 'FECHADA') : 'OFFLINE'}
              </span>
              <span class="zona-meta">
                {#if v.caudal}💦 {v.caudal} · {/if}
                {#if v.bateria != null}🔋 {v.bateria}%{/if}
              </span>
              {#if v.fuga}<span class="alerta">⚠ FUGA DETETADA</span>{/if}
              {#if v.semAgua}<span class="alerta aviso">⚠ SEM ABASTECIMENTO</span>{/if}
            </div>
            <PixelButton
              size="sm"
              active={v.aberta}
              disabled={!v.disponivel || busy[v.id]}
              on:click={() => acao(v.id, !v.aberta)}
            >
              {v.aberta ? 'FECHAR' : 'REGAR'}
            </PixelButton>
          </div>
        </PixelPanel>
      {/each}
    </div>

    <p class="nota">O fecho é sempre verificado: se a válvula não confirmar, o HA insiste e avisa.</p>
  {/if}
</div>

<style>
  .rega-root {
    --valve-open-bg: #cfeeff;
    --valve-open: #1d7fd4;
    max-width: 720px;
    margin: 0 auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .rega-head {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .back-btn {
    font-family: 'Press Start 2P', monospace;
    font-size: 10px;
    color: var(--ink);
    text-decoration: none;
    background: var(--panel-cream);
    padding: 8px 10px;
    box-shadow: 0 0 0 3px var(--border), 0 4px 0 var(--border);
  }
  .back-btn:active { transform: translateY(2px); box-shadow: 0 0 0 3px var(--border), 0 2px 0 var(--border); }

  .rega-title {
    font-family: 'Press Start 2P', monospace;
    font-size: 16px;
    color: var(--panel-cream);
    text-shadow: 2px 2px 0 var(--border);
    margin: 0;
  }

  .sec-title {
    font-family: 'Press Start 2P', monospace;
    font-size: 11px;
    color: var(--panel-cream);
    text-shadow: 2px 2px 0 var(--border);
    margin: 6px 0 0;
  }

  .smart { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .smart-cell { display: flex; flex-direction: column; gap: 4px; }
  .smart-label { font-family: 'Press Start 2P', monospace; font-size: 8px; color: var(--ink-soft); }
  .smart-value { font-family: 'VT323', monospace; font-size: 22px; color: var(--ink); line-height: 1; }
  .smart-sub { font-family: 'VT323', monospace; font-size: 14px; color: var(--ink-soft); }

  .zonas { display: grid; grid-template-columns: 1fr; gap: 10px; }
  @media (min-width: 560px) { .zonas { grid-template-columns: 1fr 1fr; } }

  .zona { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
  .zona-info { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
  .zona-nome { font-family: 'Press Start 2P', monospace; font-size: 10px; color: var(--ink); }
  .zona-estado { font-family: 'VT323', monospace; font-size: 15px; color: var(--ink-soft); }
  .zona-estado.aberta { color: var(--valve-open); font-weight: bold; }
  .zona-meta { font-family: 'VT323', monospace; font-size: 14px; color: var(--ink-soft); }
  .alerta { font-family: 'VT323', monospace; font-size: 14px; color: var(--accent); }
  .alerta.aviso { color: #b8860b; }

  .erro {
    font-family: 'VT323', monospace;
    font-size: 16px;
    color: var(--panel-cream);
    background: var(--accent);
    padding: 6px 10px;
    box-shadow: 0 0 0 3px var(--border);
    margin: 0;
  }

  .nota, .empty {
    font-family: 'VT323', monospace;
    font-size: 14px;
    color: var(--panel-cream);
    opacity: 0.8;
    margin: 0;
  }
  .empty { color: var(--ink); opacity: 1; }
</style>
