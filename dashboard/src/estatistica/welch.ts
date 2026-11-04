import { tPValorBicaudal } from './distribuicoes';
import { validarAmostra } from './validacao';

export interface ResultadoTeste {
  estatistica: number;
  pValor: number;
}

export interface ResultadoWelch extends ResultadoTeste {
  grausLiberdade: number;
}

export function media(x: readonly number[]): number {
  return x.reduce((s, v) => s + v, 0) / x.length;
}

export function varianciaAmostral(x: readonly number[]): number {
  const m = media(x);
  return x.reduce((s, v) => s + (v - m) ** 2, 0) / (x.length - 1);
}

export function welch(a: readonly number[], b: readonly number[]): ResultadoWelch {
  validarAmostra(a);
  validarAmostra(b);
  const erroA = varianciaAmostral(a) / a.length;
  const erroB = varianciaAmostral(b) / b.length;
  if (!Number.isFinite(erroA + erroB) || erroA + erroB <= 0) {
    throw new RangeError('Welch requer variância total positiva e finita');
  }
  const estatistica = (media(a) - media(b)) / Math.sqrt(erroA + erroB);
  const grausLiberdade = (erroA + erroB) ** 2 / (erroA ** 2 / (a.length - 1) + erroB ** 2 / (b.length - 1));
  return { estatistica, grausLiberdade, pValor: tPValorBicaudal(estatistica, grausLiberdade) };
}
