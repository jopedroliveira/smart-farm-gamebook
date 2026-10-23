// Every write to cycles, crops and the diary goes through here, from the Sage
// tools, the HTTP routes and the admin page alike. Refusals throw an Error
// with a message in PT-PT that is shown to the person or returned to the model.

import * as schema from './schema.js';
import { eq, desc, and, isNull } from 'drizzle-orm';

export const ROLES = ['principal', 'companheira', 'cobertura', 'atrativa', 'outra'];
export const METHODS = ['semeado', 'plantado'];
export const OUTCOMES = ['colhida', 'falhada', 'retirada'];
export const DIARY_ACTIONS = ['observacao', 'intervencao', 'solo', 'sachar', 'nota'];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function fail(message) {
  throw new Error(message);
}

export function resolveBedId(db, bedId) {
  if (!bedId) return null;
  const beds = db.select().from(schema.beds).all();
  const hit = beds.find(b => b.id === bedId) || beds.find(b => b.id.toLowerCase() === String(bedId).toLowerCase());
  if (!hit) fail(`Canteiro "${bedId}" nao existe. Canteiros validos: ${beds.map(b => b.id).join(', ')}`);
  return hit.id;
}

function getCycle(db, cycleId) {
  const cycle = db.select().from(schema.cycles).where(eq(schema.cycles.id, Number(cycleId))).get();
  if (!cycle) fail(`Ciclo ${cycleId} nao encontrado`);
  return cycle;
}

function getCrop(db, cropId) {
  const crop = db.select().from(schema.crops).where(eq(schema.crops.id, Number(cropId))).get();
  if (!crop) fail(`Cultura ${cropId} nao encontrada`);
  return crop;
}

function getSpecies(db, speciesId) {
  const sp = db.select().from(schema.species).where(eq(schema.species.id, speciesId)).get();
  if (!sp) fail(`Especie "${speciesId}" nao esta no catalogo. Consulta ou regista a especie primeiro.`);
  return sp;
}

function checkVocab(value, list, label) {
  if (!list.includes(value)) fail(`${label} "${value}" invalido. Opcoes: ${list.join(', ')}`);
}

export function openCycle(db, { bedId, title, scheme = null }) {
  const id = resolveBedId(db, bedId);
  if (!id) fail('bed_id e obrigatorio');
  if (!title) fail('title e obrigatorio');
  const open = db.select().from(schema.cycles)
    .where(and(eq(schema.cycles.bedId, id), isNull(schema.cycles.closedOn))).get();
  if (open) fail(`${id} ja tem um ciclo aberto (id ${open.id}, "${open.title}"). Fecha-o primeiro ou regista a cultura nele.`);
  return db.insert(schema.cycles).values({ bedId: id, title, scheme }).returning().get();
}

export function addCrop(db, { cycleId, speciesId, count = 1, role = 'outra', method = 'plantado', inOn = null }) {
  const cycle = getCycle(db, cycleId);
  if (cycle.closedOn) fail(`O ciclo ${cycle.id} ("${cycle.title}") esta fechado. Abre um ciclo novo.`);
  getSpecies(db, speciesId);
  checkVocab(role, ROLES, 'papel');
  checkVocab(method, METHODS, 'metodo');
  const crop = db.insert(schema.crops).values({ cycleId: cycle.id, speciesId, count: Number(count) || 1, role, method, inOn }).returning().get();
  if (inOn && !cycle.startedOn) {
    db.update(schema.cycles).set({ startedOn: inOn }).where(eq(schema.cycles.id, cycle.id)).run();
  }
  return crop;
}

export function endCrop(db, { cropId, outOn = today(), outcome, outcomeNote = null }) {
  const crop = getCrop(db, cropId);
  if (crop.outOn) fail(`A cultura ${crop.id} (${crop.speciesId}) ja saiu em ${crop.outOn}`);
  checkVocab(outcome, OUTCOMES, 'desfecho');
  return db.update(schema.crops).set({ outOn, outcome, outcomeNote }).where(eq(schema.crops.id, crop.id)).returning().get();
}

export function closeCycle(db, { cycleId, closedOn = today() }) {
  const cycle = getCycle(db, cycleId);
  const stillIn = db.select().from(schema.crops).where(eq(schema.crops.cycleId, cycle.id)).all().filter(c => !c.outOn);
  if (stillIn.length) {
    fail(`O ciclo ainda tem culturas na terra: ${stillIn.map(c => `${c.speciesId} (id ${c.id})`).join(', ')}. Termina-as primeiro.`);
  }
  return db.update(schema.cycles).set({ closedOn }).where(eq(schema.cycles.id, cycle.id)).returning().get();
}

export function fixCrop(db, { cropId, ...fields }) {
  const crop = getCrop(db, cropId);
  const updates = {};
  for (const key of ['speciesId', 'count', 'role', 'method', 'inOn', 'outOn', 'outcome', 'outcomeNote']) {
    if (fields[key] !== undefined) updates[key] = fields[key];
  }
  if (updates.speciesId) getSpecies(db, updates.speciesId);
  if (updates.role !== undefined) checkVocab(updates.role, ROLES, 'papel');
  if (updates.method !== undefined) checkVocab(updates.method, METHODS, 'metodo');
  if (updates.outcome !== undefined && updates.outcome !== null) checkVocab(updates.outcome, OUTCOMES, 'desfecho');
  if (updates.count !== undefined) updates.count = Number(updates.count) || 1;
  if (!Object.keys(updates).length) fail('Nada para corrigir');
  return db.update(schema.crops).set(updates).where(eq(schema.crops.id, crop.id)).returning().get();
}

export function logDiary(db, { bedId, action, text, cropId = null }) {
  const id = resolveBedId(db, bedId);
  checkVocab(action, DIARY_ACTIONS, 'acao');
  if (cropId !== null && cropId !== undefined) {
    const crop = getCrop(db, cropId);
    const cycle = getCycle(db, crop.cycleId);
    if (cycle.bedId !== id) fail(`A cultura ${crop.id} nao pertence a ${id} (esta em ${cycle.bedId})`);
  }
  return db.insert(schema.actionLog).values({ bedId: id, action, details: text, cropId: cropId ?? null }).returning().get();
}

export function setNextPlan(db, { bedId, text }) {
  const id = resolveBedId(db, bedId);
  if (!id) fail('bed_id e obrigatorio');
  return db.update(schema.beds).set({ nextRotation: text, updatedAt: new Date().toISOString() })
    .where(eq(schema.beds.id, id)).returning().get();
}

function speciesInfo(sp) {
  return { id: sp.id, name: sp.name, family: sp.family, sprite: sp.sprite, color: sp.color, growthDays: sp.growthDays };
}

export function bedTimeline(db, bedId) {
  const speciesById = Object.fromEntries(db.select().from(schema.species).all().map(s => [s.id, speciesInfo(s)]));
  const cycles = db.select().from(schema.cycles).where(eq(schema.cycles.bedId, bedId)).all().map(cycle => ({
    ...cycle,
    crops: db.select().from(schema.crops).where(eq(schema.crops.cycleId, cycle.id)).all()
      .map(c => ({ ...c, species: speciesById[c.speciesId] || { id: c.speciesId, name: c.speciesId, family: null, sprite: 'herb', color: '#5a8d3a', growthDays: null } })),
  }));
  const diary = db.select().from(schema.actionLog).where(eq(schema.actionLog.bedId, bedId))
    .orderBy(desc(schema.actionLog.createdAt), desc(schema.actionLog.id)).limit(10).all();
  return {
    open: cycles.find(c => !c.closedOn) || null,
    closed: cycles.filter(c => c.closedOn).sort((a, b) => b.closedOn.localeCompare(a.closedOn)),
    diary,
  };
}

export function bedPayload(db, bed) {
  const t = bedTimeline(db, bed.id);
  return {
    id: bed.id,
    notionCode: bed.notionCode,
    widthM: bed.widthM,
    heightM: bed.heightM,
    notes: bed.notes,
    nextRotation: bed.nextRotation,
    cycles: [...(t.open ? [t.open] : []), ...t.closed],
    diary: t.diary,
  };
}
