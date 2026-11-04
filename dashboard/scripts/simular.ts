import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { lerPRs, temposDoGrupo } from '../src/dados';
import { CONFIGURACAO_PADRAO, executarSimulacao } from '../src/estatistica/analise';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

async function main() {
  const { values } = parseArgs({ options: {
    semente: { type: 'string', default: String(CONFIGURACAO_PADRAO.semente) },
    repeticoes: { type: 'string', default: String(CONFIGURACAO_PADRAO.repeticoes) },
    alfa: { type: 'string', default: String(CONFIGURACAO_PADRAO.alfa) },
    saida: { type: 'string', default: resolve(raiz, 'resultados/simulacao') },
    ajuda: { type: 'boolean', default: false },
  } });
  if (values.ajuda) {
    console.log('npm run simular -- [--semente 42] [--repeticoes 5000] [--alfa 0.05] [--saida caminho]');
    return;
  }
  for (const campo of ['semente', 'repeticoes', 'alfa'] as const) {
    if (!values[campo].trim()) throw new Error(`A opção --${campo} não pode ser vazia`);
  }
  const conteudo = await readFile(resolve(raiz, 'data/prs_reais.json'));
  const prs = lerPRs(JSON.parse(conteudo.toString('utf8')));
  const analise = executarSimulacao({ A: temposDoGrupo(prs, 'A'), B: temposDoGrupo(prs, 'B') }, {
    semente: Number(values.semente), repeticoes: Number(values.repeticoes), alfa: Number(values.alfa),
  });
  const { configuracao, parametros, conjunta, simulados, nula, welch, mannWhitney } = analise;
  const relatorio = {
    versao: 1,
    entrada: { arquivo: 'data/prs_reais.json', sha256: createHash('sha256').update(conteudo).digest('hex') },
    configuracao,
    modelo: {
      distribuicao: 'lognormal', unidade: 'horas', gerador: 'mulberry32 + Box-Muller',
      ajuste: 'média e desvio padrão amostral dos logaritmos naturais',
      parametros, conjunta,
      nA: simulados.A.length, nB: simulados.B.length,
      h0: 'Grupos independentes da mesma lognormal ajustada à base conjunta',
    },
    exemplo: { welch, mannWhitney },
    interpretacao: 'Exemplo simulado; não demonstra causalidade nem superioridade de um teste. Não rejeitar H0 não prova igualdade.',
    metodos: {
      welch: 'Bicaudal, variâncias desiguais, graus de liberdade de Welch-Satterthwaite',
      mannWhitney: 'Bicaudal, aproximação normal, correções de empates e continuidade; U do grupo A',
    },
  };
  // Sem data de execução: mesmos dados e opções produzem arquivos idênticos.
  const amostras = ['grupo,indice,tempo_merge_h'];
  for (const grupo of ['A', 'B'] as const) {
    simulados[grupo].forEach((v, i) => amostras.push(`${grupo},${i + 1},${v}`));
  }
  const nulas = ['repeticao,welch_t,welch_gl,welch_p,welch_rejeita_h0,mann_whitney_u,mann_whitney_p,mann_whitney_rejeita_h0'];
  nula.forEach((r, i) => nulas.push([
    i + 1, r.welch.estatistica, r.welch.grausLiberdade, r.welch.pValor, r.welch.rejeitaH0,
    r.mannWhitney.estatistica, r.mannWhitney.pValor, r.mannWhitney.rejeitaH0,
  ].join(',')));
  const saida = resolve(values.saida);
  await mkdir(saida, { recursive: true });
  await writeFile(resolve(saida, 'resumo.json'), JSON.stringify(relatorio, null, 2) + '\n');
  await writeFile(resolve(saida, 'dados_simulados.csv'), amostras.join('\n') + '\n');
  await writeFile(resolve(saida, 'distribuicao_nula.csv'), nulas.join('\n') + '\n');
  console.log(`Simulação concluída: ${simulados.A.length} observações em A e ${simulados.B.length} em B.`);
  console.table({ Welch: welch, 'Mann-Whitney': mannWhitney });
  console.log(`Arquivos gravados em ${saida}`);
}

main().catch((erro: unknown) => {
  console.error(`Falha na simulação: ${erro instanceof Error ? erro.message : String(erro)}`);
  process.exitCode = 1;
});
