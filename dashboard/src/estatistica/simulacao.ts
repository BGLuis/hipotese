import { welch } from './welch';

export type Gerador = () => number;

export interface ParametrosLognormal {
  mu: number;
  sigma: number;
}

/** PRNG determinístico (mulberry32): a mesma semente reproduz a mesma simulação. */
export function criarGerador(semente: number): Gerador {
  let estado = semente >>> 0;
  return () => {
    estado = (estado + 0x6d2b79f5) >>> 0;
    let t = estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function normalPadrao(rng: Gerador): number {
  const u = 1 - rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
}

export function estimarLognormal(x: readonly number[]): ParametrosLognormal {
  const logs = x.map(Math.log);
  const mu = logs.reduce((s, v) => s + v, 0) / logs.length;
  const variancia = logs.reduce((s, v) => s + (v - mu) ** 2, 0) / (logs.length - 1);
  return { mu, sigma: Math.sqrt(variancia) };
}

export function gerarLognormal(p: ParametrosLognormal, n: number, rng: Gerador): number[] {
  return Array.from({ length: n }, () => Math.exp(p.mu + p.sigma * normalPadrao(rng)));
}

/** Estatística t de Welch repetida com as duas amostras vindas da mesma distribuição (H0 verdadeira). */
export function distribuicaoNula(
  p: ParametrosLognormal,
  nA: number,
  nB: number,
  repeticoes: number,
  rng: Gerador,
): number[] {
  return Array.from({ length: repeticoes }, () =>
    welch(gerarLognormal(p, nA, rng), gerarLognormal(p, nB, rng)).estatistica,
  );
}

export function quantil(valores: readonly number[], q: number): number {
  const ordenado = [...valores].sort((a, b) => a - b);
  const pos = q * (ordenado.length - 1);
  const base = Math.floor(pos);
  const resto = pos - base;
  return base + 1 < ordenado.length
    ? ordenado[base] * (1 - resto) + ordenado[base + 1] * resto
    : ordenado[base];
}
