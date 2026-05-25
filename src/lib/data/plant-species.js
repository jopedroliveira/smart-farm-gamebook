// Plant species registry — maps each species to its sprite kind, brand color, and growth cycle.
// NOTE: Visual data (sprite, color, emoji) is canonical in species-display.js.
//       This file is the seed fallback until all species live in Notion.
//       Once Notion has all 39+ species, this file can be deleted.

export const PLANT_SPECIES = {
  // Solanaceae (fruit) — long-cycle
  tomate_coracao:  { name: 'Tomate Coração-de-Boi', family: 'Solanaceae',    sprite: 'tomato',  color: '#c73030', emoji: '🍅', growthDays: 110 },
  tomate_cherry:   { name: 'Tomate Cherry',           family: 'Solanaceae',    sprite: 'tomato',  color: '#d04040', emoji: '🍅', growthDays: 85  },
  tomate_cacho:    { name: 'Tomate Cacho Preto',      family: 'Solanaceae',    sprite: 'tomato',  color: '#5a1a1a', emoji: '🍅', growthDays: 95  },
  pimento:         { name: 'Pimento',                  family: 'Solanaceae',    sprite: 'pepper',  color: '#c73030', emoji: '🌶', growthDays: 110 },
  beringela:       { name: 'Beringela',                family: 'Solanaceae',    sprite: 'pepper',  color: '#5a1a8a', emoji: '🍆', growthDays: 120 },

  // Cucurbitaceae
  courgette:       { name: 'Courgette',                family: 'Cucurbitaceae', sprite: 'squash',  color: '#3d8b3d', emoji: '🥒', growthDays: 60  },
  pepino:          { name: 'Pepino',                   family: 'Cucurbitaceae', sprite: 'squash',  color: '#2d6b2d', emoji: '🥒', growthDays: 60  },

  // Lamiaceae
  manjericao:      { name: 'Manjericão',               family: 'Lamiaceae',     sprite: 'herb',    color: '#4fa83a', emoji: '🌿', growthDays: 60  },
  segurelha:       { name: 'Segurelha',                family: 'Lamiaceae',     sprite: 'herb',    color: '#5a8d3a', emoji: '🌿', growthDays: 70  },

  // Apiaceae
  salsa:           { name: 'Salsa',                    family: 'Apiaceae',      sprite: 'herb',    color: '#3d8b3d', emoji: '🌿', growthDays: 75  },
  endro:           { name: 'Endro',                    family: 'Apiaceae',      sprite: 'herb',    color: '#5a8d3a', emoji: '🌿', growthDays: 60  },
  cenoura:         { name: 'Cenoura',                  family: 'Apiaceae',      sprite: 'carrot',  color: '#e89640', emoji: '🥕', growthDays: 75  },

  // Asteraceae
  calendula:       { name: 'Calêndula',                family: 'Asteraceae',    sprite: 'flower',  color: '#e89640', emoji: '🌼', growthDays: 80  },
  tagetes:         { name: 'Tagetes',                  family: 'Asteraceae',    sprite: 'flower',  color: '#f4d03f', emoji: '🌻', growthDays: 75  },
  camomila:        { name: 'Camomila',                 family: 'Asteraceae',    sprite: 'flower',  color: '#ffffff', emoji: '🌼', growthDays: 65  },
  alface:          { name: 'Alface',                   family: 'Asteraceae',    sprite: 'lettuce', color: '#4fa83a', emoji: '🥬', growthDays: 45  },

  // Brassicaceae
  rucula:          { name: 'Rúcula',                   family: 'Brassicaceae',  sprite: 'lettuce', color: '#5a8d3a', emoji: '🥬', growthDays: 30  },
  rabanete:        { name: 'Rabanete',                 family: 'Brassicaceae',  sprite: 'carrot',  color: '#c73030', emoji: '🥕', growthDays: 30  },
  nabica:          { name: 'Nabiça/Grelos',            family: 'Brassicaceae',  sprite: 'lettuce', color: '#7ec850', emoji: '🥬', growthDays: 30  },

  // Amaranthaceae
  beterraba:       { name: 'Beterraba',                family: 'Amaranthaceae', sprite: 'carrot',  color: '#a01a5a', emoji: '🥕', growthDays: 70  },
  espinafre:       { name: 'Espinafre',                family: 'Amaranthaceae', sprite: 'lettuce', color: '#2d6b2d', emoji: '🥬', growthDays: 45  },
  acelga:          { name: 'Acelga',                   family: 'Amaranthaceae', sprite: 'lettuce', color: '#3d8b3d', emoji: '🥬', growthDays: 60  },

  // Fabaceae
  feijao_verde:    { name: 'Feijão Verde Anão',         family: 'Fabaceae',      sprite: 'bean',    color: '#5a8d3a', emoji: '🫘', growthDays: 75  },

  // Amaryllidaceae
  alho_frances:    { name: 'Alho-Francês',             family: 'Amaryllidaceae', sprite: 'leek',   color: '#7ec850', emoji: '🧅', growthDays: 120 },
  cebolo:          { name: 'Cebolo',                   family: 'Amaryllidaceae', sprite: 'leek',   color: '#a4d96b', emoji: '🧅', growthDays: 70  },

  // Added from Notion
  couve_kale:      { name: 'Couve Kale',               family: 'Brassicaceae',  sprite: 'lettuce', color: '#5a8d3a', emoji: '🥬', growthDays: 65  },
  ervilha:         { name: 'Ervilha',                   family: 'Fabaceae',      sprite: 'bean',    color: '#5a8d3a', emoji: '🫛', growthDays: 80  },
  brocolos:        { name: 'Brócolos',                  family: 'Brassicaceae',  sprite: 'herb',    color: '#2d6b2d', emoji: '🥦', growthDays: 90  },
  coentros:        { name: 'Coentros',                  family: 'Apiaceae',      sprite: 'herb',    color: '#3d8b3d', emoji: '🌿', growthDays: 50  },
  cebolinho:       { name: 'Cebolinho',                 family: 'Amaryllidaceae', sprite: 'leek',   color: '#7ec850', emoji: '🧅', growthDays: 60  },
  couve_lombarda:  { name: 'Couve Lombarda',            family: 'Brassicaceae',  sprite: 'lettuce', color: '#5a3a8a', emoji: '🥬', growthDays: 100 },
  agriao:          { name: 'Agrião',                    family: 'Brassicaceae',  sprite: 'lettuce', color: '#3d8b3d', emoji: '🥬', growthDays: 30  },
  batata_doce:     { name: 'Batata Doce',               family: 'Convolvulaceae', sprite: 'carrot', color: '#e89640', emoji: '🍠', growthDays: 120 },
};

// Re-export from species-display.js — canonical source for visual config
export { FAMILY_COLORS } from './species-display.js';
