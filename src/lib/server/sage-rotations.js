import * as schema from './schema.js';
import { eq } from 'drizzle-orm';

// Picks the rotation a Sage tool acts on.
//
// With rotation_id: that rotation on the bed, finished ones included, so a
// mistake can be undone. Without it: the bed's single active rotation. With
// two active ones (a summer plan still "Plantado" next to the autumn plan)
// the model must say which; guessing is how the autumn plan got closed
// instead of the summer one.
export function findRotation(db, input) {
  const rows = db.select().from(schema.rotations)
    .where(eq(schema.rotations.bedId, input.bed_id))
    .all();

  if (input.rotation_id !== undefined && input.rotation_id !== null) {
    const rot = rows.find(r => r.id === Number(input.rotation_id));
    if (!rot) return { error: { ok: false, message: `Rotacao ${input.rotation_id} nao encontrada em ${input.bed_id}` } };
    return { rot };
  }

  const active = rows.filter(r => r.estado !== 'Terminado' && r.estado !== 'Em repouso');
  if (active.length === 0) {
    return { error: { ok: false, message: `Nenhuma rotacao ativa encontrada para ${input.bed_id}` } };
  }
  if (active.length > 1) {
    const list = active.map(r => `${r.id} = "${r.title}" (${r.estado})`).join('; ');
    return { error: { ok: false, message: `${input.bed_id} tem ${active.length} rotacoes ativas, indica rotation_id: ${list}` } };
  }
  return { rot: active[0] };
}
