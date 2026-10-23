// Sage's system prompt lives in sage-prompt/*.md, one file per theme, joined
// in filename order. Vite inlines them at build time, so the Docker image
// needs no extra files.

const files = import.meta.glob('./sage-prompt/*.md', { query: '?raw', eager: true, import: 'default' });

export const PROMPT_FILES = Object.keys(files).map(p => p.split('/').pop()).sort();

export const SYSTEM_PROMPT = PROMPT_FILES
  .map(name => files[`./sage-prompt/${name}`].trim())
  .join('\n\n');
