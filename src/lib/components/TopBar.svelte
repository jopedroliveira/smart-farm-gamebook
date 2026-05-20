<script>
  import WeatherIcon from './WeatherIcon.svelte';
  import SageCharacter from './SageCharacter.svelte';
  import Badge from './Badge.svelte';
  import { WX_LABELS_PT } from '$lib/stores/weather.js';
  import { createEventDispatcher } from 'svelte';

  export let state;
  export let bedMode = 'default';
  export let weather;
  export let now = new Date();

  const dispatch = createEventDispatcher();

  function seasonForDate(d) {
    const m = d.getMonth();
    if (m >= 2 && m <= 4) return 'PRIMAVERA';
    if (m >= 5 && m <= 7) return 'VERÃO';
    if (m >= 8 && m <= 10) return 'OUTONO';
    return 'INVERNO';
  }

  $: dateStr = now.toLocaleDateString('pt-PT', { weekday: 'short', day: '2-digit', month: 'short' }).toUpperCase();
  $: timeStr = now.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
  $: seasonPT = seasonForDate(now);
</script>

<div class="topbar">
  <div class="topbar-left">
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div class="mode-toggle" on:click={() => dispatch('toggleMode')} role="button" tabindex="0" title="Alternar plantas / sensores">
      <div class="mode-tab" class:mode-tab-on={bedMode === 'default'}>
        <span>🌱</span> PLANTAS
      </div>
      <div class="mode-tab" class:mode-tab-on={bedMode === 'monitoring'}>
        <span>📊</span> SENSORES
      </div>
    </div>
  </div>

  <div class="topbar-center">
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div class="wx-topbar" on:click={() => dispatch('openWeather')} role="button" tabindex="0" title="Ver meteorologia">
      <div class="wx-topbar-date">{dateStr}</div>
      <div class="wx-topbar-time">{timeStr}</div>
      <div class="wx-topbar-now">
        <WeatherIcon kind={weather.kind || 'sunny'} scale={2} />
        <div class="wx-topbar-now-text">
          <div class="wx-topbar-temp">{weather.temp}°</div>
          <div class="wx-topbar-label">{WX_LABELS_PT[weather.kind] || ''}</div>
        </div>
      </div>
      <div class="wx-topbar-season">{seasonPT}</div>
      <div class="wx-topbar-chev">▸</div>
    </div>
  </div>

  <div class="topbar-right">
    <a class="hortidex-badge" href="/hortidex" title="Abrir Hortidex — base de conhecimento">
      <div class="hortidex-badge-icon">
        <div class="hortidex-book"></div>
      </div>
      <div class="hortidex-badge-label">HORTIDEX</div>
    </a>
    <button class="sage-badge" on:click={() => dispatch('openSage')} title="Falar com SAGE">
      <div class="sage-badge-portrait">
        <SageCharacter talking={false} size={2} />
      </div>
      <div class="sage-badge-label">SAGE</div>
    </button>
    <Badge icon="◆" value="LV {state.level}" color="#5cd96b" />
    <Badge icon="★" value={state.xp} color="#4fc3f7" />
    <Badge icon="●" value={state.coins} color="#f7a82a" />
  </div>
</div>
