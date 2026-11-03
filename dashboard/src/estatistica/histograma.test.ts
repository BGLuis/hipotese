import { describe, expect, it } from 'vitest';
import { histogramaDensidade } from './histograma';

describe('histogramaDensidade', () => {
  it('integra 1 quando todos os valores caem dentro do intervalo', () => {
    const h = histogramaDensidade([0.1, 0.4, 0.6, 1.2, 1.9], 0, 2, 0.5);
    expect(h.densidades.reduce((s, d) => s + d * 0.5, 0)).toBeCloseTo(1, 12);
    expect(h.centros).toEqual([0.25, 0.75, 1.25, 1.75]);
  });

  it('mantém valores fora do intervalo no denominador', () => {
    const h = histogramaDensidade([0.1, 99], 0, 1, 1);
    expect(h.densidades).toEqual([0.5]);
  });
});
