export type Grupo = 'A' | 'B';

export interface PR {
  numero: string;
  url: string;
  autor: string;
  grupo: Grupo;
  criadoEm: string;
  integradoEm: string;
  tempoMergeH: number;
}

export interface ResumoColeta {
  coletadoEmUtc: string;
  repositorio: string;
  selecionados: Record<Grupo, number>;
}

export interface Conferencia {
  numero: string;
  url: string;
  grupoEsperado: string;
  grupoObservado: string;
  confere: boolean;
}

export interface Dados {
  prs: PR[];
  resumo: ResumoColeta;
  conferencias: Conferencia[];
}
