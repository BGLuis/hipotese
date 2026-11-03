import { cp, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const origem = fileURLToPath(new URL('../../data/', import.meta.url));
const destino = fileURLToPath(new URL('../public/data/', import.meta.url));
const arquivos = ['prs_reais.json', 'resumo_coleta.json', 'conferencia_links.json'];

await mkdir(destino, { recursive: true });
for (const arquivo of arquivos) await cp(origem + arquivo, destino + arquivo);
