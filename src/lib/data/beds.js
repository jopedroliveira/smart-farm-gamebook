// Date helpers and the physical bed registry used by the first seed.

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

// ---- Bed seed data ----

export const NOTION_BEDS = {
  'RB-11': {
    notionCode: 'RB-11',
    widthM: 3.2, heightM: 1.5,
    notes: '20 tomates em 5.25m² após monda. Substrato com aparas → imobiliza azoto. Compo Bio Tomate quinzenal + borras de café contínuas + top-dressing composto em Julho.',
    nextRotation: 'Próx.: Feijão Verde + Courgette + Manjericão + Calêndula (Prim/Verão 2026)',
  },
  'RB-12': {
    notionCode: 'RB-12',
    widthM: 1.6, heightM: 1.5,
    notes: 'Cama intensiva. Cebolo em bordadura, restantes em 6 porções.',
    nextRotation: 'Sucessão 2026: à medida que alho-francês e cenouras são colhidos, espaço para pimentos / beringelas.',
  },
  'RB-13': {
    notionCode: 'RB-13',
    widthM: 3.2, heightM: 1.5,
    notes: 'FALHADO Mar 2026: couve lombarda e brócolos destruídos por larvas nas raízes. Replantado com alface + salsa + feijão.',
    nextRotation: 'A definir — Brassicáceas BLOQUEADAS em 2026 por Delia radicum.',
  },
  'RB-21': {
    notionCode: 'RB-21',
    widthM: 3.2, heightM: 1.5,
    notes: 'Cama mista 5.25m². 2 courgettes ao centro + solanáceas em volta. 8 famílias botânicas.',
    nextRotation: '⚠️ 2027: evitar Cucurbitaceae E Solanaceae.',
  },
  'RB-22': {
    notionCode: 'RB-22',
    widthM: 1.6, heightM: 1.5,
    notes: '"Da Horta à Mesa". Feijão + Segurelha + Tagetes. Solanáceas em coexistência a partir de Maio.',
    nextRotation: 'Sucessão: 2-3 pimentos transplantados em Maio. Beringelas em Junho.',
  },
  'RB-23': {
    notionCode: 'RB-23',
    widthM: 3.2, heightM: 1.5,
    notes: 'Ocupação intensiva 4.8m². Fase 1 (Mar-Mai): folhas/raízes rápidas. Fase 2 (Abr-Set): pepino + acelga + feijão.',
    nextRotation: '7 famílias = rotação excelente. Solanáceas elegíveis em 2027.',
  },
};
