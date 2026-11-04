import type { Data, Layout, Shape } from 'plotly.js';
import { tPdf, tPValorBicaudal } from '../estatistica/distribuicoes';
import { histogramaDensidade } from '../estatistica/histograma';
import type { Figura } from './Grafico';

const COR_REAL = '#2563eb';
const COR_SIMULADO = '#f97316';
const COR_REJEICAO = '#dc2626';

const PASSO_LOG = 0.25;
const PASSO_T = 0.25;

function histograma(x: readonly number[], nome: string, cor: string, eixo: 'x' | 'x2', eixoY: 'y' | 'y2', faixa: [number, number]): Data {
  const h = histogramaDensidade(x.map(Math.log10), faixa[0], faixa[1], PASSO_LOG);
  return {
    type: 'bar',
    x: h.centros,
    y: h.densidades,
    width: PASSO_LOG,
    name: nome,
    xaxis: eixo,
    yaxis: eixoY,
    opacity: 0.6,
    marker: { color: cor },
    legendgroup: nome,
    showlegend: eixo === 'x',
  };
}

function eixoLog(titulo: string, faixa: [number, number]): Partial<Layout['xaxis']> {
  const ticks = Array.from({ length: Math.floor(faixa[1]) - Math.ceil(faixa[0]) + 1 }, (_, i) => Math.ceil(faixa[0]) + i);
  return {
    title: { text: titulo },
    tickvals: ticks,
    ticktext: ticks.map((v) => String(10 ** v)),
    range: faixa,
  };
}

/** G1: histogramas dos tempos de merge reais e simulados, um painel por grupo (eixo x em log). */
export function figuraG1(
  reais: { A: readonly number[]; B: readonly number[] },
  simulados: { A: readonly number[]; B: readonly number[] },
): Figura {
  const logs = [...reais.A, ...reais.B, ...simulados.A, ...simulados.B].map(Math.log10);
  const faixa: [number, number] = [
    Math.floor(Math.min(...logs) / PASSO_LOG) * PASSO_LOG,
    (Math.floor(Math.max(...logs) / PASSO_LOG) + 1) * PASSO_LOG,
  ];
  return {
    data: [
      histograma(reais.A, 'Real', COR_REAL, 'x', 'y', faixa),
      histograma(simulados.A, 'Simulado', COR_SIMULADO, 'x', 'y', faixa),
      histograma(reais.B, 'Real', COR_REAL, 'x2', 'y2', faixa),
      histograma(simulados.B, 'Simulado', COR_SIMULADO, 'x2', 'y2', faixa),
    ],
    layout: {
      title: { text: 'G1 — Tempo até o merge: dados reais × simulados' },
      barmode: 'overlay',
      grid: { rows: 1, columns: 2, pattern: 'independent' },
      xaxis: { ...eixoLog('Grupo A (com Copilot) — horas', faixa), domain: [0, 0.47] },
      xaxis2: { ...eixoLog('Grupo B (sem Copilot) — horas', faixa), domain: [0.53, 1] },
      yaxis: { title: { text: 'Densidade em log₁₀(horas)' } },
      yaxis2: { title: { text: 'Densidade em log₁₀(horas)' } },
      legend: { orientation: 'h', y: -0.25 },
    },
  };
}

/** G2: distribuição de t sob H0, região de rejeição bicaudal e a estatística de um exemplo. */
export function figuraG2(
  tNula: readonly number[],
  exemplo: { estatistica: number; pValor: number; grausLiberdade: number },
  alfa: number,
): Figura {
  // Região de rejeição do mesmo teste teórico que calcula o p-valor.
  let baixo = 0;
  let alto = 1;
  while (tPValorBicaudal(alto, exemplo.grausLiberdade) > alfa) alto *= 2;
  for (let i = 0; i < 70; i++) {
    const meio = (baixo + alto) / 2;
    if (tPValorBicaudal(meio, exemplo.grausLiberdade) > alfa) baixo = meio;
    else alto = meio;
  }
  const superior = (baixo + alto) / 2;
  const inferior = -superior;
  const limite = Math.max(6, Math.ceil(Math.abs(exemplo.estatistica)) + 2,
    Math.ceil(Math.max(...tNula.map(Math.abs))) + 1, Math.ceil(superior) + 1);
  const histNula = histogramaDensidade(tNula, -limite, limite, PASSO_T);
  const grade = Array.from({ length: 401 }, (_, i) => -limite + (2 * limite * i) / 400);
  const caudaP = (sinal: number): Data => {
    const inicio = Math.abs(exemplo.estatistica);
    const x = Array.from({ length: 401 }, (_, i) => sinal * (inicio + (limite - inicio) * i / 400)).sort((a, b) => a - b);
    return {
      type: 'scatter', mode: 'lines', x,
      y: x.map((t) => tPdf(t, exemplo.grausLiberdade)),
      fill: 'tozeroy', fillcolor: 'rgba(37, 99, 235, 0.45)',
      line: { color: COR_REAL, width: 1 },
      name: `Área do p-valor bicaudal = ${exemplo.pValor.toFixed(4)}`,
      legendgroup: 'p-valor', showlegend: sinal > 0,
    };
  };

  const regiao = (x0: number, x1: number): Partial<Shape> => ({
    type: 'rect',
    xref: 'x',
    yref: 'paper',
    x0,
    x1,
    y0: 0,
    y1: 1,
    fillcolor: COR_REJEICAO,
    opacity: 0.15,
    line: { width: 0 },
    layer: 'below',
    name: `Região de rejeição (α = ${alfa})`,
    showlegend: x0 >= 0,
  });

  return {
    data: [
      {
        type: 'bar',
        x: histNula.centros,
        y: histNula.densidades,
        width: PASSO_T,
        name: 'Welch simulado sob H₀',
        marker: { color: COR_REAL },
        opacity: 0.25,
      },
      caudaP(-1),
      caudaP(1),
      {
        type: 'scatter',
        mode: 'lines',
        x: grade,
        y: grade.map((t) => tPdf(t, exemplo.grausLiberdade)),
        name: `t de Student (${exemplo.grausLiberdade.toFixed(1)} g.l.)`,
        line: { color: COR_REAL, width: 2 },
      },
    ],
    layout: {
      title: { text: 'G2 — Estatística t de Welch sob H₀' },
      margin: { t: 50, r: 20, b: 115, l: 55 },
      xaxis: { title: { text: 'Estatística t (sem unidade)' }, range: [-limite, limite] },
      yaxis: { title: { text: 'Densidade' } },
      shapes: [
        regiao(-limite, inferior),
        regiao(superior, limite),
        {
          type: 'line',
          xref: 'x',
          yref: 'paper',
          x0: exemplo.estatistica,
          x1: exemplo.estatistica,
          y0: 0,
          y1: 1,
          line: { color: COR_REJEICAO, width: 3, dash: 'dash' },
        },
      ],
      annotations: [
        {
          x: exemplo.estatistica,
          y: 1,
          yref: 'paper',
          text: `t = ${exemplo.estatistica.toFixed(2)}<br>p = ${exemplo.pValor.toFixed(4)}`,
          showarrow: false,
          xanchor: exemplo.estatistica >= 0 ? 'left' : 'right',
          yanchor: 'top',
        },
      ],
      legend: { orientation: 'h', y: -0.25 },
    },
  };
}
