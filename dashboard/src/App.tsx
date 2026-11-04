import { useEffect, useMemo, useState } from 'react';
import { carregarDados, temposDoGrupo } from './dados';
import { executarSimulacao } from './estatistica/analise';
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
    return executarSimulacao(reais, { semente, repeticoes: REPETICOES_H0, alfa: ALFA });
  }, [dados, semente]);

  const conferem = dados.conferencias.filter((c) => c.confere).length;

  return (
    <main>
      <h1>LAB04 — t de Welch × Mann-Whitney</h1>
      <nav aria-label="Links do trabalho">
        <a href="https://arsenal.dev.br/hipotese/">Dashboard publicado</a>{' · '}
        <a href="https://github.com/BGLuis/hipotese" target="_blank" rel="noreferrer">Repositório</a>{' · '}
        <a href="https://github.com/users/BGLuis/projects/1" target="_blank" rel="noreferrer">GitHub Projects</a>
      </nav>
      <p className="sub">Sprint 01 — cenário, geração de dados, exemplo dos dois testes e gráficos G1 e G2.</p>
      <p className="sub">
        Tempo até o merge de PRs do {dados.resumo.repositorio} com (A) e sem (B) revisão do GitHub Copilot.
        Coleta em {dados.resumo.coletadoEmUtc.slice(0, 10)}: {dados.resumo.selecionados.A} PRs em A e{' '}
        {dados.resumo.selecionados.B} em B.
      </p>

      <section>
        <h2>1. Cenário</h2>
        <p>
          <strong>Pergunta:</strong> existe diferença no tempo até o merge entre PRs com e sem revisão automatizada?
        </p>
        <ul>
          <li><strong>Welch</strong> — H₀: as médias populacionais são iguais; H₁: diferem (bicaudal, α = 5%).</li>
          <li><strong>Mann-Whitney</strong> — H₀: as distribuições são iguais; H₁: diferem na posição relativa.</li>
        </ul>
        <p>
          A fonte é a API pública do <a href="https://github.com/microsoft/vscode" target="_blank" rel="noreferrer">microsoft/vscode</a>:
          {' '}PRs criados em setembro de 2025 e integrados antes de outubro, selecionados por conveniência até obter 30 por grupo.
          Antes de simular, a expectativa do grupo era que Mann-Whitney fosse menos sensível à magnitude de extremos;
          Welch continua adequado à pergunta sobre médias. A coleta é observacional e não permite atribuir diferenças ao Copilot como causa.
        </p>
      </section>

      <section>
        <h2>2. Os dados</h2>
        <label>
          Semente{' '}
          <input type="number" min={0} max={4294967295} step={1} value={semente}
            onChange={(e) => {
              if (e.target.value !== '' && e.target.validity.valid) setSemente(Number(e.target.value));
            }} />
        </label>
        <p className="sub">
          Gerador lognormal com parâmetros estimados do log dos dados reais — A: μ = {analise.parametros.A.mu.toFixed(2)},
          σ = {analise.parametros.A.sigma.toFixed(2)}; B: μ = {analise.parametros.B.mu.toFixed(2)}, σ ={' '}
          {analise.parametros.B.sigma.toFixed(2)}. Sob H₀ ({REPETICOES_H0} repetições), as duas amostras vêm da mesma
          lognormal ajustada aos dois grupos juntos.
        </p>
        <Grafico figura={figuraG1(analise.reais, analise.simulados)} />
        <p>
          G1 compara os tempos reais (azul) e simulados (laranja) de cada grupo, em horas numa escala logarítmica,
          com todos os valores incluídos. Os tempos apresentam assimetria à direita e valores altos isolados;
          por isso adotamos inicialmente uma lognormal, com μ e σ ajustados à média e ao desvio padrão amostral dos logaritmos de cada grupo.
          A semelhança visual orienta esse modelo inicial, mas não comprova o ajuste nem garante que cada amostra simulada reproduza todas as características reais.
        </p>
      </section>

      <section>
        <h2>3. Como os testes funcionam</h2>
        <Grafico
          figura={figuraG2(analise.tNula, analise.welch, ALFA)}
        />
        <p>
          Welch compara médias usando os tempos em horas; Mann-Whitney compara a posição relativa das observações pelos postos,
          e só pode ser interpretado como comparação de medianas sob condições adicionais de forma.
          No G2, as barras mostram t em {REPETICOES_H0} pares simulados sob H₀; a curva é a referência t de Student
          com os graus de liberdade do exemplo, uma aproximação que pode diferir do histograma lognormal.
          As faixas vermelhas marcam a rejeição bicaudal a 5% dessa referência; as duas áreas azuis além de ±|t observado|
          representam o p-valor do exemplo (as caudas continuam além dos limites visíveis).
          Esse p-valor é a probabilidade, sob H₀ e o modelo do teste, de obter uma estatística tão extrema ou mais extrema;
          não é a probabilidade de H₀ ser verdadeira.
        </p>
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
        <p>
          Com a semente {semente}, Welch {analise.welch.rejeitaH0 ? 'rejeita' : 'não rejeita'} a igualdade das médias
          {' '}(p = {analise.welch.pValor.toFixed(4)}) e Mann-Whitney {analise.mannWhitney.rejeitaH0 ? 'rejeita' : 'não rejeita'}
          {' '}a igualdade das distribuições pelo contraste de postos (p = {analise.mannWhitney.pValor.toFixed(4)}), a 5%.
          Esses resultados se referem apenas à amostra simulada exibida: não rejeitar H₀ não demonstra igualdade,
          e um exemplo não permite recomendar um teste como superior ao outro.
        </p>
        <p className="sub">
          A simulação usa distribuições ajustadas separadamente aos grupos reais. As
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
