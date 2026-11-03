import { useEffect, useMemo, useState } from 'react';
import { carregarDados, temposDoGrupo } from './dados';
import { mannWhitney } from './estatistica/mannWhitney';
import { criarGerador, distribuicaoNula, estimarLognormal, gerarLognormal } from './estatistica/simulacao';
import { welch } from './estatistica/welch';
import { Grafico } from './graficos/Grafico';
import { figuraG1, figuraG2 } from './graficos/figuras';
import type { Dados } from './tipos';

const BASE_DADOS = import.meta.env.VITE_DATA_BASE ?? `${import.meta.env.BASE_URL}data`;
const ALFA = 0.05;
const REPETICOES_H0 = 5000;

type Estado = { fase: 'carregando' } | { fase: 'erro'; mensagem: string } | { fase: 'ok'; dados: Dados };

export function App() {
  const [estado, setEstado] = useState<Estado>({ fase: 'carregando' });

  useEffect(() => {
    carregarDados(BASE_DADOS).then(
      (dados) => setEstado({ fase: 'ok', dados }),
      (erro: Error) => setEstado({ fase: 'erro', mensagem: erro.message }),
    );
  }, []);

  if (estado.fase === 'carregando') return <main><p>Carregando dados…</p></main>;
  if (estado.fase === 'erro') {
    return <main><p role="alert">Não foi possível carregar os dados de {BASE_DADOS}: {estado.mensagem}</p></main>;
  }
  return <Painel dados={estado.dados} />;
}

function Painel({ dados }: { dados: Dados }) {
  const [semente, setSemente] = useState(42);

  const analise = useMemo(() => {
    const reais = { A: temposDoGrupo(dados.prs, 'A'), B: temposDoGrupo(dados.prs, 'B') };
    const parametros = { A: estimarLognormal(reais.A), B: estimarLognormal(reais.B) };
    const rng = criarGerador(semente);
    const simulados = {
      A: gerarLognormal(parametros.A, reais.A.length, rng),
      B: gerarLognormal(parametros.B, reais.B.length, rng),
    };
    const conjunta = estimarLognormal([...reais.A, ...reais.B]);
    const tNula = distribuicaoNula(conjunta, reais.A.length, reais.B.length, REPETICOES_H0, rng);
    return {
      reais,
      parametros,
      simulados,
      tNula,
      welch: welch(simulados.A, simulados.B),
      mannWhitney: mannWhitney(simulados.A, simulados.B),
    };
  }, [dados, semente]);

  const conferem = dados.conferencias.filter((c) => c.confere).length;

  return (
    <main>
      <h1>LAB04 — t de Welch × Mann-Whitney</h1>
      <p className="sub">
        Tempo até o merge de PRs do {dados.resumo.repositorio} com (A) e sem (B) revisão do GitHub Copilot.
        Coleta em {dados.resumo.coletadoEmUtc.slice(0, 10)}: {dados.resumo.selecionados.A} PRs em A e{' '}
        {dados.resumo.selecionados.B} em B.
      </p>

      <section>
        <h2>Cenário</h2>
        <p>
          <strong>Pergunta:</strong> existe diferença no tempo até o merge entre PRs com e sem revisão automatizada?
        </p>
        <ul>
          <li><strong>Welch</strong> — H₀: as médias populacionais são iguais; H₁: diferem (bicaudal, α = 5%).</li>
          <li><strong>Mann-Whitney</strong> — H₀: as distribuições são iguais; H₁: diferem na posição relativa.</li>
        </ul>
      </section>

      <section>
        <h2>Simulação</h2>
        <label>
          Semente{' '}
          <input type="number" value={semente} onChange={(e) => setSemente(Number(e.target.value) || 0)} />
        </label>
        <p className="sub">
          Gerador lognormal com parâmetros estimados do log dos dados reais — A: μ = {analise.parametros.A.mu.toFixed(2)},
          σ = {analise.parametros.A.sigma.toFixed(2)}; B: μ = {analise.parametros.B.mu.toFixed(2)}, σ ={' '}
          {analise.parametros.B.sigma.toFixed(2)}. Sob H₀ ({REPETICOES_H0} repetições), as duas amostras vêm da mesma
          lognormal ajustada aos dois grupos juntos.
        </p>
      </section>

      <section>
        <Grafico figura={figuraG1(analise.reais, analise.simulados)} />
      </section>

      <section>
        <Grafico
          figura={figuraG2(analise.tNula, analise.welch, ALFA)}
        />
      </section>

      <section>
        <h2>Exemplo: amostra simulada</h2>
        <table>
          <thead>
            <tr><th>Teste</th><th>Estatística</th><th>p-valor</th><th>Decisão (α = 5%)</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>t de Welch</td>
              <td>{analise.welch.estatistica.toFixed(3)}</td>
              <td>{analise.welch.pValor.toFixed(4)}</td>
              <td>{analise.welch.pValor < ALFA ? 'Rejeita H₀' : 'Não rejeita H₀'}</td>
            </tr>
            <tr>
              <td>Mann-Whitney (U)</td>
              <td>{analise.mannWhitney.estatistica.toFixed(1)}</td>
              <td>{analise.mannWhitney.pValor.toFixed(4)}</td>
              <td>{analise.mannWhitney.pValor < ALFA ? 'Rejeita H₀' : 'Não rejeita H₀'}</td>
            </tr>
          </tbody>
        </table>
        <p className="sub">
          A simulação usa as mesmas distribuições estimadas dos dados reais, portanto reproduz a diferença observada. As
          comparações de erro tipo I e poder (10.000 simulações) pertencem à Sprint 02.
        </p>
      </section>

      <section>
        <h2>Conferência dos links</h2>
        <p>
          {conferem} de {dados.conferencias.length} PRs conferidos manualmente têm o grupo observado igual ao esperado.
        </p>
        <ul>
          {dados.conferencias.map((c) => (
            <li key={c.numero}>
              <a href={c.url} target="_blank" rel="noreferrer">#{c.numero}</a> — esperado {c.grupoEsperado}, observado{' '}
              {c.grupoObservado} {c.confere ? '✓' : '✗'}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
