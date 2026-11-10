import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lerPRs } from '../src/dados';
import { estimarLognormal } from '../src/estatistica/simulacao';
import { simularCenarioSprint02 } from '../src/estatistica/sprint02';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

async function main() {
  const prs = lerPRs(JSON.parse(await readFile(resolve(raiz, 'data/prs_reais.json'), 'utf8')));
  const temposGrupoA = prs.filter((pr) => pr.grupo === 'A').map((pr) => pr.tempoMergeH);
  const parametros = estimarLognormal(temposGrupoA);
  const linhas = simularCenarioSprint02({ cenario: 'assimetria', parametros });
  const saida = resolve(raiz, 'resultados/sprint02/assimetria.json');
  await mkdir(dirname(saida), { recursive: true });
  await writeFile(saida, JSON.stringify(linhas, null, 2) + '\n');
  console.log('Parâmetros da lognormal do cenário de assimetria (Grupo A):', parametros);
  console.log(`Cenário de assimetria: ${linhas.length} linhas gravadas em ${saida}`);
}

main().catch((erro: unknown) => {
  console.error(`Falha no cenário alternativo: ${erro instanceof Error ? erro.message : String(erro)}`);
  process.exitCode = 1;
});
