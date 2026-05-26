// Bed registry — sourced from the Notion "Raised Beds" + "Planeamento" databases.
// Each bed has N rotations over time. Each rotation has multiple cultures (companion planting).

import { PLANT_SPECIES } from './plant-species.js';

// ---- Date helpers ----

export function daysSince(iso) {
  if (!iso) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const then = new Date(iso + 'T00:00:00');
  return Math.floor((today - then) / (1000 * 60 * 60 * 24));
}

export function daysUntil(iso) {
  if (!iso) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const then = new Date(iso + 'T00:00:00');
  return Math.floor((then - today) / (1000 * 60 * 60 * 24));
}

// ---- Rotation helpers ----

// Active rotations = Plantado or A colher
export function activeRotations(bed) {
  return (bed.rotations || []).filter(r => r.estado === 'Plantado' || r.estado === 'A colher');
}

// All plantings from active rotations, flattened
export function allActivePlantings(bed) {
  return activeRotations(bed).flatMap(r => r.plantings || []);
}

// Average growth cycle across all active plantings (days)
export function bedAvgCycle(bed) {
  const plantings = allActivePlantings(bed);
  if (!plantings.length) return 0;
  const sum = plantings.reduce((s, p) => s + (PLANT_SPECIES[p.species]?.growthDays || 60), 0);
  return Math.round(sum / plantings.length);
}

// 0..1 progress through the average cycle (uses oldest active rotation's plantedDate)
export function bedCycleProgress(bed) {
  const active = activeRotations(bed);
  if (!active.length) return 0;
  // Use the oldest active rotation's planted date
  const oldest = active.reduce((a, b) =>
    (a.plantedDate || '') < (b.plantedDate || '') ? a : b
  );
  if (!oldest.plantedDate) return 0;
  const cycle = bedAvgCycle(bed);
  if (!cycle) return 0;
  const since = daysSince(oldest.plantedDate) || 0;
  return Math.max(0, Math.min(1, since / cycle));
}

// Per-species stage: 0=germinacao, 1=crescimento, 2=maturacao, 3=pronto
export function speciesStage(species, daysSincePlant) {
  const cycle = PLANT_SPECIES[species]?.growthDays || 60;
  const r = daysSincePlant / cycle;
  if (r < 0.15) return 0;
  if (r < 0.55) return 1;
  if (r < 0.95) return 2;
  return 3;
}

// Oldest planted date among active rotations
export function bedPlantedDate(bed) {
  const active = activeRotations(bed);
  if (!active.length) return null;
  const dates = active.map(r => r.plantedDate).filter(Boolean);
  if (!dates.length) return null;
  return dates.sort()[0];
}

// Status helpers — based on dates relative to today
export function bedPhase(bed) {
  const active = activeRotations(bed);
  if (active.some(r => r.estado === 'A colher')) return 'COLHEITA';
  const planted = bedPlantedDate(bed);
  const since = daysSince(planted);
  if (since !== null && since < 14) return 'GERMINAÇÃO';
  if (since !== null && since < 45) return 'CRESCIMENTO';
  return 'MATURAÇÃO';
}

// ---- Bed seed data ----

export const NOTION_BEDS = {
  'RB-11': {
    notionCode: 'RB-11',
    widthM: 3.2, heightM: 1.5,
    notes: '20 tomates em 5.25m² após monda. Substrato com aparas → imobiliza azoto. Compo Bio Tomate quinzenal + borras de café contínuas + top-dressing composto em Julho.',
    nextRotation: 'Próx.: Feijão Verde + Courgette + Manjericão + Calêndula (Prim/Verão 2026)',
    rotations: [
      {
        title: 'RB-11 Primavera-Verão 2026 · Tomates & consociação',
        season: 'Primavera/Verão',
        rotation: '3 - Fruto',
        estado: 'Plantado',
        plantedDate: '2026-04-26',
        harvestStart: '2026-07-15',
        harvestEnd: '2026-10-31',
        pestNotes: 'Manjericão contra pulgões. Calêndula em bordadura. Vigilância míldio em Agosto.',
        notes: '',
        plantings: [
          { species: 'tomate_coracao', count: 11, fn: 'Cultura principal — Jul-Out' },
          { species: 'tomate_cacho', count: 4, fn: 'Precoce, tolera oídio' },
          { species: 'tomate_cherry', count: 5, fn: 'Muito precoce, poda semanal' },
          { species: 'manjericao', count: 7, fn: 'Repele pulgões e mosca-branca' },
          { species: 'calendula', count: 8, fn: 'Bordadura — atrai sirídeos' },
          { species: 'alface', count: 5, fn: 'Consociação rápida' },
        ],
      },
      {
        title: 'RB-11 Inverno 2025-2026 · Folhas mistas',
        season: 'Inverno',
        rotation: '1 - Folha / Leguminosa',
        estado: 'Terminado',
        plantedDate: '2025-10-15',
        harvestStart: null,
        harvestEnd: null,
        pestNotes: '',
        notes: 'Cama de inverno preparativa',
        plantings: [],
      },
    ],
  },
  'RB-12': {
    notionCode: 'RB-12',
    widthM: 1.6, heightM: 1.5,
    notes: 'Cama intensiva. Cebolo em bordadura, restantes em 6 porções.',
    nextRotation: 'Sucessão 2026: à medida que alho-francês e cenouras são colhidos, espaço para pimentos / beringelas.',
    rotations: [
      {
        title: 'RB-12 Inverno 2025-2026 · Alho-francês & raízes',
        season: 'Inverno',
        rotation: '1 - Folha / Leguminosa',
        estado: 'A colher',
        plantedDate: '2026-01-11',
        harvestStart: '2026-03-28',
        harvestEnd: null,
        pestNotes: '',
        notes: '',
        plantings: [
          { species: 'alho_frances', count: 6, fn: 'Cultura principal inverno' },
          { species: 'cebolo', count: 8, fn: 'Bordadura' },
          { species: 'cenoura', count: 4, fn: 'Coexiste com alface' },
          { species: 'alface', count: 6, fn: 'Escalonada' },
        ],
      },
    ],
  },
  'RB-13': {
    notionCode: 'RB-13',
    widthM: 3.2, heightM: 1.5,
    notes: 'FALHADO Mar 2026: couve lombarda e brócolos destruídos por larvas nas raízes. Replantado com alface + salsa + feijão.',
    nextRotation: 'A definir — Brassicáceas BLOQUEADAS em 2026 por Delia radicum.',
    rotations: [
      {
        title: 'RB-13 Inverno 2025-2026 · Alface & salsa & feijão',
        season: 'Inverno',
        rotation: '1 - Folha / Leguminosa',
        estado: 'A colher',
        plantedDate: '2026-01-24',
        harvestStart: null,
        harvestEnd: null,
        pestNotes: '⚠️ Mosca da couve (Delia radicum). Aplicar S. feltiae no inverno. Sem brassicáceas em 2026.',
        notes: '',
        plantings: [
          { species: 'alface', count: 8, fn: 'Replantação segura' },
          { species: 'salsa', count: 4, fn: 'Coentros/salsa OK' },
          { species: 'feijao_verde', count: 6, fn: 'Anão, fixa azoto' },
        ],
      },
      {
        title: 'RB-13 Inverno 2025-2026 · Brassicas (Falhado)',
        season: 'Inverno',
        rotation: '1 - Folha / Leguminosa',
        estado: 'Terminado',
        failed: true,
        plantedDate: '2025-10-20',
        harvestStart: null,
        harvestEnd: null,
        pestNotes: '',
        notes: '❌ Falhou por Delia radicum',
        plantings: [],
      },
    ],
  },
  'RB-21': {
    notionCode: 'RB-21',
    widthM: 3.2, heightM: 1.5,
    notes: 'Cama mista 5.25m². 2 courgettes ao centro + solanáceas em volta. 8 famílias botânicas.',
    nextRotation: '⚠️ 2027: evitar Cucurbitaceae E Solanaceae.',
    rotations: [
      {
        title: 'RB-21 Primavera-Verão 2026 · Courgettes & solanáceas',
        season: 'Primavera/Verão',
        rotation: '3 - Fruto',
        estado: 'Plantado',
        plantedDate: '2026-04-25',
        harvestStart: '2026-07-01',
        harvestEnd: '2026-09-30',
        pestNotes: 'Rede anti-inseto (retirar à floração para polinização). Vigilância oídio nas courgettes e míldio nas solanáceas.',
        notes: '',
        plantings: [
          { species: 'courgette', count: 2, fn: 'Cultura principal — centro' },
          { species: 'pimento', count: 5, fn: 'Bordadura, 40×40 cm' },
          { species: 'beringela', count: 2, fn: 'Fora do canopy' },
          { species: 'manjericao', count: 5, fn: 'Intercalado' },
          { species: 'endro', count: 3, fn: 'Atrai sirídeos + vespas' },
          { species: 'calendula', count: 6, fn: 'Bordadura' },
          { species: 'salsa', count: 3, fn: 'Intercalar (semeada 07/05)' },
          { species: 'camomila', count: 2, fn: 'Atrai sirfídeos/crisopas' },
        ],
      },
    ],
  },
  'RB-22': {
    notionCode: 'RB-22',
    widthM: 1.6, heightM: 1.5,
    notes: '"Da Horta à Mesa". Feijão + Segurelha + Tagetes. Solanáceas em coexistência a partir de Maio.',
    nextRotation: 'Sucessão: 2-3 pimentos transplantados em Maio. Beringelas em Junho.',
    rotations: [
      {
        title: 'RB-22 Primavera-Verão 2026 · Feijão & aromáticas',
        season: 'Primavera/Verão',
        rotation: '1 - Folha / Leguminosa',
        estado: 'Plantado',
        plantedDate: '2026-03-07',
        harvestStart: '2026-06-15',
        harvestEnd: '2026-09-30',
        pestNotes: '⚠️ Kale REMOVIDA (Abr 2026) por Delia radicum. Brassicáceas bloqueadas em 2026.',
        notes: '',
        plantings: [
          { species: 'feijao_verde', count: 12, fn: 'Cultura principal — fixa azoto' },
          { species: 'segurelha', count: 4, fn: '"Bohnenkraut" — companheira do feijão' },
          { species: 'tagetes', count: 3, fn: 'Repele nematóides + atrai polinizadores' },
        ],
      },
      {
        title: 'RB-22 Primavera 2026 · Kale (Falhado)',
        season: 'Primavera',
        rotation: '1 - Folha / Leguminosa',
        estado: 'Terminado',
        failed: true,
        plantedDate: '2026-02-15',
        harvestStart: null,
        harvestEnd: null,
        pestNotes: '',
        notes: '❌ Removida por Delia radicum',
        plantings: [],
      },
    ],
  },
  'RB-23': {
    notionCode: 'RB-23',
    widthM: 3.2, heightM: 1.5,
    notes: 'Ocupação intensiva 4.8m². Fase 1 (Mar-Mai): folhas/raízes rápidas. Fase 2 (Abr-Set): pepino + acelga + feijão.',
    nextRotation: '7 famílias = rotação excelente. Solanáceas elegíveis em 2027.',
    rotations: [
      {
        title: 'RB-23 Primavera-Verão 2026 · Mista intensiva',
        season: 'Primavera/Verão',
        rotation: '1 - Folha / Leguminosa',
        estado: 'A colher',
        plantedDate: '2026-03-15',
        harvestStart: null,
        harvestEnd: '2026-09-30',
        pestNotes: 'Calêndula + Manjericão protegem contra pragas. Pepino sensível a oídio.',
        notes: '',
        plantings: [
          { species: 'alface', count: 8, fn: 'Renovação escalonada — fim Mai' },
          { species: 'rucula', count: 4, fn: 'Colheita jovem — fim Mai' },
          { species: 'cenoura', count: 6, fn: 'Inicia colheita Mai-Jun' },
          { species: 'beterraba', count: 4, fn: 'Folhas comestíveis' },
          { species: 'pepino', count: 3, fn: 'Trepador, rede lado norte' },
          { species: 'acelga', count: 5, fn: 'Colheita contínua até Ago' },
          { species: 'feijao_verde', count: 6, fn: 'Anão, fixa azoto' },
          { species: 'manjericao', count: 4, fn: 'Aromático' },
          { species: 'calendula', count: 6, fn: 'Bordadura — polinização do pepino' },
        ],
      },
      {
        title: 'RB-23 Inverno 2025-2026 · Folhas mistas',
        season: 'Inverno',
        rotation: '1 - Folha / Leguminosa',
        estado: 'Terminado',
        plantedDate: '2025-10-15',
        harvestStart: null,
        harvestEnd: null,
        pestNotes: '',
        notes: '',
        plantings: [],
      },
    ],
  },
};
