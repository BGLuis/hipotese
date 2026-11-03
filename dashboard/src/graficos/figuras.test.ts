import { describe, expect, it } from 'vitest';
import { criarGerador, distribuicaoNula } from '../estatistica/simulacao';
import { figuraG1, figuraG2 } from './figuras';

describe('figuras', () => {
  it('G1 tem real e simulado para cada um dos dois grupos', () => {
    const f = figuraG1({ A: [1, 2], B: [3, 4] }, { A: [1, 3], B: [2, 5] });
    expect(f.data).toHaveLength(4);
    expect(f.data.map((d) => d.name)).toEqual(['Real', 'Simulado', 'Real', 'Simulado']);
  });

  it('G2 marca duas regiões de rejeição e a estatística do exemplo', () => {
    const t = distribuicaoNula({ mu: 0, sigma: 1 }, 30, 30, 500, criarGerador(1));
    const f = figuraG2(t, { estatistica: 2.31, pValor: 0.0279, grausLiberdade: 30 }, 0.05);
    const formas = f.layout.shapes ?? [];
    expect(formas.filter((s) => s.type === 'rect')).toHaveLength(2);
    expect(formas.some((s) => s.type === 'line' && s.x0 === 2.31)).toBe(true);
    expect(JSON.stringify(f.layout.annotations)).toContain('p = 0.0279');
  });
});
