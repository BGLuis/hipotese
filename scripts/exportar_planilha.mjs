import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const modules = process.env.CODEX_NODE_MODULES || path.join(os.homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const require = createRequire(path.join(modules, 'loader.cjs'));
const { Workbook, SpreadsheetFile } = require('@oai/artifact-tool');
const data = JSON.parse(await fs.readFile(path.join(root, 'data/prs_reais.json'), 'utf8'));
const workbook = Workbook.create();
const sheet = workbook.worksheets.add('PRs reais');
sheet.showGridLines = false;
const headers = ['PR', 'Repositório', 'URL do PR', 'Autor', 'Tipo autor', 'Criação (UTC)', 'Merge (UTC)', 'Grupo', 'Bot de revisão', 'Revisão bot (UTC)', 'Evidência / histórico', 'Tempo de merge (h)', 'Verificação'];
const fields = ['numero_pr','repositorio','url_pr','autor','tipo_autor','created_at','merged_at','grupo','nome_bot','data_revisao_bot','evidencia_revisao','tempo_merge_h','metodo_verificacao'];
sheet.getRange('A1:M1').values = [headers];
const values = data.map(row => fields.map((key, i) => {
  if ([5,6,9].includes(i)) return row[key] ? new Date(row[key]) : null;
  if ([0,11].includes(i)) return Number(row[key]);
  return row[key] || '';
}));
sheet.getRange(`A2:M${data.length+1}`).values = values;
sheet.getRange(`L2:L${data.length+1}`).formulas = data.map((_, i) => [`=(G${i+2}-F${i+2})*24`]);
const all = sheet.getRange(`A1:M${data.length+1}`);
all.format.font = {name:'Arial',size:10,color:'#172033'};
all.format.verticalAlignment = 'center';
all.format.rowHeight = 24;
sheet.getRange('A1:M1').format = {fill:'#243857',font:{name:'Arial',bold:true,color:'#FFFFFF',size:10},rowHeight:42,wrapText:true,horizontalAlignment:'center'};
const widths = [10,23,53,24,12,25,25,10,39,25,65,22,29];
widths.forEach((width, i) => sheet.getRangeByIndexes(0,i,data.length+1,1).format.columnWidth = width);
for (const col of ['F','G','J']) sheet.getRange(`${col}2:${col}${data.length+1}`).setNumberFormat('yyyy-mm-dd hh:mm:ss');
sheet.getRange(`L2:L${data.length+1}`).setNumberFormat('0.000');
sheet.tables.add(`A1:M${data.length+1}`,true,'PRsReais');
sheet.freezePanes.freezeRows(1);
sheet.freezePanes.freezeColumns(1);
sheet.getRange(`H2:H${data.length+1}`).conditionalFormats.add('containsText',{text:'A',format:{fill:'#E9EEF8'}});
sheet.getRange(`H2:H${data.length+1}`).conditionalFormats.add('containsText',{text:'B',format:{fill:'#EEF4EC'}});
workbook.recalculate();
const inspection = await workbook.inspect({kind:'table',range:'PRs reais!F1:M4',include:'values,formulas',tableMaxRows:4,tableMaxCols:8,maxChars:2200});
console.log(inspection.ndjson);
const errors = await workbook.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#NUM!',options:{useRegex:true,maxResults:20},maxChars:1000});
console.log(errors.ndjson);
for (let i = 0; i < data.length; i++) {
  const value = sheet.getRange(`L${i+2}`).values[0][0];
  if (typeof value !== 'number' || Math.abs(value - Number(data[i].tempo_merge_h)) > 1e-6) throw new Error(`Tempo divergente na linha ${i+2}: ${value}`);
}
await fs.mkdir(path.join(root,'tmp'),{recursive:true});
for (const [suffix, range] of [['dados','A1:H7'],['evidencias','I1:M7']]) {
  const preview = await workbook.render({sheetName:'PRs reais',range,scale:1,format:'png'});
  await fs.writeFile(path.join(root,'tmp',`planilha_${suffix}.png`),new Uint8Array(await preview.arrayBuffer()));
}
const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(path.join(root,'data/prs_reais.xlsx'));
console.log('Planilha exportada e tempos conferidos.');
