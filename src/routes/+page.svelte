<!--
  SmartFarm Dashboard — main page.

  Svelte notes for learning:
  - `$farmState` — the $ prefix auto-subscribes to a Svelte store.
    When the store changes, the component re-renders.
  - `onMount` — runs once when the component is first rendered in the browser.
  - `$:` — reactive declaration. Re-runs when dependencies change.
-->
<script>
  import { onMount, onDestroy } from 'svelte';
  import { farmState } from '$lib/stores/farm.js';
  import { weatherStore, forecastStore, locationStore, fetchWeather } from '$lib/stores/weather.js';
  import { PLANT_SPECIES } from '$lib/data/plant-species.js';

  import TopBar from '$lib/components/TopBar.svelte';
  import FarmMap from '$lib/components/FarmMap.svelte';
  import QuestsPanel from '$lib/components/QuestsPanel.svelte';
  import LogPanel from '$lib/components/LogPanel.svelte';
  import Hotbar from '$lib/components/Hotbar.svelte';
  import BedInfoModal from '$lib/components/BedInfoModal.svelte';
  import WeatherModal from '$lib/components/WeatherModal.svelte';

  let now = new Date();
  let clockInterval;
  let tickInterval;
  let weatherInterval;
  let bedMode = 'default';
  let showWeather = false;
  let infoBedId = null;
  let highlightedBedIds = [];

  onMount(() => {
    clockInterval = setInterval(() => { now = new Date(); }, 30_000);
    fetchWeather();
    weatherInterval = setInterval(fetchWeather, 30 * 60_000);
  });
  onDestroy(() => {
    clearInterval(clockInterval);
    clearInterval(tickInterval);
    clearInterval(weatherInterval);
  });

  // Game tick — weeds grow, water dries, pests creep
  onMount(() => {
    tickInterval = setInterval(() => {
      farmState.update(s => {
        const wx = $weatherStore.weather || 'sunny';
        const newBeds = s.beds.map(b => {
          let watered = b.watered - 0.04;
          if (wx === 'rain') watered = Math.min(1, watered + 0.15);
          if (wx === 'storm') watered = Math.min(1, watered + 0.25);
          if (wx === 'sunny') watered = Math.max(0, watered - 0.02);
          const weeds = Math.min(1, b.weeds + 0.015);
          const pests = Math.min(1, b.pests + (wx === 'storm' ? 0.02 : 0.008));
          return { ...b, watered: Math.max(0, watered), weeds, pests };
        });
        return { ...s, beds: newBeds };
      });
    }, 60_000);
  });

  // Season theme
  onMount(() => {
    const root = document.documentElement;
    const themes = {
      spring: { '--grass': '#6fa84a', '--grass-dark': '#4f7d31', '--sky-1': '#a4d4ff', '--sky-2': '#6ab7f5', '--bed-wood': '#8a5a2a', '--bed-wood-dk': '#5a3a1a' },
      summer: { '--grass': '#caa05a', '--grass-dark': '#8a6a30', '--sky-1': '#ffd4a4', '--sky-2': '#f59855', '--bed-wood': '#a06030', '--bed-wood-dk': '#6a3a14' },
      autumn: { '--grass': '#7a8a3a', '--grass-dark': '#5a6a24', '--sky-1': '#e8c47a', '--sky-2': '#c47a55', '--bed-wood': '#7a4a24', '--bed-wood-dk': '#4a2a14' },
      winter: { '--grass': '#d4e4ea', '--grass-dark': '#a4b8c0', '--sky-1': '#e8f0f8', '--sky-2': '#a4c4e4', '--bed-wood': '#7a5a3a', '--bed-wood-dk': '#4a3a24' },
    };
    const m = new Date().getMonth();
    const key = m >= 2 && m <= 4 ? 'spring' : m >= 5 && m <= 7 ? 'summer' : m >= 8 && m <= 10 ? 'autumn' : 'winter';
    Object.entries(themes[key]).forEach(([k, v]) => root.style.setProperty(k, v));
  });

  function addLog(msg) {
    const t = new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
    farmState.update(s => ({
      ...s,
      log: [{ t, msg }, ...s.log].slice(0, 12),
    }));
  }

  function handleUseTool(e) {
    const { id, tool, payload } = e.detail;
    if (tool === 'water') {
      farmState.update(s => ({
        ...s,
        beds: s.beds.map(b => b.id === id ? { ...b, watered: Math.min(1, b.watered + 0.4) } : b),
      }));
      const bed = $farmState.beds.find(b => b.id === id);
      addLog(`Regaste ${bed?.notionCode || id}.`);
    } else if (tool === 'shovel') {
      farmState.update(s => ({
        ...s,
        beds: s.beds.map(b => b.id === id ? { ...b, weeds: 0, soilHealth: Math.min(1, b.soilHealth + 0.05) } : b),
        composter: { ...s.composter, fill: Math.min(1, s.composter.fill + 0.05) },
      }));
      const bed = $farmState.beds.find(b => b.id === id);
      addLog(`Sachado ${bed?.notionCode || id}. +5% compostor.`);
    } else if (tool === 'harvest') {
      const { species, finished } = payload || {};
      const bed = $farmState.beds.find(b => b.id === id);
      const planting = bed?.plantings?.find(p => p.species === species);
      if (!planting) return;
      const yld = planting.count;
      farmState.update(s => {
        const harvested = { ...s.harvested, [species]: (s.harvested[species] || 0) + yld };
        const beds = s.beds.map(b => {
          if (b.id !== id) return b;
          const plantings = finished ? b.plantings.filter(p => p.species !== species) : b.plantings;
          return { ...b, plantings, estado: plantings.length === 0 ? 'Terminado' : b.estado, soilHealth: finished ? Math.max(0.3, b.soilHealth - 0.05) : b.soilHealth };
        });
        return { ...s, beds, harvested, coins: s.coins + yld * 4, xp: s.xp + yld * 3 };
      });
      const speciesName = PLANT_SPECIES[species]?.name || species;
      addLog(`Colhido ${speciesName} de ${bed?.notionCode || id}${finished ? ' (acabou!)' : ' (parcial)'}.`);
    } else if (tool === 'compost') {
      farmState.update(s => ({ ...s, composter: { ...s.composter, fill: Math.max(0, s.composter.fill - 0.3), days: 0 } }));
      addLog('Composto espalhado pelas camas.');
    } else if (tool === 'gather') {
      farmState.update(s => ({
        ...s,
        composter: { ...s.composter, fill: Math.min(1, s.composter.fill + 0.12) },
        weedGarden: { lushness: Math.max(0, s.weedGarden.lushness - 0.15) },
      }));
      addLog('Cortaste a relva. Aparas → compostor (+12%).');
    }
  }
</script>

<svelte:head>
  <title>SmartFarm — Raised Beds</title>
</svelte:head>

<div class="farm-root">
  <TopBar
    state={$farmState}
    {bedMode}
    weather={$weatherStore}
    {now}
    on:toggleMode={() => { bedMode = bedMode === 'default' ? 'monitoring' : 'default'; }}
    on:openWeather={() => { showWeather = true; }}
    on:openSage={() => {}}
  />

  <div class="farm-grid">
    <div class="farm-col-left">
      <QuestsPanel quests={$farmState.quests} />
      <LogPanel log={$farmState.log} />
    </div>

    <div class="farm-col-center">
      <FarmMap
        state={$farmState}
        {highlightedBedIds}
        {bedMode}
        on:useTool={handleUseTool}
        on:showInfo={(e) => { infoBedId = e.detail; }}
      />
      <Hotbar harvested={$farmState.harvested} />
    </div>
  </div>

  {#if infoBedId}
    <BedInfoModal bind:bedId={infoBedId} state={$farmState} />
  {/if}

  <WeatherModal
    bind:open={showWeather}
    current={$weatherStore}
    forecast={$forecastStore}
    location={$locationStore}
  />
</div>
