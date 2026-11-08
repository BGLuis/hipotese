import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lerPRs } from '../src/dados';
import { estimarLognormal } from '../src/estatistica/simulacao';
import { simularCenarioSprint02 } from '../src/estatistica/sprint02';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

async function main() {
  const prs = lerPRs(JSON.parse(await readFile(resolve(raiz, 'data/prs_reais.json'), 'utf8')));
  const parametros = estimarLognormal(prs.map((pr) => pr.tempoMergeH));
  const linhas = simularCenarioSprint02({ cenario: 'base', parametros });
  const saida = resolve(raiz, 'resultados/sprint02/base.json');
  await mkdir(dirname(saida), { recursive: true });
  await writeFile(saida, JSON.stringify(linhas, null, 2) + '\n');
  console.log('Parâmetros da lognormal comum:', parametros);
  console.log(`Cenário base: ${linhas.length} linhas gravadas em ${saida}`);
}

main().catch((erro: unknown) => {
  console.error(`Falha no cenário base: ${erro instanceof Error ? erro.message : String(erro)}`);
  process.exitCode = 1;
});
