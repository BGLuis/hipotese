import { describe, expect, it } from 'vitest';
import { criarGerador, distribuicaoNula } from '../estatistica/simulacao';
import { figuraG1, figuraG2 } from './figuras';
import { tPValorBicaudal } from '../estatistica/distribuicoes';

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

  it('G1 inclui tempos extremos sem perder massa dos histogramas', () => {
    const f = figuraG1({ A: [0.001, 1], B: [3, 5000] }, { A: [0.00001, 3], B: [2, 10000] });
    for (const dado of f.data) {
      const barras = dado as { y: number[]; width: number };
      expect(barras.y.reduce((s, y) => s + y * barras.width, 0)).toBeCloseTo(1, 12);
    }
  });

  it('G2 sombreia as duas caudas do p-valor e usa o limiar do teste a 5%', () => {
    const pValor = tPValorBicaudal(2.31, 30);
    const f = figuraG2([-3, -1, 0, 1, 3], { estatistica: 2.31, pValor, grausLiberdade: 30 }, 0.05);
    const caudas = f.data.filter((d) => d.name?.startsWith('Área do p-valor'));
    expect(caudas).toHaveLength(2);
    let area = 0;
    for (const dado of caudas) {
      const curva = dado as { x: number[]; y: number[]; fill: string };
      expect(curva.fill).toBe('tozeroy');
      expect(curva.x.every((x) => Math.abs(x) >= 2.31)).toBe(true);
      for (let i = 1; i < curva.x.length; i++) {
        area += (curva.x[i] - curva.x[i - 1]) * (curva.y[i] + curva.y[i - 1]) / 2;
      }
    }
    expect(Math.abs(area - pValor)).toBeLessThan(0.0001);
    const rejeicao = f.layout.shapes?.find((s) => s.type === 'rect' && Number(s.x0) > 0);
    expect(tPValorBicaudal(Number(rejeicao?.x0), 30)).toBeCloseTo(0.05, 10);
  });
});
