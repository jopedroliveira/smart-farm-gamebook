// Pixel-art sprite data — matrices and palettes.
// The rendering component is PixelSprite.svelte.

export const PIXEL = 4;

// ---------- PLANT SPRITES ----------

const SEED = [
  '......',
  '......',
  '......',
  '..bb..',
  '.bnnb.',
  '..bb..',
];

const TOMATO_STAGES = [
  SEED,
  ['..g...', '.ggg..', '..g...', '..g...', '.bnnb.', '..bb..'],
  ['.g.g..', 'gggg.g', '.gggg.', 'g.gg.g', '..gg..', '.bnnb.'],
  ['.gRgR.', 'gRRgRg', 'RRgRRR', 'gRRRgR', '.RggR.', '.bnnb.'],
];

const LETTUCE_STAGES = [
  SEED,
  ['......', '..L...', '.LLL..', '..L...', '.bnnb.', '..bb..'],
  ['.L.L..', 'LlLLL.', 'lLlLlL', '.LlLL.', '..LL..', '.bnnb.'],
  ['lLlLlL', 'LlLLlL', 'lLLlLL', 'LlLlLl', 'lLLLlL', '.bnnb.'],
];

const CARROT_STAGES = [
  SEED,
  ['..g...', '.g.g..', '..g...', '..o...', '.bnnb.', '..bb..'],
  ['g.g.g.', '.ggg..', 'g.g.g.', '..o...', '..oo..', '.bnnb.'],
  ['g.g.g.', '.ggg..', 'g.g.g.', '.OoO..', '.OOoO.', '..Oo..'],
];

const STRAWBERRY_STAGES = [
  SEED,
  ['..g...', '.ggg..', '..g...', '..g...', '.bnnb.', '..bb..'],
  ['.g.g..', 'gwgwg.', '.www..', 'g.w.g.', '..g...', '.bnnb.'],
  ['.gRg..', 'gRRRg.', 'RRyRR.', 'gRyRg.', '.RRR..', '.bnnb.'],
];

const PEPPER_STAGES = [
  SEED,
  ['..g...', '.g.g..', '..g...', '..g...', '.bnnb.', '..bb..'],
  ['g.gg..', '.ggg..', 'ggGgg.', '.gGg..', '..g...', '.bnnb.'],
  ['.gRg..', 'gRRRg.', 'gRRRg.', 'gRRRg.', '..R...', '.bnnb.'],
];

const BEAN_STAGES = [
  SEED,
  ['..g...', '..g...', '.ggg..', '..g...', '.bnnb.', '..bb..'],
  ['.g.g..', 'gggg..', '.ggggg', 'gggg..', '..g...', '.bnnb.'],
  ['.gygy.', 'gyggyg', 'ygyyyg', 'gyggyg', '.gygy.', '.bnnb.'],
];

const HERB_STAGES = [
  SEED,
  ['......', '..g...', '.ggg..', '..g...', '.bnnb.', '..bb..'],
  ['.g.g..', 'gGgGg.', '.GgG..', 'gGgGg.', '..g...', '.bnnb.'],
  ['gGgGgG', 'GgGgGg', 'gGGgGg', 'GgGGGG', 'gGgGgg', '.bnnb.'],
];

const FLOWER_STAGES = [
  SEED,
  ['......', '..g...', '..g...', '..g...', '.bnnb.', '..bb..'],
  ['..y...', '.yyy..', '..g...', '..g...', '.bnnb.', '..bb..'],
  ['.yYy..', 'YYrYY.', '.YyY..', '..g...', '..g...', '.bnnb.'],
];

const SQUASH_STAGES = [
  SEED,
  ['..g...', '.ggg..', 'g.g.g.', '..g...', '.bnnb.', '..bb..'],
  ['gGggGg', 'GGgGGg', 'gGGGgG', 'gGgGgg', '..g...', '.bnnb.'],
  ['gGggGg', 'GGGGGg', 'gGGGkG', 'gGyYgg', 'gGYYgg', '.bnnb.'],
];

const LEEK_STAGES = [
  SEED,
  ['..g...', '..g...', '..g...', '..w...', '..w...', '.bnnb.'],
  ['.g.g..', '.g.g..', '.g.g..', '.w.w..', '.w.w..', '.bnnb.'],
  ['g.g.g.', 'g.g.g.', 'gGgGg.', 'wWwWw.', 'wwwww.', '.bnnb.'],
];

export const WEED_SPRITE = ['.g.g.g', 'gygyg.', '.ggygg', 'gygggg', '.gygy.', '.bnnb.'];
export const COMPOST_SPRITE = ['nnnnnn', 'nbnbbn', 'nbgbnb', 'gnbbgn', 'nnnggn', 'nnnnnn'];

export const PLANT_PALETTE = {
  g: '#3d8b3d',
  G: '#2d6b2d',
  l: '#7ec850',
  L: '#4fa83a',
  o: '#d97920',
  O: '#e89640',
  R: '#c73030',
  r: '#a02020',
  y: '#f4d03f',
  Y: '#e89640',
  w: '#ffffff',
  W: '#e0e0e0',
  b: '#5a3a1f',
  n: '#3a2410',
  k: '#2d6b2d',
};

export const PLANTS = {
  tomato:     { name: 'TOMATO',   stages: TOMATO_STAGES,     daysToGrow: 4, yield: 6 },
  lettuce:    { name: 'LETTUCE',  stages: LETTUCE_STAGES,    daysToGrow: 3, yield: 3 },
  carrot:     { name: 'CARROT',   stages: CARROT_STAGES,     daysToGrow: 4, yield: 4 },
  strawberry: { name: 'STRAWBRY', stages: STRAWBERRY_STAGES, daysToGrow: 5, yield: 5 },
  pepper:     { name: 'PEPPER',   stages: PEPPER_STAGES,     daysToGrow: 5, yield: 4 },
  bean:       { name: 'BEAN',     stages: BEAN_STAGES,       daysToGrow: 3, yield: 5 },
  herb:       { name: 'HERB',     stages: HERB_STAGES,       daysToGrow: 3, yield: 2 },
  flower:     { name: 'FLOWER',   stages: FLOWER_STAGES,     daysToGrow: 4, yield: 1 },
  squash:     { name: 'SQUASH',   stages: SQUASH_STAGES,     daysToGrow: 6, yield: 4 },
  leek:       { name: 'LEEK',     stages: LEEK_STAGES,       daysToGrow: 5, yield: 3 },
};

// ---------- TOOL SPRITES ----------

export const WATERING_CAN = [
  '..bbbb..', '.b....bb', 'bb..b..b', 'b.b..b.b',
  'b...b..b', 'bb....b.', '.bbbbb..', '..bb....',
];

export const SHOVEL = [
  '......bb', '.....bw.', '....bw..', '...bw...',
  '..bb....', '.bbb....', 'bbbb....', '.bb.....',
];

export const SEED_PACKET = [
  'bbbbbbb.', 'b.....b.', 'b.gg..b.', 'b.ggg.b.',
  'b..gg.b.', 'b.....b.', 'bbbbbbb.', '........',
];

export const HARVEST_BASKET = [
  '........', '.RRRRRR.', 'bbbbbbbb', 'bgygygyb',
  'bygygygb', 'bgygygyb', '.bbbbbb.', '........',
];

export const TOOL_PALETTE = {
  b: '#3a2410',
  w: '#9bc7e8',
  g: '#3d8b3d',
  y: '#f4d03f',
  R: '#c73030',
};

export const TOOL_SPRITES = {
  water: WATERING_CAN,
  shovel: SHOVEL,
  seed: SEED_PACKET,
  harvest: HARVEST_BASKET,
};

// ---------- WEATHER SPRITES ----------

export const WEATHER_PALETTE = {
  y: '#ffd35a', Y: '#f7a82a', o: '#ff8800',
  w: '#ffffff', W: '#dfe4ea', G: '#a8b2bd', g: '#7a8590',
  b: '#1d1d1d',
  c: '#6ab7f5', C: '#2a82c8',
  l: '#ffe16a', L: '#f4d03f',
  s: '#cfeeff', S: '#ffffff',
  f: '#bfc4cc',
};

export const WX_SUN = [
  '.....b.b.b....', '......yyy.....', '.....yYYYy....', '.b..yYYYYYy.b.',
  '.bbyYYYwYYybb.', '.b.yYYYYYYYy.b', '...yYYYYYYy...', '....yYYYYy....',
  '.b..yYYYYy..b.', '.bb..yYYy..bb.', '.b....yyy....b', '......b.b.....',
  '..............', '..............',
];

export const WX_PARTLY = [
  '.....b.b.b....', '......yyy.....', '.b..yYYYYy....', '.bbyYYYwYYy...',
  '..byYYYYYYy...', '..byYYY..WWW..', '...yYY.WwwWW..', '....yyWWwwwWWW',
  '......WwwwwwWW', '.....WWWWWWWWW', '......WWWWWWW.', '..............',
  '..............', '..............',
];

export const WX_CLOUD = [
  '..............', '..............', '..............', '......WWWW....',
  '....WWwwwWW...', '..WWWwwwwwWWW.', '.WwwwwwwwwwwW.', 'WWwwwwwwwwwwWW',
  'WwwwwwwwwwwwwW', 'WWWWWWWWWWWWWW', '.WWGGGGGGGGW..', '..............',
  '..............', '..............',
];

export const WX_RAIN = [
  '......WWWW....', '....WWwwwWW...', '..WWWwwwwwWWW.', '.WwwwwwwwwwwW.',
  'WWwwwwwwwwwwWW', 'WwwwwwwwwwwwwW', 'WWGGGGGGGGGWW.', '..c..c..c..c..',
  '.c..c..c..c...', '..c..c..c..c..', '..............',
  '..............', '..............', '..............',
];

export const WX_STORM = [
  '......gggg....', '....ggGGGgg...', '..gggGGGGGggg.', '.gGGGGGGGGGGg.',
  'ggGGGGGGGGGGgg', 'gGGGGGGGGGGGGg', 'gggggggggggggg', '..c..l..c..c..',
  '.c..lLl.c..c..', '..c..l..c..c..', '.c..c.l.c..c..', '..c..c..c..c..',
  '..............', '..............',
];

export const WX_SNOW = [
  '......WWWW....', '....WWwwwWW...', '..WWWwwwwwWWW.', '.WwwwwwwwwwwW.',
  'WWwwwwwwwwwwWW', 'WWWWWWWWWWWWWW', '..s..s..s..s..', '.s..s..s..s...',
  '..s..s..s..s..', '.s..s..s..s...', '..............', '..............',
  '..............', '..............',
];

export const WX_FOG = [
  '..............', '..............', '..............', 'ffffffffffff..',
  '..............', '.fffffffffffff', '..............', 'fffffffffff...',
  '..............', '..ffffffffffff', '..............', 'ffffffffff....',
  '..............', '..............',
];

export const WEATHER_SPRITES = {
  sunny: WX_SUN,
  partly: WX_PARTLY,
  cloudy: WX_CLOUD,
  rain: WX_RAIN,
  drizzle: WX_RAIN,
  storm: WX_STORM,
  snow: WX_SNOW,
  fog: WX_FOG,
};

// ---------- CHARACTER SPRITES ----------

export const PLAYER_PALETTE = {
  c: '#1d6b1d',   // cap outline dark green
  C: '#3d8b3d',   // cap fill
  s: '#e8b896',   // skin
  S: '#b88560',   // skin shadow
  K: '#1d1d1d',   // eyes
  m: '#5a1a1a',   // mouth
  h: '#5a3a14',   // brown hair (back of head)
  r: '#b03030',   // red shirt outline
  R: '#d04040',   // red shirt
  n: '#3a4a8a',   // blue pants
  b: '#1d1d1d',   // boots
};

export const PLAYER_DOWN_A = [
  '...cccccc...', '..cCCCCCCc..', '.cCCCCCCCCc.', 'cCCCCCCCCCCc',
  '..ssssssss..', '..sKssssKs..', '...sssss....', '....smms....',
  '...sssss....', '..rRRRRRR...', '.rRRrrRRRr..', '.rRRrrRRRr..',
  '..rRRRRRR...', '..nnnnnnn...', '..nn..nnn...', '..bb..bbb...',
];

export const PLAYER_DOWN_B = [
  '...cccccc...', '..cCCCCCCc..', '.cCCCCCCCCc.', 'cCCCCCCCCCCc',
  '..ssssssss..', '..sKssssKs..', '...sssss....', '....smms....',
  '...sssss....', '..rRRRRRR...', '.rRRrrRRRr..', '.rRRrrRRRr..',
  '..rRRRRRR...', '..nnnnnnn...', '..nnn..nn...', '..bbb..bb...',
];

export const PLAYER_UP_A = [
  '...cccccc...', '..cCCCCCCc..', '.cCCCCCCCCc.', 'cCCCCCCCCCCc',
  '..hhhhhhhh..', '..hhhhhhhh..', '...hhhhh....', '............',
  '...sssss....', '..rRRRRRR...', '.rRRRRRRRr..', '.rRRRRRRRr..',
  '..rRRRRRR...', '..nnnnnnn...', '..nn..nnn...', '..bb..bbb...',
];

export const PLAYER_UP_B = [
  '...cccccc...', '..cCCCCCCc..', '.cCCCCCCCCc.', 'cCCCCCCCCCCc',
  '..hhhhhhhh..', '..hhhhhhhh..', '...hhhhh....', '............',
  '...sssss....', '..rRRRRRR...', '.rRRRRRRRr..', '.rRRRRRRRr..',
  '..rRRRRRR...', '..nnnnnnn...', '..nnn..nn...', '..bbb..bb...',
];

export const PLAYER_SIDE_A = [
  '....cccc....', '...cCCCCcc..', '..cCCCCCCCc.', '..cCCCCCCCc.',
  '...sssssss..', '....sKssss..', '....sssss...', '.....smm....',
  '....sssss...', '...rRRRRR...', '..rRRRRRR...', '..rRRRRRR...',
  '...rRRRR....', '...nnnnn....', '...nnn......', '....bbb.....',
];

export const PLAYER_SIDE_B = [
  '....cccc....', '...cCCCCcc..', '..cCCCCCCCc.', '..cCCCCCCCc.',
  '...sssssss..', '....sKssss..', '....sssss...', '.....smm....',
  '....sssss...', '...rRRRRR...', '..rRRRRRR...', '..rRRRRRR...',
  '...rRRRR....', '...nnnnn....', '......nnn...', '......bbb...',
];

// ---------- SAGE (assistant) SPRITES ----------

export const SAGE_PALETTE = {
  H: '#a0731f',  // hat dark outline
  h: '#d9a93a',  // hat mid
  y: '#f4d03f',  // hat highlight
  S: '#b88560',  // skin shadow
  s: '#e8b896',  // skin
  k: '#1d1d1d',  // eye
  '-': '#5a3a1a', // closed eye / line
  m: '#7a3a1a',  // mouth line
  M: '#3a1a0a',  // open mouth
  W: '#f0f0f0',  // beard light
  w: '#c4c4c4',  // beard mid (lowercase w unused in idle but needed for talk)
  g: '#3d8b3d',  // shirt
  G: '#2d6b2d',  // shirt dark
  n: '#5a3a1a',  // pants
  b: '#3a2410',  // boots
};

export const SAGE_IDLE_A = [
  '...HHHHHHHH...', '..HhhhhhhhhH..', '.HhhyyyyyyhhH.', '.HhyyyyyyyyhH.',
  'HHHHHHHHHHHHHH', '.HHHHHHHHHHHH.', '....SsssssS...', '....SsssssS...',
  '...SkSssSkS...', '....SmmmmS....', '....SWWWWS....', '...WWWWWWWW...',
  '...gGgggggGg..', '..gGGGgggGGGg.', '..gGGGgggGGGg.', '...gggggggg...',
  '....nn..nn....', '....bb..bb....',
];

export const SAGE_IDLE_B = [
  '...HHHHHHHH...', '..HhhhhhhhhH..', '.HhhyyyyyyhhH.', '.HhyyyyyyyyhH.',
  'HHHHHHHHHHHHHH', '.HHHHHHHHHHHH.', '....SsssssS...', '....SsssssS...',
  '...S-Ss-Ss-S..', '....SmmmmS....', '....SWWWWS....', '...WWWWWWWW...',
  '..gGgggggGg...', '.gGGGgggGGGg..', '.gGGGgggGGGg..', '..gggggggg....',
  '....nn..nn....', '....bb..bb....',
];

export const SAGE_TALK = [
  '...HHHHHHHH...', '..HhhhhhhhhH..', '.HhhyyyyyyhhH.', '.HhyyyyyyyyhH.',
  'HHHHHHHHHHHHHH', '.HHHHHHHHHHHH.', '....SsssssS...', '....SsssssS...',
  '...SkSssSkS...', '....SmMMmS....', '....SWWWWS....', '...WWWWWWWW...',
  '...gGgggggGg..', '..gGGGgggGGGg.', '..gGGGgggGGGg.', '...gggggggg...',
  '....nn..nn....', '....bb..bb....',
];
