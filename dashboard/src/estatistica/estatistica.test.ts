import { describe, expect, it } from 'vitest';
import referencia from './referencia_scipy.json';
import { normalCdf, tCdf } from './distribuicoes';
import { mannWhitney } from './mannWhitney';
import { criarGerador, distribuicaoNula, gerarLognormal } from './simulacao';
import { welch } from './welch';

const TOLERANCIA = 1e-6;

describe('distribuições contra o SciPy', () => {
  it.each(referencia.tcdf)('CDF t(%j)', ({ t, df, cdf }) => {
    expect(tCdf(t, df)).toBeCloseTo(cdf, 9);
  });
  it.each(referencia.normal)('CDF normal(%j)', ({ z, cdf }) => {
    expect(normalCdf(z)).toBeCloseTo(cdf, 9);
  });
});

describe.each(Object.entries(referencia.casos))('testes no caso %s', (_nome, caso) => {
  it('Welch coincide com scipy.stats.ttest_ind(equal_var=False)', () => {
    const r = welch(caso.a, caso.b);
    expect(Math.abs(r.estatistica - caso.welch.t)).toBeLessThan(TOLERANCIA);
    expect(Math.abs(r.grausLiberdade - caso.welch.df)).toBeLessThan(TOLERANCIA);
    expect(Math.abs(r.pValor - caso.welch.p)).toBeLessThan(TOLERANCIA);
  });
  it('Mann-Whitney coincide com scipy.stats.mannwhitneyu(asymptotic)', () => {
    const r = mannWhitney(caso.a, caso.b);
    expect(r.estatistica).toBeCloseTo(caso.mw.u, 9);
    expect(Math.abs(r.pValor - caso.mw.p)).toBeLessThan(TOLERANCIA);
  });
});

describe('simulação', () => {
  const params = { mu: 0, sigma: 1 };

  it('a mesma semente reproduz as mesmas amostras', () => {
    const a = gerarLognormal(params, 20, criarGerador(7));
    const b = gerarLognormal(params, 20, criarGerador(7));
    const c = gerarLognormal(params, 20, criarGerador(8));
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });

  it('sob H0 o Welch rejeita perto do nível nominal de 5%', () => {
    const t = distribuicaoNula(params, 30, 30, 3000, criarGerador(42));
    const criticoAprox = 2.0017; // t de Student, 58 g.l., bicaudal 5%
    const taxa = t.filter((v) => Math.abs(v) > criticoAprox).length / t.length;
    expect(taxa).toBeGreaterThan(0.03);
    expect(taxa).toBeLessThan(0.07);
  });

  it('com deslocamento grande os dois testes rejeitam H0', () => {
    const rng = criarGerador(1);
    const a = gerarLognormal({ mu: 0, sigma: 0.5 }, 30, rng);
    const b = gerarLognormal({ mu: 3, sigma: 0.5 }, 30, rng);
    expect(welch(a, b).pValor).toBeLessThan(0.001);
    expect(mannWhitney(a, b).pValor).toBeLessThan(0.001);
  });
});
