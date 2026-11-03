import Plotly from 'plotly.js-basic-dist-min';
import type { Data, Layout } from 'plotly.js';
import createPlotlyComponent from 'react-plotly.js/factory';

const Plot = createPlotlyComponent(Plotly);

export interface Figura {
  data: Data[];
  layout: Partial<Layout>;
}

export function Grafico({ figura }: { figura: Figura }) {
  return (
    <Plot
      data={figura.data}
      layout={{ autosize: true, margin: { t: 50, r: 20, b: 50, l: 55 }, ...figura.layout }}
      config={{ responsive: true, displaylogo: false }}
      style={{ width: '100%', height: 420 }}
      useResizeHandler
    />
  );
}
