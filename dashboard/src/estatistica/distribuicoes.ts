const LANCZOS = [
  676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059,
  12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
];

export function lnGamma(x: number): number {
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lnGamma(1 - x);
  const z = x - 1;
  let soma = 0.99999999999980993;
  for (let i = 0; i < LANCZOS.length; i++) soma += LANCZOS[i] / (z + i + 1);
  const t = z + LANCZOS.length - 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(soma);
}

const EPS = 1e-15;
const TINY = 1e-300;
const MAX_ITER = 500;

function fracaoContinuadaBeta(a: number, b: number, x: number): number {
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < TINY) d = TINY;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= MAX_ITER; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < TINY) d = TINY;
    c = 1 + aa / c;
    if (Math.abs(c) < TINY) c = TINY;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < TINY) d = TINY;
    c = 1 + aa / c;
    if (Math.abs(c) < TINY) c = TINY;
    d = 1 / d;
    const delta = d * c;
    h *= delta;
    if (Math.abs(delta - 1) < EPS) break;
  }
  return h;
}

/** Beta incompleta regularizada I_x(a, b). */
export function betaIncompleta(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const lnFator = lnGamma(a + b) - lnGamma(a) - lnGamma(b) + a * Math.log(x) + b * Math.log(1 - x);
  const fator = Math.exp(lnFator);
  if (x < (a + 1) / (a + b + 2)) return (fator * fracaoContinuadaBeta(a, b, x)) / a;
  return 1 - (fator * fracaoContinuadaBeta(b, a, 1 - x)) / b;
}

/** Gama incompleta regularizada superior Q(a, x). */
function gamaIncompletaQ(a: number, x: number): number {
  if (x <= 0) return 1;
  const lnFator = -x + a * Math.log(x) - lnGamma(a);
  if (x < a + 1) {
    let termo = 1 / a;
    let soma = termo;
    for (let n = 1; n <= MAX_ITER; n++) {
      termo *= x / (a + n);
      soma += termo;
      if (Math.abs(termo) < Math.abs(soma) * EPS) break;
    }
    return 1 - soma * Math.exp(lnFator);
  }
  let b = x + 1 - a;
  let c = 1 / TINY;
  let d = 1 / b;
  let h = d;
  for (let i = 1; i <= MAX_ITER; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < TINY) d = TINY;
    c = b + an / c;
    if (Math.abs(c) < TINY) c = TINY;
    d = 1 / d;
    const delta = d * c;
    h *= delta;
    if (Math.abs(delta - 1) < EPS) break;
  }
  return Math.exp(lnFator) * h;
}

/** Função de sobrevivência da normal padrão, P(Z > z), precisa nas caudas. */
export function normalSf(z: number): number {
  const metadeCauda = 0.5 * gamaIncompletaQ(0.5, (z * z) / 2);
  return z >= 0 ? metadeCauda : 1 - metadeCauda;
}

export function normalCdf(z: number): number {
  return 1 - normalSf(z);
}

export function normalPdf(z: number): number {
  return Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
}

export function tCdf(t: number, df: number): number {
  const cauda = 0.5 * betaIncompleta(df / (df + t * t), df / 2, 0.5);
  return t > 0 ? 1 - cauda : cauda;
}

/** P(|T| >= |t|), usada nos testes bicaudais. */
export function tPValorBicaudal(t: number, df: number): number {
  return betaIncompleta(df / (df + t * t), df / 2, 0.5);
}

export function tPdf(t: number, df: number): number {
  const ln = lnGamma((df + 1) / 2) - lnGamma(df / 2) - 0.5 * Math.log(df * Math.PI);
  return Math.exp(ln - ((df + 1) / 2) * Math.log(1 + (t * t) / df));
}
