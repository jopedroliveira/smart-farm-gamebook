// Bed state derived from cycles and crops. Pure functions, usable in components.
// A bed looks like { cycles: [{ id, title, closedOn, crops: [{ inOn, outOn, count, role, species: { growthDays, ... } }] }] }.

import { daysSince } from './beds.js';

const DEFAULT_GROWTH_DAYS = 60;
const PHASES = ['GERMINACAO', 'CRESCIMENTO', 'MATURACAO', 'COLHEITA'];

export function openCycle(bed) {
  return (bed.cycles || []).find(c => !c.closedOn) || null;
}

export function closedCycles(bed) {
  return (bed.cycles || []).filter(c => c.closedOn).sort((a, b) => b.closedOn.localeCompare(a.closedOn));
}

export function cropsIn(bed) {
  const open = openCycle(bed);
  return open ? (open.crops || []).filter(c => !c.outOn) : [];
}

// In the ground now, and planned for later in the same cycle (no entry date yet).
export function cropsGrowing(bed) {
  return cropsIn(bed).filter(c => c.inOn);
}

export function cropsPlanned(bed) {
  return cropsIn(bed).filter(c => !c.inOn);
}

export function cropDaysIn(crop) {
  return crop.inOn ? daysSince(crop.inOn) : null;
}

export function cropGrowthDays(crop) {
  return crop.species?.growthDays || DEFAULT_GROWTH_DAYS;
}

export function cropStage(crop) {
  const days = cropDaysIn(crop);
  if (days === null) return 0;
  const r = days / cropGrowthDays(crop);
  if (r < 0.15) return 0;
  if (r < 0.55) return 1;
  if (r < 0.95) return 2;
  return 3;
}

export function bedProgress(bed) {
  const sown = cropsIn(bed).filter(c => c.inOn);
  if (!sown.length) return 0;
  const avg = sown.reduce((s, c) => s + cropGrowthDays(c), 0) / sown.length;
  const oldest = sown.map(c => c.inOn).sort()[0];
  return Math.max(0, Math.min(1, (daysSince(oldest) || 0) / avg));
}

export function bedPhase(bed) {
  const crops = cropsIn(bed);
  if (!crops.length) return 'VAZIA';
  if (!crops.some(c => c.inOn)) return 'PLANEADO';
  const stage = Math.max(...crops.filter(c => c.inOn).map(cropStage));
  return PHASES[stage];
}

export function bedReady(bed) {
  return bedPhase(bed) === 'COLHEITA';
}

export function primaryCrop(bed) {
  const crops = cropsIn(bed);
  if (!crops.length) return null;
  const principal = crops.filter(c => c.role === 'principal');
  const pool = principal.length ? principal : crops;
  return [...pool].sort((a, b) => b.count - a.count)[0];
}
