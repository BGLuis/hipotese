import type { Data, Layout, Shape } from 'plotly.js';
import { tPdf } from '../estatistica/distribuicoes';
import { histogramaDensidade } from '../estatistica/histograma';
import { quantil } from '../estatistica/simulacao';
import type { Figura } from './Grafico';

const COR_REAL = '#2563eb';
const COR_SIMULADO = '#f97316';
const COR_REJEICAO = '#dc2626';

const TICKS_LOG = [0.1, 1, 10, 100, 1000];

const PASSO_LOG = 0.25;
const PASSO_T = 0.25;

function histograma(x: readonly number[], nome: string, cor: string, eixo: 'x' | 'x2', eixoY: 'y' | 'y2'): Data {
  const h = histogramaDensidade(x.map(Math.log10), -1, 3, PASSO_LOG);
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

function eixoLog(titulo: string): Partial<Layout['xaxis']> {
  return {
    title: { text: titulo },
    tickvals: TICKS_LOG.map(Math.log10),
    ticktext: TICKS_LOG.map(String),
    range: [-1, 3],
  };
}

/** G1: histogramas dos tempos de merge reais e simulados, um painel por grupo (eixo x em log). */
export function figuraG1(
  reais: { A: readonly number[]; B: readonly number[] },
  simulados: { A: readonly number[]; B: readonly number[] },
): Figura {
  return {
    data: [
      histograma(reais.A, 'Real', COR_REAL, 'x', 'y'),
      histograma(simulados.A, 'Simulado', COR_SIMULADO, 'x', 'y'),
      histograma(reais.B, 'Real', COR_REAL, 'x2', 'y2'),
      histograma(simulados.B, 'Simulado', COR_SIMULADO, 'x2', 'y2'),
    ],
    layout: {
      title: { text: 'G1 — Tempo até o merge: dados reais × simulados' },
      barmode: 'overlay',
      grid: { rows: 1, columns: 2, pattern: 'independent' },
      xaxis: { ...eixoLog('Grupo A (com Copilot) — horas'), domain: [0, 0.47] },
      xaxis2: { ...eixoLog('Grupo B (sem Copilot) — horas'), domain: [0.53, 1] },
      yaxis: { title: { text: 'Densidade' } },
      yaxis2: { title: { text: 'Densidade' } },
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
  const inferior = quantil(tNula, alfa / 2);
  const superior = quantil(tNula, 1 - alfa / 2);
  const limite = Math.max(5, Math.ceil(Math.abs(exemplo.estatistica)) + 1);
  const histNula = histogramaDensidade(tNula, -limite, limite, PASSO_T);
  const grade = Array.from({ length: 401 }, (_, i) => -limite + (2 * limite * i) / 400);

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
  });

  return {
    data: [
      {
        type: 'bar',
        x: histNula.centros,
        y: histNula.densidades,
        width: PASSO_T,
        name: 'Welch simulado sob H₀',
        marker: { color: COR_SIMULADO },
        opacity: 0.6,
      },
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
      xaxis: { title: { text: 'Estatística t' }, range: [-limite, limite] },
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
