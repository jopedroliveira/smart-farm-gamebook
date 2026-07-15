<script>
  import { onMount, onDestroy } from 'svelte';
  import { farmState, initFarmState, autoTasks, openTaskCount } from '$lib/stores/farm.js';
  import { weatherStore, forecastStore, locationStore, fetchWeather } from '$lib/stores/weather.js';
  import { PLANT_SPECIES } from '$lib/data/plant-species.js';

  export let data;

  import TopBar from '$lib/components/TopBar.svelte';
  import FarmMap from '$lib/components/FarmMap.svelte';
  import TasksPanel from '$lib/components/TasksPanel.svelte';
  import SageDeck from '$lib/components/SageDeck.svelte';
  import SageCharacter from '$lib/components/SageCharacter.svelte';
  import BedInfoModal from '$lib/components/BedInfoModal.svelte';
  import HarvestReadyModal from '$lib/components/HarvestReadyModal.svelte';
  import WeatherModal from '$lib/components/WeatherModal.svelte';

  let now = new Date();
  let clockInterval;
  let weatherInterval;
  let bedMode = 'default';
  let showWeather = false;
  let infoBedId = null;
  let highlightedBedIds = [];
  let harvestInfoBedId = null;
  let activeTab = 'map';

  initFarmState(data.beds);

  onMount(() => {
    clockInterval = setInterval(() => { now = new Date(); }, 30_000);
    fetchWeather();
    weatherInterval = setInterval(fetchWeather, 30 * 60_000);
    loadTasks();
  });
  onDestroy(() => {
    clearInterval(clockInterval);
    clearInterval(weatherInterval);
  });

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

  async function loadTasks() {
    try {
      const res = await fetch('/api/tasks');
      if (res.ok) {
        const dbTasks = await res.json();
        farmState.update(s => ({ ...s, tasks: dbTasks }));
      }
    } catch {}
  }

  $: auto = autoTasks($farmState.beds);
  $: allTasks = [...auto, ...$farmState.tasks];
  $: badgeCount = openTaskCount(allTasks);

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
      const bed = $farmState.beds.find(b => b.id === id);
      addLog(`Rega registada para ${bed?.notionCode || id}. A valvula e controlada pelo HA.`);
    } else if (tool === 'shovel') {
      farmState.update(s => ({
        ...s,
        beds: s.beds.map(b => b.id === id ? { ...b, diasSemSachar: 0 } : b),
        composter: { ...s.composter, fill: Math.min(1, s.composter.fill + 0.05) },
      }));
      const bed = $farmState.beds.find(b => b.id === id);
      addLog(`Sachado ${bed?.notionCode || id}. +5% compostor.`);
      fetch('/api/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bedId: id, action: 'sachar', details: `Sachado ${bed?.notionCode || id}` }),
      });
    } else if (tool === 'harvest') {
      const { species, rotationId, finished } = payload || {};
      const bed = $farmState.beds.find(b => b.id === id);
      const rot = bed?.rotations?.find(r => r.id === rotationId);
      const planting = rot?.plantings?.find(p => p.species === species);
      if (!planting) return;
      const yld = planting.count;
      farmState.update(s => {
        const harvested = { ...s.harvested, [species]: (s.harvested[species] || 0) + yld };
        const beds = s.beds.map(b => {
          if (b.id !== id) return b;
          const rotations = b.rotations.map(r => {
            if (r.id !== rotationId) return r;
            const plantings = finished ? r.plantings.filter(p => p.species !== species) : r.plantings;
            const estado = plantings.length === 0 ? 'Terminado' : r.estado;
            return { ...r, plantings, estado };
          });
          const activeRots = rotations.filter(r => r.estado === 'Plantado' || r.estado === 'A colher');
          const allPlantings = activeRots.flatMap(r => r.plantings || []);
          return { ...b, rotations, activeRotations: activeRots, allPlantings };
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
      addLog('Cortaste a relva. Aparas -> compostor (+12%).');
    }
  }

  function handleHighlight(e) {
    highlightedBedIds = e.detail;
    setTimeout(() => { highlightedBedIds = []; }, 3000);
  }
</script>

<svelte:head>
  <title>SmartFarm</title>
</svelte:head>

<div class="farm-root">
  <TopBar
    state={$farmState}
    {bedMode}
    weather={$weatherStore}
    {now}
    on:toggleMode={() => { bedMode = bedMode === 'default' ? 'monitoring' : 'default'; }}
    on:openWeather={() => { showWeather = true; }}
  />

  <div class="farm-grid desktop-only">
    <div class="farm-col-left">
      <TasksPanel
        tasks={allTasks}
        on:refresh={loadTasks}
        on:highlight={handleHighlight}
      />
    </div>

    <div class="farm-col-center">
      <FarmMap
        state={$farmState}
        {highlightedBedIds}
        {bedMode}
        on:useTool={handleUseTool}
        on:showInfo={(e) => { infoBedId = e.detail; }}
        on:showHarvestInfo={(e) => { harvestInfoBedId = e.detail; }}
      />
    </div>
  </div>

  <div class="desktop-only">
    <SageDeck
      state={$farmState}
      log={$farmState.log}
      on:highlight={handleHighlight}
      on:taskCreated={loadTasks}
    />
  </div>

  <!-- Mobile layout -->
  <div class="mobile-only">
    {#if activeTab === 'map'}
      <FarmMap
        state={$farmState}
        {highlightedBedIds}
        {bedMode}
        on:useTool={handleUseTool}
        on:showInfo={(e) => { infoBedId = e.detail; }}
        on:showHarvestInfo={(e) => { harvestInfoBedId = e.detail; }}
      />
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <div class="sage-strip" on:click={() => { activeTab = 'sage'; }} role="button" tabindex="0">
        <div class="sage-strip-portrait">
          <SageCharacter talking={false} size={2} />
        </div>
        <div class="sage-strip-text">Toca para falar com o Sage...</div>
      </div>
    {:else if activeTab === 'sage'}
      <SageDeck
        state={$farmState}
        log={$farmState.log}
        on:highlight={handleHighlight}
        on:taskCreated={loadTasks}
      />
    {:else if activeTab === 'tasks'}
      <TasksPanel
        tasks={allTasks}
        on:refresh={loadTasks}
        on:highlight={handleHighlight}
      />
    {/if}

    <div class="m-tabs">
      <button class="m-tab" class:m-tab-active={activeTab === 'map'} on:click={() => { activeTab = 'map'; }}>
        <span class="m-tab-icon">🗺</span>
        <span class="m-tab-label">MAPA</span>
      </button>
      <button class="m-tab" class:m-tab-active={activeTab === 'sage'} on:click={() => { activeTab = 'sage'; }}>
        <span class="m-tab-icon">🌾</span>
        <span class="m-tab-label">SAGE</span>
      </button>
      <button class="m-tab" class:m-tab-active={activeTab === 'tasks'} on:click={() => { activeTab = 'tasks'; }}>
        <span class="m-tab-icon">📋</span>
        <span class="m-tab-label">TAREFAS</span>
        {#if badgeCount > 0}
          <span class="m-tab-badge">{badgeCount}</span>
        {/if}
      </button>
    </div>
  </div>

  {#if infoBedId}
    <BedInfoModal bind:bedId={infoBedId} state={$farmState} />
  {/if}

  {#if harvestInfoBedId}
    <HarvestReadyModal
      bedId={harvestInfoBedId}
      state={$farmState}
      on:close={() => { harvestInfoBedId = null; }}
      on:goHarvest={() => { harvestInfoBedId = null; }}
    />
  {/if}

  <WeatherModal
    bind:open={showWeather}
    current={$weatherStore}
    forecast={$forecastStore}
    location={$locationStore}
  />
</div>
