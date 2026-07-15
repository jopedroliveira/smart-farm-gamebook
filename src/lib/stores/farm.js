import { writable } from 'svelte/store';
import { daysSince, daysUntil, activeRotations, allActivePlantings, bedPlantedDate } from '$lib/data/beds.js';

const NOTION_TODAY = new Date().toISOString().slice(0, 10);

function enrichBed(bed) {
  const active = activeRotations(bed);
  const plantings = allActivePlantings(bed);
  const planted = bedPlantedDate(bed);

  return {
    ...bed,
    row: parseInt(bed.id[3]),
    col: parseInt(bed.id[4]),
    activeRotations: active,
    allPlantings: plantings,
    plantedDate: planted,
  };
}

export const farmState = writable({
  day: 0,
  hour: 9,
  weather: 'sunny',
  temp: 22,
  beds: [],
  harvested: {},
  coins: 240,
  xp: 320,
  level: 4,
  selectedTool: 'water',
  selectedSeed: 'tomate_coracao',
  composter: { fill: 0.45, days: 12 },
  weedGarden: { lushness: 0.6 },
  tasks: [],
  log: [
    { t: '08:42', msg: `Bom dia! ${NOTION_TODAY}` },
  ],
});

export function initFarmState(serverBeds) {
  if (!serverBeds?.length) return;
  farmState.update((s) => ({
    ...s,
    beds: serverBeds.map(enrichBed),
  }));
}

// ---- Derived helpers ----

export function bedDaysSincePlanting(bed) {
  return daysSince(bed.plantedDate) || 0;
}

export function bedDaysUntilHarvest(bed) {
  const active = activeRotations(bed);
  const starts = active.map(r => r.harvestStart).filter(Boolean);
  if (!starts.length) return null;
  const earliest = starts.sort()[0];
  return daysUntil(earliest);
}

export function bedStage(bed) {
  if (!bed.plantedDate) return 0;
  const since = bedDaysSincePlanting(bed);
  const tilHarvest = bedDaysUntilHarvest(bed);
  if (since < 7) return 0;
  if (tilHarvest !== null && tilHarvest <= 0) return 3;
  if (since < 30) return 1;
  if (since < 60) return 2;
  return 3;
}

export function bedReady(bed) {
  const active = activeRotations(bed);
  if (active.some(r => r.estado === 'A colher')) return true;
  const til = bedDaysUntilHarvest(bed);
  return til !== null && til <= 0;
}

export function weedLevel(bed) {
  const days = bed.diasSemSachar;
  if (days === null) return 'unknown';
  if (days <= 2) return 'green';
  if (days <= 4) return 'yellow';
  if (days <= 6) return 'orange';
  if (days <= 10) return 'red';
  return 'brown';
}

export function weedColor(bed) {
  const colors = {
    green: '#5cd96b',
    yellow: '#ffe16a',
    orange: '#ff9a3c',
    red: '#ff5a5a',
    brown: '#8a5a2a',
    unknown: '#999',
  };
  return colors[weedLevel(bed)] || colors.unknown;
}

export function thirstLevel(bed) {
  const hours = bed.horasSemRega;
  if (hours === null) return 'unknown';
  if (hours < 24) return 'ok';
  if (hours < 48) return 'fine';
  if (hours < 72) return 'thirsty';
  return 'dry';
}

export function thirstColor(bed) {
  const colors = {
    ok: '#4fc3f7',
    fine: '#5cd96b',
    thirsty: '#ffe16a',
    dry: '#ff5a5a',
    unknown: '#999',
  };
  return colors[thirstLevel(bed)] || colors.unknown;
}

export function bedStatusLabel(bed) {
  if (bedReady(bed)) return 'COLHEITA';
  const wl = weedLevel(bed);
  if (wl === 'red' || wl === 'brown') return 'ERVAS';
  const tl = thirstLevel(bed);
  if (tl === 'dry') return 'SEDE';
  if (tl === 'thirsty') return 'REGAR';
  const active = activeRotations(bed);
  if (active.length === 0) return 'VAZIA';
  return 'OK';
}

export function bedPrimarySpecies(bed) {
  const plantings = bed.allPlantings || allActivePlantings(bed);
  if (!plantings.length) return null;
  return [...plantings].sort((a, b) => b.count - a.count)[0];
}

export function autoTasks(beds) {
  const water = [];
  const weed = [];
  const harvest = [];

  for (const bed of beds) {
    const code = bed.notionCode || bed.id;

    if (thirstLevel(bed) === 'dry') {
      water.push({
        id: `auto-water-${bed.id}`,
        text: `Regar ${code}`,
        bedId: bed.id,
        done: false,
        source: 'auto',
        reason: `${Math.round(bed.horasSemRega)}h sem rega`,
        createdAt: new Date().toISOString(),
      });
    }

    const wl = weedLevel(bed);
    if (wl === 'red' || wl === 'brown') {
      weed.push({
        id: `auto-weed-${bed.id}`,
        text: `Sachar ${code}`,
        bedId: bed.id,
        done: false,
        source: 'auto',
        reason: `${bed.diasSemSachar} dias sem sachar`,
        createdAt: new Date().toISOString(),
      });
    }

    const aColher = (bed.activeRotations || []).filter(r => r.estado === 'A colher');
    if (aColher.length > 0) {
      const primary = bedPrimarySpecies(bed);
      const speciesName = primary?.speciesId?.replace(/_/g, ' ') || 'culturas';
      const suffix = aColher.length > 1 ? ` (${aColher.length} rot.)` : '';
      harvest.push({
        id: `auto-harvest-${bed.id}`,
        text: `Colher ${speciesName} em ${code}${suffix}`,
        bedId: bed.id,
        done: false,
        source: 'auto',
        reason: 'estado: A colher',
        createdAt: new Date().toISOString(),
      });
    }
  }

  return [...water, ...weed, ...harvest];
}

export function openTaskCount(allTasks) {
  return allTasks.filter(t => !t.done).length;
}

export const WEATHER_ICONS = {
  sunny: '☀', cloudy: '☁', rain: '☂', storm: '⚡',
};

export const WEATHER_LABELS_PT = {
  sunny: 'SOL', cloudy: 'NUBLADO', rain: 'CHUVA', storm: 'TROVOADA',
};
