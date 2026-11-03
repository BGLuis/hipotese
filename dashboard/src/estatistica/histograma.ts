export interface Histograma {
  centros: number[];
  densidades: number[];
}

/** Densidade por bin de largura fixa; valores fora de [inicio, fim) são descartados da contagem mas contam no total. */
export function histogramaDensidade(valores: readonly number[], inicio: number, fim: number, passo: number): Histograma {
  const bins = Math.round((fim - inicio) / passo);
  const contagens = new Array<number>(bins).fill(0);
  for (const v of valores) {
    const i = Math.floor((v - inicio) / passo);
    if (i >= 0 && i < bins) contagens[i]++;
  }
  return {
    centros: contagens.map((_, i) => inicio + (i + 0.5) * passo),
    densidades: contagens.map((c) => c / (valores.length * passo)),
  };
}
