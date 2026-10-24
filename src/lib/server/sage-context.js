// The farm state Sage sees on every turn. Closed cycles stay one line each:
// the full notes of every past rotation once made the context huge and
// pushed the model into long reports.

import * as schema from './schema.js';
import { bedTimeline } from './cycles.js';
import { cropDaysIn, cropStage } from '../data/cycles.js';

const STAGE_LABELS = ['germinacao', 'crescimento', 'maturacao', 'pronto'];

// Drops null, undefined and empty-string fields so the context stays small.
export function compact(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0))
  );
}

function cropLine(c) {
  const name = (c.species?.name || c.speciesId).toLowerCase();
  const note = c.outcomeNote ? ` (${c.outcomeNote})` : '';
  return `${name} x${c.count} ${c.outcome || 'na terra'}${note}`;
}

function closedCycleLine(cycle) {
  const families = [...new Set(cycle.crops.map(c => c.species?.family).filter(Boolean))];
  const when = `${cycle.startedOn || '?'} a ${cycle.closedOn}`;
  const crops = cycle.crops.length ? cycle.crops.map(cropLine).join(', ') : 'sem culturas registadas';
  const tail = [families.length ? `familias: ${families.join(', ')}` : null, cycle.notes ? `notas: ${cycle.notes}` : null].filter(Boolean);
  return `${cycle.title} (${when}): ${crops}${tail.length ? ' | ' + tail.join(' | ') : ''}`;
}

function openCycleView(cycle) {
  if (!cycle) return null;
  return compact({
    id: cycle.id,
    titulo: cycle.title,
    esquema: cycle.scheme,
    inicio: cycle.startedOn,
    notas: cycle.notes,
    culturas: cycle.crops.filter(c => !c.outOn).map(c => compact({
      id: c.id,
      especie: c.speciesId,
      familia: c.species?.family,
      papel: c.role,
      quantidade: c.count,
      entrada: c.inOn,
      quando: c.inOn ? undefined : (c.planWhen || 'sem data'),
      dias: c.inOn ? cropDaysIn(c) : undefined,
      fase: c.inOn ? STAGE_LABELS[cropStage(c)] : 'planeada',
    })),
    saidas_recentes: cycle.crops.filter(c => c.outOn).map(c => `${cropLine(c)} em ${c.outOn}`),
  });
}

export function buildFarmContext(db, dashboardCtx, irrigation) {
  const beds = db.select().from(schema.beds).all();

  const canteiros = beds.map(bed => {
    const t = bedTimeline(db, bed.id);
    const dashboard = dashboardCtx?.beds?.find(b => b.id === bed.id || b.id === bed.notionCode);
    return compact({
      id: bed.notionCode,
      area_m2: +(bed.widthM * bed.heightM).toFixed(1),
      notas: bed.notes,
      proximo_plano: bed.nextRotation,
      rega: irrigation?.[bed.notionCode] || null,
      estado: dashboard ? compact({
        horasSemRega: dashboard.horasSemRega,
        diasSemSachar: dashboard.diasSemSachar,
        nivelRega: dashboard.rega,
        nivelErvas: dashboard.ervas,
      }) : null,
      ciclo_aberto: openCycleView(t.open),
      diario: t.diary.slice(0, 5).map(d => compact({ data: d.createdAt, acao: d.action, texto: d.details, cultura_id: d.cropId })),
      ciclos_anteriores: t.closed.map(closedCycleLine),
    });
  });

  return compact({
    data: new Date().toISOString().split('T')[0],
    compostor: dashboardCtx?.compost ? dashboardCtx.compost + '%' : null,
    clima: dashboardCtx?.weather,
    canteiros,
  });
}
