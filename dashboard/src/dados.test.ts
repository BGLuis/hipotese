import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { lerConferencias, lerPRs, temposDoGrupo } from './dados';

const lerData = (nome: string): unknown =>
  JSON.parse(readFileSync(new URL(`../../data/${nome}`, import.meta.url), 'utf8'));

describe('carregamento dos dados reais', () => {
  const brutos = lerData('prs_reais.json') as Record<string, unknown>[];

  it('lê 30 PRs por grupo com tempos positivos', () => {
    const prs = lerPRs(brutos);
    expect(temposDoGrupo(prs, 'A')).toHaveLength(30);
    expect(temposDoGrupo(prs, 'B')).toHaveLength(30);
    expect(prs.every((p) => p.tempoMergeH > 0)).toBe(true);
  });

  it('rejeita arquivo com grupo incompleto', () => {
    const semUmDoA = brutos.filter((p, i) => !(p.grupo === 'A' && i === brutos.findIndex((q) => q.grupo === 'A')));
    expect(() => lerPRs(semUmDoA)).toThrow(/Grupo A tem 29/);
  });

  it('rejeita tempo de merge inválido', () => {
    const quebrado = brutos.map((p, i) => (i === 0 ? { ...p, tempo_merge_h: 'abc' } : p));
    expect(() => lerPRs(quebrado)).toThrow(/tempo_merge_h/);
  });

  it('lê as conferências de links', () => {
    const conferencias = lerConferencias(lerData('conferencia_links.json'));
    expect(conferencias.length).toBeGreaterThan(0);
    expect(conferencias.every((c) => c.url.startsWith('https://github.com/'))).toBe(true);
  });
});
