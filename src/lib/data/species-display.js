// Visual display config per species — sprite, color, emoji.
// This data does NOT come from Notion; it lives here in code.
// Keyed by ID interno (same as species.id in the DB).

export const SPECIES_DISPLAY = {
  // Solanaceae
  tomate_coracao:  { sprite: 'tomato',  color: '#c73030', emoji: '🍅' },
  tomate_cherry:   { sprite: 'tomato',  color: '#d04040', emoji: '🍅' },
  tomate_cacho:    { sprite: 'tomato',  color: '#5a1a1a', emoji: '🍅' },
  tomate_roxo:     { sprite: 'tomato',  color: '#6a2060', emoji: '🍅' },
  pimento:         { sprite: 'pepper',  color: '#c73030', emoji: '🌶' },
  malagueta:       { sprite: 'pepper',  color: '#d04040', emoji: '🌶' },
  beringela:       { sprite: 'pepper',  color: '#5a1a8a', emoji: '🍆' },

  // Cucurbitaceae
  courgette:       { sprite: 'squash',  color: '#3d8b3d', emoji: '🥒' },
  pepino:          { sprite: 'squash',  color: '#2d6b2d', emoji: '🥒' },

  // Lamiaceae
  manjericao:      { sprite: 'herb',    color: '#4fa83a', emoji: '🌿' },
  segurelha:       { sprite: 'herb',    color: '#5a8d3a', emoji: '🌿' },

  // Apiaceae
  salsa:           { sprite: 'herb',    color: '#3d8b3d', emoji: '🌿' },
  endro:           { sprite: 'herb',    color: '#5a8d3a', emoji: '🌿' },
  cenoura:         { sprite: 'carrot',  color: '#e89640', emoji: '🥕' },
  coentros:        { sprite: 'herb',    color: '#3d8b3d', emoji: '🌿' },

  // Asteraceae
  calendula:       { sprite: 'flower',  color: '#e89640', emoji: '🌼' },
  tagetes:         { sprite: 'flower',  color: '#f4d03f', emoji: '🌻' },
  camomila:        { sprite: 'flower',  color: '#ffffff', emoji: '🌼' },
  alface:          { sprite: 'lettuce', color: '#4fa83a', emoji: '🥬' },

  // Brassicaceae
  rucula:          { sprite: 'lettuce', color: '#5a8d3a', emoji: '🥬' },
  rabanete:        { sprite: 'carrot',  color: '#c73030', emoji: '🥕' },
  nabica:          { sprite: 'lettuce', color: '#7ec850', emoji: '🥬' },
  couve_kale:      { sprite: 'lettuce', color: '#5a8d3a', emoji: '🥬' },
  brocolos:        { sprite: 'herb',    color: '#2d6b2d', emoji: '🥦' },
  couve_lombarda:  { sprite: 'lettuce', color: '#5a3a8a', emoji: '🥬' },
  agriao:          { sprite: 'lettuce', color: '#3d8b3d', emoji: '🥬' },

  // Amaranthaceae
  beterraba:       { sprite: 'carrot',  color: '#a01a5a', emoji: '🥕' },
  espinafre:       { sprite: 'lettuce', color: '#2d6b2d', emoji: '🥬' },
  acelga:          { sprite: 'lettuce', color: '#3d8b3d', emoji: '🥬' },

  // Fabaceae
  feijao_verde:    { sprite: 'bean',    color: '#5a8d3a', emoji: '🫘' },
  ervilha:         { sprite: 'bean',    color: '#5a8d3a', emoji: '🫛' },

  // Amaryllidaceae
  alho_frances:    { sprite: 'leek',    color: '#7ec850', emoji: '🧅' },
  cebolo:          { sprite: 'leek',    color: '#a4d96b', emoji: '🧅' },
  cebolinho:       { sprite: 'leek',    color: '#7ec850', emoji: '🧅' },

  // Convolvulaceae
  batata_doce:     { sprite: 'carrot',  color: '#e89640', emoji: '🍠' },
};

// Fallback by botanical family — used when a species isn't in the map above
export const FAMILY_DEFAULTS = {
  'Solanaceae':      { sprite: 'tomato',  color: '#c73030', emoji: '🌱' },
  'Cucurbitaceae':   { sprite: 'squash',  color: '#3d8b3d', emoji: '🌱' },
  'Lamiaceae':       { sprite: 'herb',    color: '#4fa83a', emoji: '🌱' },
  'Apiaceae':        { sprite: 'herb',    color: '#7a9a4a', emoji: '🌱' },
  'Asteraceae':      { sprite: 'flower',  color: '#e89640', emoji: '🌱' },
  'Brassicaceae':    { sprite: 'lettuce', color: '#5a8d3a', emoji: '🌱' },
  'Amaranthaceae':   { sprite: 'lettuce', color: '#a01a5a', emoji: '🌱' },
  'Fabaceae':        { sprite: 'bean',    color: '#5a8d3a', emoji: '🌱' },
  'Amaryllidaceae':  { sprite: 'leek',    color: '#a4d96b', emoji: '🌱' },
  'Convolvulaceae':  { sprite: 'carrot',  color: '#e89640', emoji: '🌱' },
  'Boraginaceae':    { sprite: 'flower',  color: '#6a8ec0', emoji: '🌱' },
};

const DEFAULT_DISPLAY = { sprite: 'herb', color: '#7a9a4a', emoji: '🌱' };

// Look up display config for a species, with family fallback
export function getDisplay(speciesId, family) {
  return SPECIES_DISPLAY[speciesId]
    || (family && FAMILY_DEFAULTS[family])
    || DEFAULT_DISPLAY;
}

export const FAMILY_COLORS = {
  'Solanaceae':      '#c73030',
  'Cucurbitaceae':   '#3d8b3d',
  'Lamiaceae':       '#4fa83a',
  'Apiaceae':        '#7a9a4a',
  'Asteraceae':      '#e89640',
  'Brassicaceae':    '#5a8d3a',
  'Amaranthaceae':   '#a01a5a',
  'Fabaceae':        '#5a8d3a',
  'Amaryllidaceae':  '#a4d96b',
  'Convolvulaceae':  '#e89640',
  'Boraginaceae':    '#6a8ec0',
};
