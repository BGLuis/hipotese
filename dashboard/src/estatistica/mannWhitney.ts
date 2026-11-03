import { normalSf } from './distribuicoes';
import type { ResultadoTeste } from './welch';

/** Postos médios (empates recebem a média) e soma de (t³ - t) dos grupos de empate. */
function postos(valores: readonly number[]): { postos: number[]; somaEmpates: number } {
  const ordem = valores.map((v, i) => [v, i] as const).sort((p, q) => p[0] - q[0]);
  const resultado = new Array<number>(valores.length);
  let somaEmpates = 0;
  let i = 0;
  while (i < ordem.length) {
    let j = i;
    while (j + 1 < ordem.length && ordem[j + 1][0] === ordem[i][0]) j++;
    const postoMedio = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) resultado[ordem[k][1]] = postoMedio;
    const t = j - i + 1;
    somaEmpates += t ** 3 - t;
    i = j + 1;
  }
  return { postos: resultado, somaEmpates };
}

/** Bicaudal, aproximação normal com correção de empates e de continuidade (igual ao `method='asymptotic'` do SciPy). */
export function mannWhitney(a: readonly number[], b: readonly number[]): ResultadoTeste {
  const n1 = a.length;
  const n2 = b.length;
  const n = n1 + n2;
  const { postos: r, somaEmpates } = postos([...a, ...b]);
  const somaPostosA = r.slice(0, n1).reduce((s, v) => s + v, 0);
  const u1 = somaPostosA - (n1 * (n1 + 1)) / 2;
  const u2 = n1 * n2 - u1;
  const media = (n1 * n2) / 2;
  const desvio = Math.sqrt(((n1 * n2) / 12) * (n + 1 - somaEmpates / (n * (n - 1))));
  const z = (Math.max(u1, u2) - media - 0.5) / desvio;
  return { estatistica: u1, pValor: Math.min(1, 2 * normalSf(z)) };
}
