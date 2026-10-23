// One-time migration from rotations/plantings to cycles/crops.
// Design: docs/superpowers/specs/2026-10-22-bed-timeline-design.md
// Works on a raw better-sqlite3 handle so the dry-run script and db.js share it.

import { PLANT_SPECIES } from '../data/plant-species.js';

const CLOSED = new Set(['Terminado', 'Em repouso']);
const PLANTED = new Set(['Plantado', 'A colher']);

export function roleFromFn(fn) {
  const t = (fn || '').trim().toLowerCase();
  if (t.startsWith('cultura principal') || t === 'principal') return 'principal';
  if (t.includes('companheira')) return 'companheira';
  if (t.startsWith('atrai')) return 'atrativa';
  if (t.startsWith('cobertura')) return 'cobertura';
  return 'outra';
}

function hasTable(sqlite, name) {
  return !!sqlite.prepare("select 1 from sqlite_master where type='table' and name=?").get(name);
}

function stripBed(title, bedId) {
  return (title || '').replace(new RegExp(`^${bedId}\\s*`), '').trim();
}

function dateOf(iso) {
  return iso ? String(iso).slice(0, 10) : null;
}

function methodFor(species) {
  return species && species.sow_from && !species.plant_from ? 'semeado' : 'plantado';
}

// Same species twice in one cycle: a count-1 row next to a real count is a
// placeholder the old tools left behind, so it is dropped instead of summed.
function mergeCrops(rows) {
  const byKey = new Map();
  for (const r of rows) {
    const key = `${r.species_id}|${r.in_on || ''}`;
    const list = byKey.get(key) || [];
    list.push(r);
    byKey.set(key, list);
  }
  const out = [];
  for (const list of byKey.values()) {
    const real = list.filter(r => r.count > 1);
    const base = real.length ? real : [list[0]];
    const count = base.reduce((s, r) => s + r.count, 0);
    const principal = list.find(r => r.role === 'principal');
    out.push({ ...(principal || list[0]), count });
  }
  return out;
}

export function backfillSpecies(sqlite) {
  const fixes = { families: [] };
  const rows = sqlite.prepare('select * from species').all();
  const upd = sqlite.prepare('update species set growth_days=?, germ_days=?, sow_from=?, sow_to=?, family=? where id=?');
  for (const s of rows) {
    const js = PLANT_SPECIES[s.id];
    const growth = s.growth_days ?? s.cycle_days ?? js?.growthDays ?? null;
    const germ = s.germ_days ?? s.germination_days ?? null;
    let sowFrom = s.sow_from, sowTo = s.sow_to;
    if (!sowFrom && !sowTo && s.sowing_window) {
      const m = /^([A-Za-z]{3})-([A-Za-z]{3})/.exec(s.sowing_window);
      if (m) { sowFrom = m[1]; sowTo = m[2]; }
    }
    let family = s.family;
    if (js?.family && family !== js.family) {
      fixes.families.push({ id: s.id, from: family, to: js.family });
      family = js.family;
    }
    upd.run(growth, germ, sowFrom, sowTo, family, s.id);
  }
  return fixes;
}

export function migrateRotationsToCycles(sqlite, { overrides = [] } = {}) {
  if (!hasTable(sqlite, 'rotations') || hasTable(sqlite, 'rotations_old')) return null;
  if (sqlite.prepare('select count(*) c from cycles').get().c > 0) return null;

  const run = sqlite.transaction(() => {
    const summary = { beds: [], speciesMissing: [], familyFixes: backfillSpecies(sqlite).families };
    const speciesById = Object.fromEntries(sqlite.prepare('select * from species').all().map(s => [s.id, s]));
    const insCycle = sqlite.prepare('insert into cycles (bed_id, title, scheme, started_on, closed_on, notes) values (?, ?, ?, ?, ?, ?)');
    const insCrop = sqlite.prepare('insert into crops (cycle_id, species_id, count, role, method, in_on, out_on, outcome, outcome_note) values (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    const plantingsOf = sqlite.prepare('select * from plantings where rotation_id=?');

    for (const bed of sqlite.prepare('select * from beds order by id').all()) {
      const rotations = sqlite.prepare('select * from rotations where bed_id=? order by planted_date, id').all(bed.id);
      const entry = { bedId: bed.id, open: null, closedCount: 0, emptyOpen: [], assumedDates: [] };

      for (const rot of rotations.filter(r => CLOSED.has(r.estado))) {
        const closedOn = dateOf(rot.harvest_end) || dateOf(rot.harvest_start) || dateOf(rot.updated_at);
        const scheme = [rot.rotation, (rot.notes || '').split('\n')[0]].filter(Boolean).join(' · ') || null;
        const { lastInsertRowid: cycleId } = insCycle.run(bed.id, stripBed(rot.title, bed.id), scheme, dateOf(rot.planted_date), closedOn, rot.pest_notes || null);
        const rows = plantingsOf.all(rot.id).map(p => ({
          species_id: p.species_id, count: p.count, role: roleFromFn(p.fn), in_on: dateOf(rot.planted_date),
        }));
        for (const c of mergeCrops(rows)) {
          insCrop.run(cycleId, c.species_id, c.count, c.role, methodFor(speciesById[c.species_id]), c.in_on, closedOn,
            rot.failed ? 'falhada' : 'colhida', rot.failed ? (rot.pest_notes || null) : null);
        }
        entry.closedCount++;
      }

      const open = rotations.filter(r => !CLOSED.has(r.estado));
      if (open.length) {
        const title = open.map(r => stripBed(r.title, bed.id)).filter(Boolean).join(' + ');
        const scheme = open.map(r => [r.rotation, (r.notes || '').split('\n')[0]].filter(Boolean).join(' · ')).filter(Boolean).join(' + ') || null;
        const starts = open.map(r => dateOf(r.planted_date)).filter(Boolean).sort();
        const pests = open.map(r => r.pest_notes).filter(Boolean).join(' + ') || null;
        const { lastInsertRowid: cycleId } = insCycle.run(bed.id, title, scheme, starts[0] || null, null, pests);
        const rows = [];
        for (const rot of open) {
          const plantings = plantingsOf.all(rot.id);
          let inOn = dateOf(rot.planted_date);
          if (!inOn && PLANTED.has(rot.estado) && plantings.length) {
            inOn = dateOf(rot.updated_at);
            entry.assumedDates.push(`${stripBed(rot.title, bed.id)}: ${inOn}`);
          }
          if (!plantings.length && PLANTED.has(rot.estado)) {
            const ov = overrides.filter(o => o.bedId === bed.id && (rot.title || '').includes(o.title));
            if (ov.length) {
              for (const o of ov) rows.push({ species_id: o.speciesId, count: o.count || 1, role: o.role || 'principal', in_on: o.inOn || inOn });
            } else {
              entry.emptyOpen.push(rot.title);
            }
          }
          for (const p of plantings) rows.push({ species_id: p.species_id, count: p.count, role: roleFromFn(p.fn), in_on: inOn });
        }
        const crops = mergeCrops(rows);
        for (const c of crops) {
          insCrop.run(cycleId, c.species_id, c.count, c.role, methodFor(speciesById[c.species_id]), c.in_on, null, null, null);
        }
        if (!starts.length) {
          const sown = crops.map(c => c.in_on).filter(Boolean).sort();
          if (sown.length) sqlite.prepare('update cycles set started_on=? where id=?').run(sown[0], cycleId);
        }
        entry.open = { title, crops: crops.map(c => ({ speciesId: c.species_id, count: c.count, role: c.role, inOn: c.in_on })) };
      }

      if (!(bed.next_rotation || '').trim()) {
        sqlite.prepare('update beds set next_rotation=null where id=?').run(bed.id);
      }
      summary.beds.push(entry);
    }

    summary.speciesMissing = sqlite.prepare('select id, family, growth_days from species where family is null or growth_days is null').all()
      .map(s => ({ id: s.id, family: s.family, growthDays: s.growth_days }));

    sqlite.exec('ALTER TABLE rotations RENAME TO rotations_old; ALTER TABLE plantings RENAME TO plantings_old;');
    return summary;
  });

  return run();
}

export function summaryText(summary) {
  const lines = [];
  for (const b of summary.beds) {
    const open = b.open
      ? `aberto "${b.open.title}" (${b.open.crops.map(c => `${c.speciesId} x${c.count} ${c.role}${c.inOn ? '' : ' por semear'}`).join(', ') || 'sem culturas'})`
      : 'sem ciclo aberto';
    lines.push(`${b.bedId}: ${open}, ${b.closedCount} fechados`);
    if (b.assumedDates.length) lines.push(`  datas assumidas: ${b.assumedDates.join('; ')}`);
    if (b.emptyOpen.length) lines.push(`  sem culturas: confirmar: ${b.emptyOpen.join('; ')}`);
  }
  if (summary.familyFixes.length) {
    lines.push(`familias corrigidas: ${summary.familyFixes.map(f => `${f.id} ${f.from} -> ${f.to}`).join(', ')}`);
  }
  if (summary.speciesMissing.length) {
    lines.push(`especies sem familia ou dias: ${summary.speciesMissing.map(s => s.id).join(', ')}`);
  }
  return lines.join('\n');
}
