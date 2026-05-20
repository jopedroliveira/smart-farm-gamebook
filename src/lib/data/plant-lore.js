// Plant lore: descriptions, companions, what to avoid, sowing windows.

import { PLANT_SPECIES } from './plant-species.js';
import { NOTION_BEDS } from './beds.js';

export const PLANT_LORE = {
  tomate_coracao: {
    desc: 'Tomate de polpa firme, frutos de 300-500g em forma de coração. Indeterminado, exige tutoragem alta e desponte. Cultura-rainha das camas-quentes.',
    sun: '☀ Pleno sol', water: '3×/semana', spacing: '50×60 cm', germDays: 7,
    sowFrom: 'Fev', sowTo: 'Abr', plantFrom: 'Abr', plantTo: 'Jun',
    companions: ['manjericao', 'salsa', 'calendula', 'cebolo'],
    avoid: ['cucurbitaceae', 'feijao_verde'],
    notes: 'Compo Bio Tomate quinzenal. Vigilância míldio em Agosto. Tirar ladrões semanalmente.',
  },
  tomate_cherry: {
    desc: 'Tomate de fruto pequeno, precoce e produtivo. Tolera bem oídio e calor seco. Excelente em consociação com manjericão.',
    sun: '☀ Pleno sol', water: '3×/semana', spacing: '40×50 cm', germDays: 6,
    sowFrom: 'Fev', sowTo: 'Mai', plantFrom: 'Abr', plantTo: 'Jun',
    companions: ['manjericao', 'calendula', 'alface'],
    avoid: ['pepino', 'feijao_verde'],
    notes: 'Poda semanal. Frutos sucessivos até primeiras geadas.',
  },
  tomate_cacho: {
    desc: 'Tomate de pele escura, sabor intenso. Variedade resistente ao oídio. Frutos em cacho de 6-10 unidades.',
    sun: '☀ Pleno sol', water: '3×/semana', spacing: '50×60 cm', germDays: 7,
    sowFrom: 'Fev', sowTo: 'Abr', plantFrom: 'Abr', plantTo: 'Jun',
    companions: ['manjericao', 'cebolo', 'calendula'],
    avoid: ['courgette', 'pepino'],
    notes: 'Variedade precoce. Colher quando o cacho mostra mais de metade maduros.',
  },
  pimento: {
    desc: 'Solanácea de fruto, exige calor. Plantas compactas e produtivas. Pode ser colhido em verde ou aguardar maturação ao vermelho.',
    sun: '☀ Pleno sol', water: '2-3×/semana', spacing: '40×40 cm', germDays: 10,
    sowFrom: 'Fev', sowTo: 'Abr', plantFrom: 'Mai', plantTo: 'Jun',
    companions: ['manjericao', 'cenoura', 'salsa'],
    avoid: ['feijao_verde'],
    notes: 'Coloca em bordadura nas camas-quentes. Tutoragem leve quando os frutos pesam.',
  },
  beringela: {
    desc: 'Solanácea exigente em calor e sol. Frutos roxos brilhantes, colhidos jovens para evitar amargor. Cultura longa (120 dias).',
    sun: '☀ Pleno sol', water: '3×/semana', spacing: '60×60 cm', germDays: 10,
    sowFrom: 'Fev', sowTo: 'Mar', plantFrom: 'Mai', plantTo: 'Jun',
    companions: ['manjericao', 'tagetes', 'salsa'],
    avoid: ['feijao_verde'],
    notes: 'Manter fora do canopy de courgettes. Colher antes da pele perder o brilho.',
  },
  courgette: {
    desc: 'Cucurbitácea vigorosa, expande até 1.5m de diâmetro. Frutos quase diários no pico do verão. Polinização cruzada essencial.',
    sun: '☀ Pleno sol', water: '4×/semana', spacing: '90×90 cm', germDays: 5,
    sowFrom: 'Abr', sowTo: 'Jun', plantFrom: 'Mai', plantTo: 'Jun',
    companions: ['calendula', 'manjericao', 'endro'],
    avoid: ['tomate_coracao', 'tomate_cacho', 'tomate_cherry', 'pepino'],
    notes: 'Vigilância oídio. Regar à base, nunca às folhas.',
  },
  pepino: {
    desc: 'Trepador, beneficia de rede ou treliça. Fruto produz continuamente quando colhido regularmente. Sensível ao oídio.',
    sun: '☀ Pleno sol', water: '4×/semana', spacing: '40×60 cm', germDays: 6,
    sowFrom: 'Abr', sowTo: 'Jun', plantFrom: 'Mai', plantTo: 'Jun',
    companions: ['calendula', 'endro', 'feijao_verde'],
    avoid: ['tomate_coracao', 'tomate_cherry', 'tomate_cacho'],
    notes: 'Rede no lado norte para não sombrear o resto da cama.',
  },
  manjericao: {
    desc: 'Aromática anual, companheira universal. Repele mosca-branca e pulgões. Floração tardia melhora o sabor do tomate ao lado.',
    sun: '☀ Pleno sol', water: '3×/semana', spacing: '25×30 cm', germDays: 7,
    sowFrom: 'Mar', sowTo: 'Mai', plantFrom: 'Abr', plantTo: 'Jun',
    companions: ['tomate_coracao', 'tomate_cherry', 'pimento', 'beringela'],
    avoid: [],
    notes: 'Cortar pontas para ramificar. Despontar antes de florescer.',
  },
  segurelha: {
    desc: '"Bohnenkraut" — companheira clássica do feijão. Repele pulgões e melhora sabor. Aromática perene em climas amenos.',
    sun: '☀ Pleno sol', water: '2×/semana', spacing: '20×25 cm', germDays: 10,
    sowFrom: 'Mar', sowTo: 'Mai', plantFrom: 'Abr', plantTo: 'Jun',
    companions: ['feijao_verde'],
    avoid: [],
    notes: 'Ideal entre fileiras de feijão. Colher folhas jovens.',
  },
  salsa: {
    desc: 'Apiácea bienal, coexiste com várias culturas. Folhas crespas ou lisas, atrai sirfídeos quando floresce no 2º ano.',
    sun: '☀ Sol/meia-sombra', water: '2×/semana', spacing: '20×20 cm', germDays: 14,
    sowFrom: 'Fev', sowTo: 'Jul', plantFrom: 'Abr', plantTo: 'Set',
    companions: ['tomate_coracao', 'pimento', 'cenoura'],
    avoid: ['alface'],
    notes: 'Demora a germinar (até 3 semanas). Pré-embeber sementes.',
  },
  endro: {
    desc: 'Apiácea aromática. Atrai sirfídeos e vespas predadoras. Folhagem fina, sementes usadas em conserva.',
    sun: '☀ Pleno sol', water: '2×/semana', spacing: '25×30 cm', germDays: 10,
    sowFrom: 'Mar', sowTo: 'Jul', plantFrom: 'Abr', plantTo: 'Set',
    companions: ['courgette', 'pepino', 'alface'],
    avoid: ['cenoura'],
    notes: 'Sucessões a cada 3 semanas para colheita contínua.',
  },
  cenoura: {
    desc: 'Raiz longa, exige solo solto e profundo. Coexiste bem com alface e cebolo. Demora 75 dias.',
    sun: '☀ Pleno sol', water: '2×/semana', spacing: '5×20 cm', germDays: 14,
    sowFrom: 'Fev', sowTo: 'Jul', plantFrom: 'Mar', plantTo: 'Ago',
    companions: ['alface', 'cebolo', 'alho_frances'],
    avoid: ['endro'],
    notes: 'Mondar para 5cm entre plantas. Solo sem pedras nem composto fresco.',
  },
  calendula: {
    desc: 'Flor anual de bordadura. Atrai sirfídeos predadores de pulgões. Pétalas comestíveis e medicinais.',
    sun: '☀ Pleno sol', water: '2×/semana', spacing: '30×30 cm', germDays: 8,
    sowFrom: 'Mar', sowTo: 'Mai', plantFrom: 'Abr', plantTo: 'Jun',
    companions: ['tomate_coracao', 'courgette', 'pepino', 'alface'],
    avoid: [],
    notes: 'Plantar em bordadura. Flores em colheita contínua = mais flores.',
  },
  tagetes: {
    desc: 'Flor amarela compacta. Repele nematóides do solo. Atrai polinizadores. Combina com solanáceas e feijão.',
    sun: '☀ Pleno sol', water: '2×/semana', spacing: '25×30 cm', germDays: 7,
    sowFrom: 'Mar', sowTo: 'Mai', plantFrom: 'Abr', plantTo: 'Jun',
    companions: ['feijao_verde', 'beringela', 'tomate_coracao'],
    avoid: [],
    notes: 'Raízes secretam terpenos anti-nematóides. Manter no solo após a floração.',
  },
  camomila: {
    desc: 'Flor branca anual. Atrai sirfídeos e crisopas. Infusão floral medicinal e fungicida natural.',
    sun: '☀ Sol/meia-sombra', water: '2×/semana', spacing: '20×20 cm', germDays: 10,
    sowFrom: 'Mar', sowTo: 'Mai', plantFrom: 'Abr', plantTo: 'Jun',
    companions: ['courgette', 'pepino', 'alface'],
    avoid: [],
    notes: 'Pulverizar infusão para prevenir míldio e oídio.',
  },
  alface: {
    desc: 'Folha rápida, 45 dias. Excelente em consociação com quase tudo. Replantação escalonada para colheita contínua.',
    sun: '☀ Sol/meia-sombra', water: '3×/semana', spacing: '25×25 cm', germDays: 7,
    sowFrom: 'Fev', sowTo: 'Set', plantFrom: 'Mar', plantTo: 'Out',
    companions: ['cenoura', 'rabanete', 'tomate_cherry', 'calendula'],
    avoid: ['salsa'],
    notes: 'Calor faz subir a haste — preferir sombra parcial no verão.',
  },
  rucula: {
    desc: 'Brassicácea de folha rápida (30 dias). Picante quando madura, suave em colheita jovem. Floração rápida no calor.',
    sun: '☀ Sol/meia-sombra', water: '3×/semana', spacing: '15×15 cm', germDays: 5,
    sowFrom: 'Fev', sowTo: 'Out', plantFrom: 'Mar', plantTo: 'Out',
    companions: ['alface', 'cenoura'],
    avoid: [],
    notes: 'Sucessões de 2 em 2 semanas. Colher antes da floração.',
  },
  rabanete: {
    desc: 'Brassicácea de raiz, ultra-rápida (30 dias). Sinaliza linhas de cenoura/alface. Picante quando atrasado.',
    sun: '☀ Pleno sol', water: '3×/semana', spacing: '5×10 cm', germDays: 5,
    sowFrom: 'Fev', sowTo: 'Set', plantFrom: 'Fev', plantTo: 'Set',
    companions: ['alface', 'cenoura', 'feijao_verde'],
    avoid: [],
    notes: 'Colher assim que atinge tamanho — ganha textura lenhosa rapidamente.',
  },
  nabica: {
    desc: 'Brassicácea de folhas tenras. Colhida jovem para "grelos". Cultura rápida de inverno.',
    sun: '☀ Sol/meia-sombra', water: '3×/semana', spacing: '15×15 cm', germDays: 7,
    sowFrom: 'Set', sowTo: 'Fev', plantFrom: 'Out', plantTo: 'Mar',
    companions: ['alface'],
    avoid: [],
    notes: 'Sensível à Delia radicum como restantes brassicáceas.',
  },
  beterraba: {
    desc: 'Raiz roxa de cultura média. Folhas comestíveis tipo acelga. Combina bem com alface e cebolo.',
    sun: '☀ Pleno sol', water: '2×/semana', spacing: '10×25 cm', germDays: 10,
    sowFrom: 'Fev', sowTo: 'Jul', plantFrom: 'Mar', plantTo: 'Ago',
    companions: ['alface', 'cebolo'],
    avoid: ['feijao_verde'],
    notes: 'Folhas jovens em saladas, raiz em 70 dias.',
  },
  espinafre: {
    desc: 'Folha de inverno. Sobe a flor com calor — preferir épocas frescas. Rico em ferro.',
    sun: '☀ Meia-sombra', water: '3×/semana', spacing: '15×20 cm', germDays: 10,
    sowFrom: 'Set', sowTo: 'Mar', plantFrom: 'Out', plantTo: 'Abr',
    companions: ['alface', 'feijao_verde'],
    avoid: [],
    notes: 'Colher folhas exteriores para prolongar produção.',
  },
  acelga: {
    desc: 'Folha grande de talo branco/colorido. Colheita contínua de Abril a Outubro. Resistente.',
    sun: '☀ Sol/meia-sombra', water: '2×/semana', spacing: '30×30 cm', germDays: 10,
    sowFrom: 'Fev', sowTo: 'Jul', plantFrom: 'Mar', plantTo: 'Ago',
    companions: ['feijao_verde', 'alface'],
    avoid: [],
    notes: 'Colher folhas exteriores semanalmente.',
  },
  feijao_verde: {
    desc: 'Leguminosa anã, fixa azoto no solo. Vagens a partir de 75 dias. Restitui fertilidade ao canteiro.',
    sun: '☀ Pleno sol', water: '3×/semana', spacing: '15×40 cm', germDays: 7,
    sowFrom: 'Abr', sowTo: 'Jul', plantFrom: 'Abr', plantTo: 'Jul',
    companions: ['segurelha', 'tagetes', 'pepino', 'cenoura'],
    avoid: ['alho_frances', 'cebolo', 'beterraba'],
    notes: 'Inocular com Rhizobium se for primeiro ano. Não regar no início.',
  },
  alho_frances: {
    desc: 'Amaryllidácea de inverno. Talo branco aromático. 120 dias de cultura. Companheiro da cenoura.',
    sun: '☀ Pleno sol', water: '2×/semana', spacing: '15×30 cm', germDays: 12,
    sowFrom: 'Ago', sowTo: 'Out', plantFrom: 'Out', plantTo: 'Dez',
    companions: ['cenoura', 'alface'],
    avoid: ['feijao_verde'],
    notes: 'Amontoar terra para branquear o talo. Colher de Março em diante.',
  },
  cebolo: {
    desc: 'Cebola jovem para colheita verde. Bordadura clássica de tomate. Repele pulgões.',
    sun: '☀ Pleno sol', water: '2×/semana', spacing: '5×20 cm', germDays: 10,
    sowFrom: 'Set', sowTo: 'Mar', plantFrom: 'Out', plantTo: 'Abr',
    companions: ['tomate_coracao', 'tomate_cacho', 'cenoura', 'beterraba'],
    avoid: ['feijao_verde'],
    notes: 'Colher folhas verdes 70 dias após sementeira.',
  },
};

// Reverse index: which beds contain each species
export function bedsForSpecies(speciesId) {
  const out = [];
  Object.entries(NOTION_BEDS).forEach(([bedId, b]) => {
    const found = b.plantings.find((p) => p.species === speciesId);
    if (found) out.push({ bedId, code: b.notionCode, count: found.count, fn: found.fn });
  });
  return out;
}

// Format Portuguese date like "26 Abr 2026"
const PT_MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
export function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  return `${d.getDate()} ${PT_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
