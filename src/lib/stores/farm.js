// Svelte store for the farm state — replaces farm-state.jsx's INITIAL_STATE + React useState.
//
// In Svelte, a "store" is just an object with .subscribe() (and optionally .set/.update).
// The `writable` function creates one for us. In components, prefix with $ to auto-subscribe.

import { writable, derived } from 'svelte/store';
import { NOTION_BEDS, daysSince, daysUntil } from '$lib/data/beds.js';
import { PLANT_SPECIES } from '$lib/data/plant-species.js';

// ---- Build initial beds from Notion data ----

function buildInitialBeds() {
  const seedHealth = { A1: 0.85, B1: 0.7, C1: 0.5, A2: 0.85, B2: 0.8, C2: 0.75 };
  const seedWater = { A1: 0.65, B1: 0.4, C1: 0.45, A2: 0.7, B2: 0.55, C2: 0.6 };
  const seedWeeds = { A1: 0.1, B1: 0.2, C1: 0.35, A2: 0.05, B2: 0.15, C2: 0.1 };
  const seedPests = { A1: 0.05, B1: 0.0, C1: 0.35, A2: 0.1, B2: 0.15, C2: 0.05 };
  return Object.entries(NOTION_BEDS).map(([id, b]) => ({
    id,
    row: parseInt(id[1]),
    col: id[0] === 'A' ? 1 : id[0] === 'B' ? 2 : 3,
    ...b,
    // game layer
    watered: seedWater[id],
    soilHealth: seedHealth[id],
    pests: seedPests[id],
    weeds: seedWeeds[id],
  }));
}

const NOTION_TODAY = new Date().toISOString().slice(0, 10);

export const farmState = writable({
  day: 0,
  hour: 9,
  weather: 'sunny',
  temp: 22,
  beds: buildInitialBeds(),
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

// ---- Derived helpers (computed from bed data) ----

export function bedDaysSincePlanting(bed) {
  return daysSince(bed.plantedDate) || 0;
}

export function bedDaysUntilHarvest(bed) {
  return bed.harvestStart ? daysUntil(bed.harvestStart) : null;
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
  if (bed.estado === 'A colher') return true;
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
  if (!bed.plantings || !bed.plantings.length) return null;
  return [...bed.plantings].sort((a, b) => b.count - a.count)[0];
}

export const WEATHER_ICONS = {
  sunny: '☀',
  cloudy: '☁',
  rain: '☂',
  storm: '⚡',
};

export const WEATHER_LABELS_PT = {
  sunny: 'SOL',
  cloudy: 'NUBLADO',
  rain: 'CHUVA',
  storm: 'TROVOADA',
};
