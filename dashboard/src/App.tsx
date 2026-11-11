import { useEffect, useMemo, useState } from 'react';
import { carregarDados, temposDoGrupo } from './dados';
import { executarSimulacao } from './estatistica/analise';
import { mannWhitney } from './estatistica/mannWhitney';
import { media, welch } from './estatistica/welch';
import type { LinhaSprint02 } from './estatistica/sprint02';
import { Grafico } from './graficos/Grafico';
import { figuraG1, figuraG2 } from './graficos/figuras';
import { figuraG3, figuraG4, taxa } from './graficos/sprint02';
import base from '../../resultados/sprint02/base.json';
import assimetria from '../../resultados/sprint02/assimetria.json';
import type { Dados } from './tipos';

const BASE_DADOS = import.meta.env.VITE_DATA_BASE ?? `${import.meta.env.BASE_URL}data`;
const ALFA = 0.05;
const REPETICOES_H0 = 5000;
const resultados = [...base, ...assimetria] as LinhaSprint02[];
const percentual = new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 2 });
const numero = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pValor = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
const g3 = figuraG3(resultados);
const g4 = figuraG4(resultados);
const taxaFormatada = (cenario: LinhaSprint02['cenario'], teste: LinhaSprint02['teste'], efeito: LinhaSprint02['tamanho_efeito']) =>
  percentual.format(taxa(resultados, cenario, teste, efeito));
const decisao = (p: number) => p < ALFA ? 'Rejeita H₀' : 'Não rejeita H₀';
const erroTipoI = `No cenário base, Welch rejeitou em ${taxaFormatada('base', 'welch', 0)} das simulações sem efeito e Mann-Whitney em ${taxaFormatada('base', 'mann_whitney', 0)}. Com mais assimetria, as taxas foram ${taxaFormatada('assimetria', 'welch', 0)} e ${taxaFormatada('assimetria', 'mann_whitney', 0)}, respectivamente. Welch ficou mais abaixo dos 5% nos dois cenários, ou seja, foi mais conservador.`;
const poder = `Mann-Whitney detectou mais efeitos em todos os pontos positivos simulados. A vantagem variou com o tamanho do efeito e permaneceu com Mann-Whitney nos dois cenários. Com aumento de 60%, Mann-Whitney e Welch detectaram, respectivamente, ${taxaFormatada('base', 'mann_whitney', 60)} e ${taxaFormatada('base', 'welch', 60)} no cenário base, e ${taxaFormatada('assimetria', 'mann_whitney', 60)} e ${taxaFormatada('assimetria', 'welch', 60)} no de maior assimetria.`;

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

  const reais = useMemo(() => ({
    A: temposDoGrupo(dados.prs, 'A'), B: temposDoGrupo(dados.prs, 'B'),
  }), [dados.prs]);
  const analise = useMemo(
    () => executarSimulacao(reais, { semente, repeticoes: REPETICOES_H0, alfa: ALFA }),
    [reais, semente],
  );
  const testesReais = useMemo(() => {
    const { A, B } = reais;
    const resultadoU = mannWhitney(A, B);
    return {
      welch: welch(A, B), mannWhitney: resultadoU,
      diferencaHoras: media(A) - media(B), probabilidadeA: resultadoU.estatistica / (A.length * B.length),
    };
  }, [reais]);
  const concordam = (testesReais.welch.pValor < ALFA) === (testesReais.mannWhitney.pValor < ALFA);
  const resumoReal = `A 5%, os testes ${concordam ? 'tomaram a mesma decisão' : 'tomaram decisões diferentes'} para suas respectivas hipóteses. A diferença observada entre as médias foi de ${numero.format(testesReais.diferencaHoras)} h (A − B). Na comparação por postos, A teve tempo maior em ${percentual.format(testesReais.probabilidadeA)} dos pares A–B, contando metade dos empates. A importância prática em horas depende de quanto atraso ou ganho a equipe considera relevante e da influência dos tempos extremos.`;
  const recomendacao = 'Para comparar a posição dos tempos de merge nesse cenário assimétrico, recomendamos Mann-Whitney: ele ficou mais próximo dos 5% e teve mais poder nas simulações. Para uma decisão que depende especificamente da diferença entre médias em horas, usaríamos um método que responda sobre médias e avaliaríamos se Welch é adequado com uma amostra maior ou tempos menos assimétricos. A principal limitação é a amostra observacional de 60 PRs de um único repositório, com grupos coletados em janelas distintas, o que limita a generalização e a atribuição causal.';

  const conferem = dados.conferencias.filter((c) => c.confere).length;

  return (
    <main>
      <h1>LAB04 — t de Welch × Mann-Whitney</h1>
      <nav aria-label="Links do trabalho">
        <a href="https://arsenal.dev.br/hipotese/">Dashboard publicado</a>{' · '}
        <a href="https://github.com/BGLuis/hipotese" target="_blank" rel="noreferrer">Repositório</a>{' · '}
        <a href="https://github.com/users/BGLuis/projects/1" target="_blank" rel="noreferrer">GitHub Projects</a>
      </nav>
      <p className="sub"><a href="#apresentacao">15 perguntas da apresentação</a></p>
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
        <details>
        <summary>Resultados do exemplo com dados simulados</summary>
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
        </details>
      </section>

      <section>
        <h2>4. Erro tipo I</h2>
        <Grafico figura={g3} />
        <p>{erroTipoI}</p>
        <p className="sub">Foram 10.000 repetições por cenário e tamanho de efeito, com 30 tempos por grupo, semente 42 e α = 5%.</p>
      </section>

      <section>
        <h2>5. Poder</h2>
        <Grafico figura={g4} />
        <p>{poder}</p>
        <p className="sub">O ponto de efeito zero mostra a taxa de erro tipo I. Os pontos positivos estimam o poder.</p>
      </section>

      <section>
        <h2>6. Dados reais</h2>
        <div className="tabela">
          <table>
            <thead>
              <tr><th>Teste</th><th>Estatística</th><th>p-valor</th><th>Tamanho do efeito</th><th>Decisão a 5%</th></tr>
            </thead>
            <tbody>
              <tr><td>Welch</td><td>t = {numero.format(testesReais.welch.estatistica)}</td><td>{pValor.format(testesReais.welch.pValor)}</td><td>{numero.format(testesReais.diferencaHoras)} h (média A − B)</td><td>{decisao(testesReais.welch.pValor)}</td></tr>
              <tr><td>Mann-Whitney</td><td>U = {numero.format(testesReais.mannWhitney.estatistica)}</td><td>{pValor.format(testesReais.mannWhitney.pValor)}</td><td>{percentual.format(testesReais.probabilidadeA)} (superioridade de A)</td><td>{decisao(testesReais.mannWhitney.pValor)}</td></tr>
            </tbody>
          </table>
        </div>
        <p>{resumoReal}</p>
      </section>

      <section>
        <h2>7. Conclusão</h2>
        <p>Esperávamos que Mann-Whitney fosse menos sensível a extremos. A simulação foi coerente com essa expectativa: ele manteve taxas de erro tipo I mais próximas de 5% e detectou mais efeitos, embora ambos tenham apresentado baixo poder nos cenários avaliados.</p>
        <p>{recomendacao}</p>
      </section>

      <section id="apresentacao">
        <h2>Apresentação oral</h2>
        <ol className="perguntas">
          {([
            ['Qual é o cenário e o que dizem H₀ e H₁?', 'Comparamos o tempo até o merge de PRs do VS Code com revisão Copilot (A) e sem revisão automatizada identificada (B). H₀ de Welch diz que as médias são iguais, e H₁ diz que diferem. Para Mann-Whitney, H₀ diz que as distribuições são iguais, e o teste procura diferenças na posição relativa dos tempos.'],
            ['Os testes são unicaudais ou bicaudais?', 'Os dois são bicaudais. A pergunta admite que os PRs do grupo A levem mais ou menos tempo até o merge.'],
            ['Como os dados reais foram coletados e o que mostraram?', 'Buscamos PRs públicos do microsoft/vscode criados em setembro de 2025 e integrados antes de outubro. Conferimos o histórico de revisão e selecionamos 30 PRs por grupo. Os tempos exibem assimetria à direita, com alguns merges muito mais demorados.'],
            ['Como os dados reais definiram os parâmetros da simulação?', 'Como os tempos são positivos e assimétricos, usamos uma lognormal. Ajustamos μ e σ pela média e pelo desvio padrão dos logaritmos dos tempos. O G1 usa parâmetros por grupo, o cenário base usa os 60 PRs juntos e o de maior assimetria usa o ajuste do grupo A.'],
            ['O que os dois testes comparam?', 'Welch compara médias em horas e admite variâncias diferentes. Mann-Whitney usa os postos para avaliar se os tempos de um grupo tendem a ser maiores ou menores. Uma leitura como diferença de medianas exige condições adicionais sobre a forma das distribuições.'],
            ['O que o G2 mostra sob H₀ e onde fica a região de rejeição?', 'O histograma mostra os valores de t quando os dois grupos são simulados a partir da mesma distribuição. As regiões de rejeição ficam nas duas caudas da referência t de Student, com 2,5% de probabilidade em cada cauda ao nível de 5%.'],
            ['O que significa o p-valor no G2?', `No exemplo exibido, p = ${pValor.format(analise.welch.pValor)}. Se H₀ e o modelo do teste forem válidos, essa é a probabilidade de observar um |t| pelo menos tão grande quanto o do exemplo. A probabilidade de H₀ ser verdadeira é outra pergunta.`],
            ['O que seriam os erros tipo I e II? Qual seria mais grave?', 'Tipo I é apontar diferença quando ela não existe. Tipo II é deixar passar uma diferença que existe. Para uma decisão de mudar o processo de revisão, consideramos o tipo I mais grave, pois poderíamos agir com base em uma diferença inexistente.'],
            ['Qual teste ficou longe de 5% no G3?', erroTipoI],
            ['Qual teste teve mais poder no G4?', poder],
            ['Qual pressuposto foi desafiado e por que os testes reagiram de forma diferente?', 'Aumentamos a assimetria à direita com uma lognormal de cauda mais longa. Em amostras de 30, os extremos podem prejudicar a aproximação usada por Welch e aumentar a variabilidade das médias. Mann-Whitney usa a ordem das observações e é menos sensível à magnitude dos extremos.'],
            ['O que mudaria com α = 1%?', 'Com os mesmos sorteios, o G3 teria referência em 1% e as taxas de erro tipo I cairiam ou ficariam iguais. No G4, o poder também cairia ou ficaria igual, porque só os p-valores menores que 0,01 entrariam na contagem.'],
            ['A simulação confirmou a expectativa?', 'Sim. Mann-Whitney ficou mais perto de 5% sob H₀ e apresentou mais poder nos efeitos simulados. Os dois testes ainda tiveram poder baixo, coerente com a forte dispersão dos tempos e as amostras de 30 por grupo.'],
            ['Os testes concordaram nos dados reais? O efeito tem importância prática?', resumoReal],
            ['Qual teste recomendamos, quando mudaríamos de escolha e qual a principal limitação?', recomendacao],
          ] as const).map(([pergunta, resposta]) => (
            <li key={pergunta}><details><summary>{pergunta}</summary><p>{resposta}</p></details></li>
          ))}
        </ol>
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
