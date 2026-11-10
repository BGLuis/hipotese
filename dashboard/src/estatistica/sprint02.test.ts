import { describe, expect, it } from 'vitest';
import { mannWhitney } from './mannWhitney';
import { criarGerador, gerarLognormal } from './simulacao';
import { simularCenarioSprint02 } from './sprint02';
import { welch } from './welch';

describe('simulação compartilhada da Sprint 2', () => {
  const config = {
    cenario: 'base' as const,
    parametros: { mu: 2, sigma: 0.6 },
    repeticoes: 40,
  };

  it('reproduz a saída e fornece cinco taxas válidas por teste', () => {
    const linhas = simularCenarioSprint02(config);
    expect(simularCenarioSprint02(config)).toEqual(linhas);
    expect(linhas).toHaveLength(10);
    for (const teste of ['welch', 'mann_whitney']) {
      const porTeste = linhas.filter((linha) => linha.teste === teste);
      expect(porTeste.map((linha) => linha.tamanho_efeito)).toEqual([0, 10, 20, 40, 60]);
      for (const linha of porTeste) {
        expect(linha.cenario).toBe('base');
        expect(linha.taxa_rejeicao).toBeGreaterThanOrEqual(0);
        expect(linha.taxa_rejeicao).toBeLessThanOrEqual(1);
      }
    }
  });

  it('reaproveita o mesmo par nos testes e aumenta somente A em 10%', () => {
    const rng = criarGerador(42);
    const linhas = simularCenarioSprint02(config);
    for (let i = 0; i < 80; i++) gerarLognormal(config.parametros, 30, rng);
    const pares = Array.from({ length: 40 }, () => [
      gerarLognormal(config.parametros, 30, rng).map((valor) => 1.1 * valor),
      gerarLognormal(config.parametros, 30, rng),
    ] as const);
    expect(linhas.filter((linha) => linha.tamanho_efeito === 10).map((linha) => linha.taxa_rejeicao))
      .toEqual([welch, mannWhitney].map((teste) => pares.filter(([a, b]) => teste(a, b).pValor < 0.05).length / 40));
  });

  it('permite fornecer um sigma diferente no cenário de assimetria e rejeita sigma nulo', () => {
    const alternativo = simularCenarioSprint02({ ...config, cenario: 'assimetria', parametros: { mu: 2, sigma: 1.5 } });
    expect(alternativo.every((linha) => linha.cenario === 'assimetria')).toBe(true);
    expect(alternativo.map((linha) => linha.taxa_rejeicao))
      .not.toEqual(simularCenarioSprint02(config).map((linha) => linha.taxa_rejeicao));
    expect(() => simularCenarioSprint02({ ...config, parametros: { mu: 2, sigma: 0 } })).toThrow(RangeError);
  });

  it('valida o formato e integridade da saída do cenário de assimetria da Sprint 2', async () => {
    const { readFile } = await import('node:fs/promises');
    const { resolve } = await import('node:path');
    const caminhoSaida = resolve(__dirname, '../../../resultados/sprint02/assimetria.json');
    const conteudo = JSON.parse(await readFile(caminhoSaida, 'utf8'));
    expect(conteudo).toHaveLength(10);
    for (const linha of conteudo) {
      expect(linha.cenario).toBe('assimetria');
      expect(['welch', 'mann_whitney']).toContain(linha.teste);
      expect([0, 10, 20, 40, 60]).toContain(linha.tamanho_efeito);
      expect(linha.taxa_rejeicao).toBeGreaterThanOrEqual(0);
      expect(linha.taxa_rejeicao).toBeLessThanOrEqual(1);
    }
    const welchLinhas = conteudo.filter((l: { teste: string }) => l.teste === 'welch');
    const mwLinhas = conteudo.filter((l: { teste: string }) => l.teste === 'mann_whitney');
    expect(welchLinhas).toHaveLength(5);
    expect(mwLinhas).toHaveLength(5);
  });
});
