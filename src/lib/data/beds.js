// Bed registry — sourced from the Notion "Raised Beds" + "Planeamento" databases.
// Each bed has multiple cultures (companion planting), real planting dates, rotation info, and pest notes.

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

// Average growth cycle of a bed's plantings (days)
export function bedAvgCycle(bed) {
  if (!bed?.plantings?.length) return 0;
  const sum = bed.plantings.reduce((s, p) => s + (PLANT_SPECIES[p.species]?.growthDays || 60), 0);
  return Math.round(sum / bed.plantings.length);
}

// 0..1 progress through the average cycle
export function bedCycleProgress(bed) {
  if (!bed?.plantedDate) return 0;
  const cycle = bedAvgCycle(bed);
  if (!cycle) return 0;
  const since = daysSince(bed.plantedDate) || 0;
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

// Status helpers — based on dates relative to today
export function bedPhase(bed) {
  const since = daysSince(bed.plantedDate);
  const tilHarvest = bed.harvestStart ? daysUntil(bed.harvestStart) : null;
  if (bed.estado === 'A colher') return 'COLHEITA';
  if (tilHarvest !== null && tilHarvest <= 0) return 'COLHEITA';
  if (since !== null && since < 14) return 'GERMINAÇÃO';
  if (since !== null && since < 45) return 'CRESCIMENTO';
  return 'MATURAÇÃO';
}

// ---- Bed data ----

export const NOTION_BEDS = {
  C2: {
    notionCode: 'RB-11',
    widthM: 3.2, heightM: 1.5,
    plantedDate: '2026-04-26',
    harvestStart: '2026-07-15',
    harvestEnd: '2026-10-31',
    season: 'Primavera/Verão 2026',
    rotation: '3 - Fruto',
    estado: 'Plantado',
    plantings: [
      { species: 'tomate_coracao', count: 11, fn: 'Cultura principal — Jul-Out' },
      { species: 'tomate_cacho', count: 4, fn: 'Precoce, tolera oídio' },
      { species: 'tomate_cherry', count: 5, fn: 'Muito precoce, poda semanal' },
      { species: 'manjericao', count: 7, fn: 'Repele pulgões e mosca-branca' },
      { species: 'calendula', count: 8, fn: 'Bordadura — atrai sirídeos' },
      { species: 'alface', count: 5, fn: 'Consociação rápida' },
    ],
    nextRotation: 'Próx.: Feijão Verde + Courgette + Manjericão + Calêndula (Prim/Verão 2026)',
    pestNotes: 'Manjericão contra pulgões. Calêndula em bordadura. Vigilância míldio em Agosto.',
    notes: '20 tomates em 5.25m² após monda. Substrato com aparas → imobiliza azoto. Compo Bio Tomate quinzenal + borras de café contínuas + top-dressing composto em Julho.',
    history: [
      { season: 'Inverno 2025-2026', plants: ['Folhas mistas'], notes: 'Cama de inverno preparativa' },
    ],
  },
  B2: {
    notionCode: 'RB-12',
    widthM: 1.6, heightM: 1.5,
    plantedDate: '2026-01-11',
    harvestStart: '2026-03-28',
    harvestEnd: null,
    season: 'Inverno 2025-2026',
    rotation: '1 - Folha / Leguminosa',
    estado: 'A colher',
    plantings: [
      { species: 'alho_frances', count: 6, fn: 'Cultura principal inverno' },
      { species: 'cebolo', count: 8, fn: 'Bordadura' },
      { species: 'cenoura', count: 4, fn: 'Coexiste com alface' },
      { species: 'alface', count: 6, fn: 'Escalonada' },
    ],
    nextRotation: 'Sucessão 2026: à medida que alho-francês e cenouras são colhidos, espaço para pimentos / beringelas.',
    pestNotes: '',
    notes: 'Cama intensiva. Cebolo em bordadura, restantes em 6 porções.',
    history: [],
  },
  A2: {
    notionCode: 'RB-13',
    widthM: 3.2, heightM: 1.5,
    plantedDate: '2026-01-24',
    harvestStart: null,
    harvestEnd: null,
    season: 'Inverno 2025-2026',
    rotation: '1 - Folha / Leguminosa',
    estado: 'A colher',
    plantings: [
      { species: 'alface', count: 8, fn: 'Replantação segura' },
      { species: 'salsa', count: 4, fn: 'Coentros/salsa OK' },
      { species: 'feijao_verde', count: 6, fn: 'Anão, fixa azoto' },
    ],
    nextRotation: 'A definir — Brassicáceas BLOQUEADAS em 2026 por Delia radicum.',
    pestNotes: '⚠️ Mosca da couve (Delia radicum). Aplicar S. feltiae no inverno. Sem brassicáceas em 2026.',
    notes: 'FALHADO Mar 2026: couve lombarda e brócolos destruídos por larvas nas raízes. Replantado com alface + salsa + feijão.',
    history: [
      { season: 'Inverno 2025-2026', plants: ['Couve Lombarda', 'Brócolos'], notes: '❌ Falhou por Delia radicum' },
    ],
  },
  C1: {
    notionCode: 'RB-21',
    widthM: 3.2, heightM: 1.5,
    plantedDate: '2026-04-25',
    harvestStart: '2026-07-01',
    harvestEnd: '2026-09-30',
    season: 'Primavera/Verão 2026',
    rotation: '3 - Fruto',
    estado: 'Plantado',
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
    nextRotation: '⚠️ 2027: evitar Cucurbitaceae E Solanaceae.',
    pestNotes: 'Rede anti-inseto (retirar à floração para polinização). Vigilância oídio nas courgettes e míldio nas solanáceas.',
    notes: 'Cama mista 5.25m². 2 courgettes ao centro + solanáceas em volta. 8 famílias botânicas.',
    history: [],
  },
  B1: {
    notionCode: 'RB-22',
    widthM: 1.6, heightM: 1.5,
    plantedDate: '2026-03-07',
    harvestStart: '2026-06-15',
    harvestEnd: '2026-09-30',
    season: 'Primavera/Verão 2026',
    rotation: '1 - Folha / Leguminosa',
    estado: 'Plantado',
    plantings: [
      { species: 'feijao_verde', count: 12, fn: 'Cultura principal — fixa azoto' },
      { species: 'segurelha', count: 4, fn: '"Bohnenkraut" — companheira do feijão' },
      { species: 'tagetes', count: 3, fn: 'Repele nematóides + atrai polinizadores' },
    ],
    nextRotation: 'Sucessão: 2-3 pimentos transplantados em Maio. Beringelas em Junho.',
    pestNotes: '⚠️ Kale REMOVIDA (Abr 2026) por Delia radicum. Brassicáceas bloqueadas em 2026.',
    notes: '"Da Horta à Mesa". Feijão + Segurelha + Tagetes. Solanáceas em coexistência a partir de Maio.',
    history: [
      { season: 'Primavera 2026', plants: ['Couve Kale'], notes: '❌ Removida por Delia radicum' },
    ],
  },
  A1: {
    notionCode: 'RB-23',
    widthM: 3.2, heightM: 1.5,
    plantedDate: '2026-03-15',
    harvestStart: null,
    harvestEnd: '2026-09-30',
    season: 'Primavera/Verão 2026',
    rotation: '1 - Folha / Leguminosa',
    estado: 'A colher',
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
    nextRotation: '7 famílias = rotação excelente. Solanáceas elegíveis em 2027.',
    pestNotes: 'Calêndula + Manjericão protegem contra pragas. Pepino sensível a oídio.',
    notes: 'Ocupação intensiva 4.8m². Fase 1 (Mar-Mai): folhas/raízes rápidas. Fase 2 (Abr-Set): pepino + acelga + feijão.',
    history: [
      { season: 'Inverno 2025-2026', plants: ['Folhas mistas'] },
    ],
  },
};
