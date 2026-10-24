import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { openCycle, cropsIn, cropsGrowing, cropsPlanned, cropDaysIn, cropStage, bedProgress, bedPhase, bedReady, closedCycles, primaryCrop } from '../cycles.js';

const alface = { id: 'alface', name: 'Alface', family: 'Asteraceae', sprite: 'lettuce', color: '#4fa83a', growthDays: 40 };
const cenoura = { id: 'cenoura', name: 'Cenoura', family: 'Apiaceae', sprite: 'carrot', color: '#e89640', growthDays: 80 };
const bed = (crops, closedOn = null) => ({ cycles: [{ id: 1, title: 'T', closedOn, crops }] });
const crop = (over) => ({ id: 9, speciesId: 'alface', count: 1, role: 'outra', inOn: null, outOn: null, species: alface, ...over });

beforeAll(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-23T12:00:00')); });
afterAll(() => vi.useRealTimers());

describe('derived bed state', () => {
  it('derives VAZIA, PLANEADO and COLHEITA from crops', () => {
    expect(bedPhase({ cycles: [] })).toBe('VAZIA');
    expect(bedPhase(bed([]))).toBe('VAZIA');
    expect(bedPhase(bed([crop({ inOn: null })]))).toBe('PLANEADO');
    expect(bedPhase(bed([crop({ inOn: '2026-09-01' })]))).toBe('COLHEITA');
    expect(bedPhase(bed([crop({ inOn: '2026-10-20' })]))).toBe('GERMINACAO');
    expect(bedPhase(bed([crop({ inOn: '2026-10-05' })]))).toBe('CRESCIMENTO');
    expect(bedPhase(bed([crop({ inOn: '2026-09-20' })]))).toBe('MATURACAO');
  });

  it('splits crops in the ground from planned ones', () => {
    const b = bed([crop({ id: 1, inOn: '2026-10-01' }), crop({ id: 2, inOn: null }), crop({ id: 3, inOn: '2026-09-01', outOn: '2026-10-01' })]);
    expect(cropsGrowing(b).map(c => c.id)).toEqual([1]);
    expect(cropsPlanned(b).map(c => c.id)).toEqual([2]);
  });

  it('ignores crops that are out and cycles that are closed', () => {
    expect(cropsIn(bed([crop({ inOn: '2026-09-01', outOn: '2026-10-01' })]))).toEqual([]);
    expect(openCycle(bed([crop({ inOn: '2026-09-01' })], '2026-10-01'))).toBeNull();
    expect(bedPhase(bed([crop({ inOn: '2026-09-01' })], '2026-10-01'))).toBe('VAZIA');
  });

  it('counts days in and the stage per crop', () => {
    expect(cropDaysIn(crop({ inOn: null }))).toBeNull();
    expect(cropDaysIn(crop({ inOn: '2026-10-13' }))).toBe(10);
    expect(cropStage(crop({ inOn: null }))).toBe(0);
    expect(cropStage(crop({ inOn: '2026-10-20' }))).toBe(0);
    expect(cropStage(crop({ inOn: '2026-10-05' }))).toBe(1);
    expect(cropStage(crop({ inOn: '2026-09-20' }))).toBe(2);
    expect(cropStage(crop({ inOn: '2026-09-01' }))).toBe(3);
    expect(cropStage(crop({ inOn: '2026-10-01', species: { ...alface, growthDays: null } }))).toBe(1);
  });

  it('progress is 0 while nothing is sown and uses the oldest crop over the average cycle', () => {
    expect(bedProgress(bed([crop({ inOn: null })]))).toBe(0);
    const b = bed([crop({ inOn: '2026-09-23' }), crop({ id: 10, speciesId: 'cenoura', species: cenoura, inOn: '2026-10-13' })]);
    expect(bedProgress(b)).toBeCloseTo(30 / 60, 5);
  });

  it('bedReady follows COLHEITA', () => {
    expect(bedReady(bed([crop({ inOn: '2026-09-01' })]))).toBe(true);
    expect(bedReady(bed([crop({ inOn: '2026-10-20' })]))).toBe(false);
  });

  it('lists closed cycles newest first', () => {
    const b = { cycles: [
      { id: 1, closedOn: null, crops: [] },
      { id: 2, closedOn: '2026-03-01', crops: [] },
      { id: 3, closedOn: '2026-08-01', crops: [] },
    ] };
    expect(closedCycles(b).map(c => c.id)).toEqual([3, 2]);
  });

  it('primary crop prefers role principal, then the highest count', () => {
    const b = bed([crop({ id: 1, count: 10, role: 'companheira' }), crop({ id: 2, count: 2, role: 'principal' })]);
    expect(primaryCrop(b).id).toBe(2);
    const c = bed([crop({ id: 1, count: 10 }), crop({ id: 2, count: 2 })]);
    expect(primaryCrop(c).id).toBe(1);
    expect(primaryCrop(bed([]))).toBeNull();
  });
});
