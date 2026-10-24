// Short, derived facts for the bed notebook: season labels, families,
// failures and warnings. Pure functions over the bed payload.

const FAMILY_WORD = /\b([A-ZÁ][a-záéíóú]+[áa]ceas?)\b/;
const WARN_YEARS = 2;

export function seasonOf(title) {
  return String(title || '').split(' · ')[0].trim();
}

export function descriptionOf(title) {
  const rest = String(title || '').split(' · ').slice(1).join(' · ');
  return rest.replace(/\s*\(falhad[oa]\)/i, '').trim();
}

export function familiesOf(crops) {
  return [...new Set((crops || []).map(c => c.species?.family).filter(Boolean))];
}

export function cycleFamilies(cycle) {
  const fromCrops = familiesOf(cycle.crops);
  if (fromCrops.length) return fromCrops;
  const m = String(cycle.title || '').match(FAMILY_WORD);
  return m ? [m[1]] : [];
}

export function cycleFailed(cycle) {
  return (cycle.crops || []).some(c => c.outcome === 'falhada') || /falhad/i.test(cycle.title || '');
}

export function bedWarnings(bed, now = new Date()) {
  const out = [];
  const limit = new Date(now);
  limit.setFullYear(limit.getFullYear() - WARN_YEARS);
  const since = limit.toISOString().slice(0, 10);
  for (const cycle of bed.cycles || []) {
    if (!cycle.closedOn || cycle.closedOn < since || !cycleFailed(cycle)) continue;
    const failedCrops = (cycle.crops || []).filter(c => c.outcome === 'falhada');
    const families = failedCrops.length ? familiesOf(failedCrops) : cycleFamilies(cycle);
    const what = families.length ? families.join(', ') : descriptionOf(cycle.title) || 'o ciclo';
    out.push(`${what} falhou na ${seasonOf(cycle.title)}`);
  }
  if (bed.semAgua) out.push('valvula sem agua');
  if (bed.fugaAgua) out.push('fuga de agua na valvula');
  if (bed.bateriaValvula !== null && bed.bateriaValvula !== undefined && bed.bateriaValvula < 20) {
    out.push(`bateria da valvula a ${bed.bateriaValvula}%`);
  }
  return out;
}

export function firstSentence(text, max = 120) {
  const s = String(text || '').trim();
  if (!s) return '';
  const end = s.search(/[.!?](\s|$)/);
  const cut = end >= 0 && end < max ? s.slice(0, end + 1) : s;
  return cut.length > max ? cut.slice(0, max) + '…' : cut;
}
