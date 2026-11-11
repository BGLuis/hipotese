import type { LinhaSprint02 } from '../estatistica/sprint02';
import type { Figura } from './Grafico';

const testes = [
  { id: 'welch', nome: 'Welch', cor: '#2563eb' },
  { id: 'mann_whitney', nome: 'Mann-Whitney', cor: '#b45309' },
] as const;
const cenarios = [
  { id: 'base', nome: 'Base', linha: 'solid' },
  { id: 'assimetria', nome: 'Maior assimetria', linha: 'dash' },
] as const;

export function taxa(linhas: readonly LinhaSprint02[], cenario: LinhaSprint02['cenario'], teste: LinhaSprint02['teste'], efeito: LinhaSprint02['tamanho_efeito']) {
  const linha = linhas.find((item) => item.cenario === cenario && item.teste === teste && item.tamanho_efeito === efeito);
  if (!linha) throw new Error(`Resultado ausente para ${cenario}, ${teste}, efeito ${efeito}%`);
  return linha.taxa_rejeicao;
}

export function figuraG3(linhas: readonly LinhaSprint02[]): Figura {
  return {
    data: [
      ...testes.map(({ id, nome, cor }) => ({
        type: 'bar' as const, name: nome, marker: { color: cor },
        x: cenarios.map((c) => c.nome), y: cenarios.map((c) => taxa(linhas, c.id, id, 0)),
        hovertemplate: '%{y:.2%}<extra>%{fullData.name}</extra>',
      })),
      { type: 'scatter', mode: 'lines', name: 'Referência de 5%', x: cenarios.map((c) => c.nome),
        y: [0.05, 0.05], line: { color: '#475569', dash: 'dot' } },
    ],
    layout: {
      title: { text: 'G3 — Erro tipo I por cenário' }, barmode: 'group',
      xaxis: { title: { text: 'Cenário simulado' } },
      yaxis: { title: { text: 'Rejeições sob H₀ (%)' }, tickformat: '.0%', rangemode: 'tozero' },
      legend: { orientation: 'h', y: -0.25 }, margin: { t: 50, r: 20, b: 105, l: 65 },
    },
  };
}

export function figuraG4(linhas: readonly LinhaSprint02[]): Figura {
  return {
    data: cenarios.flatMap((cenario) => testes.map((teste) => {
      const pontos = linhas.filter((item) => item.cenario === cenario.id && item.teste === teste.id)
        .sort((a, b) => a.tamanho_efeito - b.tamanho_efeito);
      return {
        type: 'scatter' as const, mode: 'lines+markers' as const, name: `${teste.nome} · ${cenario.nome}`,
        x: pontos.map((p) => p.tamanho_efeito), y: pontos.map((p) => p.taxa_rejeicao),
        line: { color: teste.cor, dash: cenario.linha },
        marker: { symbol: cenario.id === 'base' ? 'circle' : 'circle-open' },
        hovertemplate: 'Efeito %{x}% · rejeições %{y:.2%}<extra>%{fullData.name}</extra>',
      };
    })),
    layout: {
      title: { text: 'G4 — Poder por tamanho do efeito' },
      xaxis: { title: { text: 'Aumento simulado no tempo do grupo A (%)' }, ticksuffix: '%' },
      yaxis: { title: { text: 'Rejeições (%)' }, tickformat: '.0%', rangemode: 'tozero' },
      legend: { orientation: 'h', y: -0.25 }, margin: { t: 50, r: 20, b: 120, l: 65 },
    },
  };
}
