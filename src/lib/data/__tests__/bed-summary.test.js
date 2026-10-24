import { describe, it, expect } from 'vitest';
import { seasonOf, descriptionOf, familiesOf, cycleFamilies, cycleFailed, bedWarnings, firstSentence, nextSeasonLabel, avoidFamilies } from '../bed-summary.js';

const sp = (family) => ({ family });
const closed = (title, crops = [], extra = {}) => ({ title, closedOn: '2026-10-22', crops, ...extra });

describe('seasonOf', () => {
  it('takes the part before the separator', () => {
    expect(seasonOf('Primavera-Verão 2026 · Courgettes & solanáceas')).toBe('Primavera-Verão 2026');
    expect(seasonOf('Inverno 2026')).toBe('Inverno 2026');
    expect(seasonOf('Primavera 2026 · Brassicáceas (Falhado)')).toBe('Primavera 2026');
  });

  it('describes the rest of the title without the failed marker', () => {
    expect(descriptionOf('Primavera 2026 · Kale (Falhado)')).toBe('Kale');
    expect(descriptionOf('Verão 2026 · Sucessão solanáceas')).toBe('Sucessão solanáceas');
    expect(descriptionOf('Inverno 2026')).toBe('');
  });
});

describe('families', () => {
  it('lists unique families of crops, in order of first appearance', () => {
    const crops = [{ species: sp('Apiaceae') }, { species: sp('Asteraceae') }, { species: sp('Apiaceae') }, { species: {} }];
    expect(familiesOf(crops)).toEqual(['Apiaceae', 'Asteraceae']);
  });

  it('falls back to a family named in the title when a cycle has no crops', () => {
    expect(cycleFamilies(closed('Primavera 2026 · Brassicáceas (Falhado)'))).toEqual(['Brassicáceas']);
    expect(cycleFamilies(closed('Verão 2026 · Batata doce'))).toEqual([]);
  });
});

describe('cycleFailed', () => {
  it('is true for a failed crop or a title marked as failed', () => {
    expect(cycleFailed(closed('Primavera 2026 · Kale (Falhado)'))).toBe(true);
    expect(cycleFailed(closed('Verão 2026', [{ outcome: 'falhada', species: sp('Brassicaceae') }]))).toBe(true);
    expect(cycleFailed(closed('Verão 2026', [{ outcome: 'colhida', species: sp('Brassicaceae') }]))).toBe(false);
  });
});

describe('bedWarnings', () => {
  it('warns about families that failed in the last two years and about the valve', () => {
    const bed = {
      cycles: [
        closed('Primavera 2026 · Brassicáceas (Falhado)', [], { closedOn: '2026-04-15' }),
        closed('Primavera 2026 · Kale (Falhado)', [], { closedOn: '2026-04-20' }),
        closed('Primavera 2024 · Kale (Falhado)', [], { closedOn: '2024-04-15' }),
        closed('Verão 2026 · Feijão', [{ outcome: 'colhida', species: sp('Fabaceae') }]),
      ],
      semAgua: true, fugaAgua: false, bateriaValvula: 12,
    };
    expect(bedWarnings(bed, new Date('2026-10-24'))).toEqual([
      'Brassicáceas falhou na Primavera 2026',
      'Kale falhou na Primavera 2026',
      'valvula sem agua',
      'bateria da valvula a 12%',
    ]);
    expect(bedWarnings({ cycles: [] }, new Date('2026-10-24'))).toEqual([]);
  });
});

describe('firstSentence', () => {
  it('cuts at the first sentence end or at 120 characters', () => {
    expect(firstSentence('Alho + Cebola. Famílias: Amaryllidaceae.')).toBe('Alho + Cebola.');
    expect(firstSentence('x'.repeat(200))).toBe('x'.repeat(120) + '…');
    expect(firstSentence(null)).toBe('');
  });
});

describe('next season', () => {
  it('names the season after the current one', () => {
    expect(nextSeasonLabel(new Date('2026-10-24'))).toBe('Primavera 2027');
    expect(nextSeasonLabel(new Date('2027-01-15'))).toBe('Primavera 2027');
    expect(nextSeasonLabel(new Date('2027-04-10'))).toBe('Verão 2027');
    expect(nextSeasonLabel(new Date('2027-07-10'))).toBe('Outono-Inverno 2027');
  });

  it('lists the families to avoid next: in the bed now, or failed in the last two years', () => {
    const bed = {
      cycles: [
        { id: 1, title: 'Outono-Inverno 2026', closedOn: null, crops: [{ inOn: '2026-10-21', species: sp('Apiaceae') }, { inOn: null, species: sp('Fabaceae') }] },
        closed('Primavera 2026 · Kale (Falhado)', [{ outcome: 'falhada', species: sp('Brassicaceae') }], { closedOn: '2026-04-15' }),
        closed('Verão 2025 · Tomate', [{ outcome: 'colhida', species: sp('Solanaceae') }], { closedOn: '2025-10-01' }),
      ],
    };
    expect(avoidFamilies(bed, new Date('2026-10-24'))).toEqual(['Apiaceae', 'Fabaceae', 'Brassicaceae']);
  });
});
