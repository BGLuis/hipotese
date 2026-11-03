import type { Conferencia, Dados, Grupo, PR, ResumoColeta } from './tipos';

export const PRS_POR_GRUPO = 30;

type Bruto = Record<string, unknown>;

function texto(obj: Bruto, campo: string): string {
  const valor = obj[campo];
  if (typeof valor !== 'string' || valor === '') throw new Error(`Campo "${campo}" ausente ou inválido`);
  return valor;
}

export function lerPRs(bruto: unknown): PR[] {
  if (!Array.isArray(bruto)) throw new Error('prs_reais.json deve ser uma lista');
  const prs = bruto.map((item: Bruto): PR => {
    const grupo = texto(item, 'grupo');
    if (grupo !== 'A' && grupo !== 'B') throw new Error(`Grupo desconhecido: ${grupo}`);
    const tempoMergeH = Number(texto(item, 'tempo_merge_h'));
    if (!Number.isFinite(tempoMergeH) || tempoMergeH <= 0) {
      throw new Error(`tempo_merge_h inválido no PR ${String(item.numero_pr)}`);
    }
    return {
      numero: texto(item, 'numero_pr'),
      url: texto(item, 'url_pr'),
      autor: texto(item, 'autor'),
      grupo,
      criadoEm: texto(item, 'created_at'),
      integradoEm: texto(item, 'merged_at'),
      tempoMergeH,
    };
  });
  for (const grupo of ['A', 'B'] as const) {
    const total = prs.filter((p) => p.grupo === grupo).length;
    if (total !== PRS_POR_GRUPO) {
      throw new Error(`Grupo ${grupo} tem ${total} PRs; esperado ${PRS_POR_GRUPO}`);
    }
  }
  return prs;
}

export function lerResumo(bruto: Bruto): ResumoColeta {
  const selecionados = bruto.selected as Record<Grupo, number>;
  const config = bruto.config as Bruto;
  return {
    coletadoEmUtc: texto(bruto, 'collected_at_utc'),
    repositorio: texto(config, 'repository'),
    selecionados: { A: selecionados.A, B: selecionados.B },
  };
}

export function lerConferencias(bruto: unknown): Conferencia[] {
  if (!Array.isArray(bruto)) throw new Error('conferencia_links.json deve ser uma lista');
  return bruto.map((item: Bruto) => ({
    numero: texto(item, 'numero_pr'),
    url: texto(item, 'url'),
    grupoEsperado: texto(item, 'grupo_esperado'),
    grupoObservado: texto(item, 'grupo_observado'),
    confere: item.confere === true,
  }));
}

async function buscarJson(base: string, arquivo: string): Promise<unknown> {
  const resposta = await fetch(`${base}/${arquivo}`);
  if (!resposta.ok) throw new Error(`Falha ao carregar ${arquivo}: HTTP ${resposta.status}`);
  return resposta.json();
}

export async function carregarDados(base: string): Promise<Dados> {
  const [prs, resumo, conferencias] = await Promise.all([
    buscarJson(base, 'prs_reais.json'),
    buscarJson(base, 'resumo_coleta.json'),
    buscarJson(base, 'conferencia_links.json'),
  ]);
  return {
    prs: lerPRs(prs),
    resumo: lerResumo(resumo as Bruto),
    conferencias: lerConferencias(conferencias),
  };
}

export function temposDoGrupo(prs: readonly PR[], grupo: Grupo): number[] {
  return prs.filter((p) => p.grupo === grupo).map((p) => p.tempoMergeH);
}
