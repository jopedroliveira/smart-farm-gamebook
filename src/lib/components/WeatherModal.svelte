<!--
  Weather modal — shows current conditions, 7-day forecast, and farm advice.
-->
<script>
  import WeatherIcon from './WeatherIcon.svelte';
  import { WX_LABELS_PT, fmtWxDate, weatherAdvice } from '$lib/stores/weather.js';

  export let open = false;
  export let current;
  export let forecast;
  export let location = '';

  const today = new Date();
</script>

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="info-modal-backdrop" on:click={() => { open = false; }}>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="info-modal wx-modal" on:click|stopPropagation>
      <div class="info-modal-bar" style:background="#cfeeff">
        <div class="info-modal-title">▶ METEO · {location || 'LISBOA'}</div>
        <button class="info-modal-close" on:click={() => { open = false; }}>FECHAR</button>
      </div>
      <div class="info-modal-body">
        <!-- Current weather -->
        <div class="wx-now">
          <div class="wx-now-icon">
            <WeatherIcon kind={current.kind} scale={6} />
          </div>
          <div class="wx-now-body">
            <div class="wx-now-label">{WX_LABELS_PT[current.kind] || 'TEMPO'}</div>
            <div class="wx-now-temp">
              {current.temp}<span class="wx-deg">°C</span>
            </div>
            <div class="wx-now-sub">
              Sensação {current.feels ?? current.temp}° · Vento {current.wind ?? '—'} km/h · Hum. {current.humidity ?? '—'}%
            </div>
          </div>
          <div class="wx-now-side">
            <div class="wx-side-row">
              <span class="wx-side-icon">🌅</span>
              <span class="wx-side-lbl">NASCER</span>
              <span class="wx-side-val">{current.sunrise || '—'}</span>
            </div>
            <div class="wx-side-row">
              <span class="wx-side-icon">🌇</span>
              <span class="wx-side-lbl">PÔR-DO-SOL</span>
              <span class="wx-side-val">{current.sunset || '—'}</span>
            </div>
            <div class="wx-side-row">
              <span class="wx-side-icon">💧</span>
              <span class="wx-side-lbl">PRECIP. HOJE</span>
              <span class="wx-side-val">{current.precipToday ?? '0'} mm</span>
            </div>
          </div>
        </div>

        <!-- 7-day forecast -->
        <div class="wx-section-title">PRÓXIMOS 7 DIAS</div>
        <div class="wx-days">
          {#if forecast.length === 0}
            <div class="wx-empty">A carregar previsão…</div>
          {/if}
          {#each forecast as d, i}
            <div class="wx-day" class:wx-day-today={i === 0}>
              <div class="wx-day-label">{fmtWxDate(d.date, today)}</div>
              <div class="wx-day-icon">
                <WeatherIcon kind={d.kind} scale={3} />
              </div>
              <div class="wx-day-temps">
                <span class="wx-temp-hi">{d.max}°</span>
                <span class="wx-temp-lo">{d.min}°</span>
              </div>
              <div class="wx-day-precip">
                <div class="wx-precip-bar">
                  <div class="wx-precip-fill" style:width="{d.precip || 0}%"></div>
                </div>
                <div class="wx-precip-val">💧 {d.precip || 0}%</div>
              </div>
            </div>
          {/each}
        </div>

        <!-- Farm advice -->
        <div class="wx-section-title">EFEITO NA HORTA</div>
        <div class="wx-advice">
          {#each weatherAdvice(current, forecast) as a}
            <div class="wx-advice-row wx-advice-{a.type}">
              <span class="wx-advice-icon">{a.icon}</span>
              <span>{a.text}</span>
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>
{/if}
