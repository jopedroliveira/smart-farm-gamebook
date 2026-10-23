import { describe, it, expect } from 'vitest';
import { SYSTEM_PROMPT, PROMPT_FILES } from '../sage-prompt.js';

describe('sage prompt files', () => {
  it('joins the seven themed files in order', () => {
    expect(PROMPT_FILES).toEqual([
      '00-persona.md', '10-coimbra.md', '20-rotacao-solo.md', '30-consociacao.md',
      '40-pragas.md', '50-ferramentas.md', '60-formato.md',
    ]);
    expect(SYSTEM_PROMPT.startsWith('Tu es o Sage')).toBe(true);
    expect(SYSTEM_PROMPT).toContain('terminar_cultura');
    expect(SYSTEM_PROMPT).toContain('Delia radicum');
  });

  it('has no accented characters, like the rest of the UI text', () => {
    expect(SYSTEM_PROMPT).not.toMatch(/[áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]/);
  });
});
