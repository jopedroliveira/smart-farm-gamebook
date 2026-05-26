// Farm state store.
// Initialized with defaults, then hydrated from server data via initFarmState().

import { writable } from 'svelte/store';
import { daysSince, daysUntil, activeRotations, allActivePlantings, bedPlantedDate } from '$lib/data/beds.js';

const NOTION_TODAY = new Date().toISOString().slice(0, 10);

function enrichBed(bed) {
  const active = activeRotations(bed);
  const plantings = allActivePlantings(bed);
  const planted = bedPlantedDate(bed);

  return {
    ...bed,
    // RB-XY: X = row, Y = column
    row: parseInt(bed.id[3]),
    col: parseInt(bed.id[4]),
    // Derived convenience fields
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
  quests: [
    { id: 1, text: 'Regar 3 camas', goal: 3, prog: 0, done: false, reward: 20 },
    { id: 2, text: 'Colher alface em RB-13', goal: 1, prog: 0, done: false, reward: 15 },
    { id: 3, text: 'Sachar RB-13 (Brassicaceae bloqueada)', goal: 1, prog: 0, done: false, reward: 10 },
  ],
  log: [
    { t: '08:42', msg: `Bom dia! ${NOTION_TODAY} — Dia ensolarado. Crescimento +20%.` },
    { t: '08:45', msg: 'Sensor RB-13: humidade BAIXA. Vigiar Delia radicum.' },
    { t: '08:50', msg: 'RB-21: tomate ~24 dias após plantação. Reforço Compo Bio na próxima rega.' },
  ],
});

// Initialize the store with server-loaded bed data
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
  // Use earliest harvestStart among active rotations
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

export function bedHealth(bed) {
  const w = bed.watered < 0.2 ? 0.3 : bed.watered > 0.85 ? 0.7 : 1;
  const s = bed.soilHealth;
  const p = 1 - bed.pests;
  const wd = 1 - bed.weeds;
  return Math.max(0, Math.min(1, w * 0.4 + s * 0.3 + p * 0.15 + wd * 0.15));
}

export function bedStatusLabel(bed) {
  if (bedReady(bed)) return 'COLHEITA';
  if (bed.watered < 0.25) return 'SEDE';
  if (bed.weeds > 0.4) return 'ERVAS';
  if (bed.pests > 0.4) return 'PRAGAS';
  if (bedHealth(bed) > 0.75) return 'PRÓSPERA';
  return 'CRESCER';
}

export function bedPrimarySpecies(bed) {
  const plantings = bed.allPlantings || allActivePlantings(bed);
  if (!plantings.length) return null;
  return [...plantings].sort((a, b) => b.count - a.count)[0];
}

export const WEATHER_ICONS = {
  sunny: '☀', cloudy: '☁', rain: '☂', storm: '⚡',
};

export const WEATHER_LABELS_PT = {
  sunny: 'SOL', cloudy: 'NUBLADO', rain: 'CHUVA', storm: 'TROVOADA',
};
