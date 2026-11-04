import { describe, expect, it } from 'vitest';
import { lerPRs, temposDoGrupo } from '../dados';
import base from '../../../data/prs_reais.json';
import { executarSimulacao } from './analise';
import { mannWhitney } from './mannWhitney';
import { criarGerador, distribuicaoNula, estimarLognormal, gerarLognormal } from './simulacao';
import { welch } from './welch';

const prs = lerPRs(base);
const reais = { A: temposDoGrupo(prs, 'A'), B: temposDoGrupo(prs, 'B') };

describe('entrega da simulação integrada à base real', () => {
  it('preserva o exemplo e G2 do dashboard e não altera a entrada', () => {
    const antes = structuredClone(reais);
    const r = executarSimulacao(reais, { repeticoes: 20 });
    const rng = criarGerador(42);
    expect(r.simulados.A).toEqual(gerarLognormal(estimarLognormal(reais.A), 30, rng));
    expect(r.simulados.B).toEqual(gerarLognormal(estimarLognormal(reais.B), 30, rng));
    expect(r.tNula).toEqual(distribuicaoNula(r.conjunta, 30, 30, 20, rng));
    expect(reais).toEqual(antes);
    expect(r).toEqual(executarSimulacao(reais, { repeticoes: 20 }));
    expect(r.simulados).not.toEqual(executarSimulacao(reais, { semente: 7, repeticoes: 20 }).simulados);
    for (const resultado of r.nula) {
      for (const teste of [resultado.welch, resultado.mannWhitney]) {
        expect(Number.isFinite(teste.estatistica)).toBe(true);
        expect(teste.pValor).toBeGreaterThanOrEqual(0);
        expect(teste.pValor).toBeLessThanOrEqual(1);
        expect(teste.rejeitaH0).toBe(teste.pValor < 0.05);
      }
    }
  });

  it('reproduz as duas estatísticas com as mesmas amostras sob H0', () => {
    const r = executarSimulacao(reais, { repeticoes: 1, alfa: 0.1 });
    const rng = criarGerador(42);
    gerarLognormal(r.parametros.A, 30, rng);
    gerarLognormal(r.parametros.B, 30, rng);
    const a = gerarLognormal(r.conjunta, 30, rng);
    const b = gerarLognormal(r.conjunta, 30, rng);
    expect(r.nula[0].welch).toMatchObject(welch(a, b));
    expect(r.nula[0].mannWhitney).toMatchObject(mannWhitney(a, b));
    expect(r.welch.rejeitaH0).toBe(r.welch.pValor < 0.1);
  });
});

describe('entradas inválidas e casos degenerados', () => {
  it.each([[], [1], [1, NaN], [1, Infinity]].map((x) => ({ x })))('rejeita amostra inválida $x', ({ x }) => {
    expect(() => welch(x, [1, 2])).toThrow(RangeError);
    expect(() => mannWhitney([1, 2], x)).toThrow(RangeError);
  });
  it.each([[0, 1], [-1, 2]].map((x) => ({ x })))('rejeita tempos não positivos $x', ({ x }) => {
    expect(() => estimarLognormal(x)).toThrow(RangeError);
  });
  it.each([{ alfa: 0 }, { alfa: 1 }, { alfa: NaN }, { repeticoes: 0 }, { repeticoes: 1.5 },
    { semente: -1 }, { semente: 0.5 }, { semente: 4294967296 }])('rejeita configuração %j', (opcoes) => {
    expect(() => executarSimulacao(reais, opcoes)).toThrow(RangeError);
  });
  it('trata empates totais em U e informa Welch indefinido', () => {
    expect(mannWhitney([2, 2], [2, 2])).toEqual({ estatistica: 2, pValor: 1 });
    expect(() => welch([2, 2], [2, 2])).toThrow(/variância/);
  });
});
