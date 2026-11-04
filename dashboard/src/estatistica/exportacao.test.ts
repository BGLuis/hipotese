import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { expect, it } from 'vitest';

it('exporta arquivos reproduzíveis e falha sem saída para argumentos inválidos', () => {
  const pasta = mkdtempSync(resolve(tmpdir(), 'lab04-simulacao-'));
  const rodar = (opcoes: string[]) => spawnSync(process.execPath,
    ['--import', 'tsx', 'scripts/simular.ts', '--saida', pasta, ...opcoes], { encoding: 'utf8' });
  try {
    const invalido = rodar(['--semente=-1']);
    expect(invalido.status).toBe(1);
    expect(invalido.stderr).toContain('Semente');
    expect(readdirSync(pasta)).toEqual([]);
    const argumentos = ['--semente', '42', '--repeticoes', '12'];
    const primeira = rodar(argumentos);
    expect(primeira.status, primeira.stderr).toBe(0);
    const arquivos = readdirSync(pasta);
    expect(arquivos.sort()).toEqual(['dados_simulados.csv', 'distribuicao_nula.csv', 'resumo.json']);
    const conteudos = arquivos.map((nome) => readFileSync(resolve(pasta, nome), 'utf8'));
    expect(conteudos[0].trim().split('\n')).toHaveLength(61);
    expect(conteudos[1].trim().split('\n')).toHaveLength(13);
    const resumo = JSON.parse(conteudos[2]);
    expect(resumo.exemplo.welch.pValor).toBeCloseTo(0.048443001071724244, 10);
    expect(resumo.exemplo.mannWhitney.estatistica).toBe(584);
    expect(resumo.entrada.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(rodar(argumentos).status).toBe(0);
    expect(arquivos.map((nome) => readFileSync(resolve(pasta, nome), 'utf8'))).toEqual(conteudos);
  } finally {
    rmSync(pasta, { recursive: true, force: true });
  }
});
