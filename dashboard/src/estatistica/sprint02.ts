import { mannWhitney } from './mannWhitney';
import { criarGerador, gerarLognormal, type ParametrosLognormal } from './simulacao';
import { validarInteiro } from './validacao';
import { welch } from './welch';

export const EFEITOS_SPRINT02 = [0, 10, 20, 40, 60] as const;
export const CONFIGURACAO_SPRINT02 = { semente: 42, repeticoes: 10_000, alfa: 0.05, n: 30 } as const;

export interface ConfiguracaoCenarioSprint02 {
  cenario: 'base' | 'assimetria';
  parametros: ParametrosLognormal;
  semente?: number;
  repeticoes?: number;
  alfa?: number;
}

export interface LinhaSprint02 {
  cenario: ConfiguracaoCenarioSprint02['cenario'];
  teste: 'welch' | 'mann_whitney';
  tamanho_efeito: (typeof EFEITOS_SPRINT02)[number];
  taxa_rejeicao: number;
}

export function simularCenarioSprint02({
  cenario,
  parametros,
  semente = CONFIGURACAO_SPRINT02.semente,
  repeticoes = CONFIGURACAO_SPRINT02.repeticoes,
  alfa = CONFIGURACAO_SPRINT02.alfa,
}: ConfiguracaoCenarioSprint02): LinhaSprint02[] {
  validarInteiro(repeticoes, 1, 'Repetições');
  if (!Number.isFinite(alfa) || alfa <= 0 || alfa >= 1) {
    throw new RangeError('Alfa deve estar entre 0 e 1, exclusivamente');
  }
  if (!Number.isFinite(parametros.mu) || !Number.isFinite(parametros.sigma) || parametros.sigma <= 0) {
    throw new RangeError('O cenário exige mu finito e sigma positivo e finito');
  }
  const rng = criarGerador(semente);
  const n = CONFIGURACAO_SPRINT02.n;
  return EFEITOS_SPRINT02.flatMap((tamanho_efeito): LinhaSprint02[] => {
    const fator = 1 + tamanho_efeito / 100;
    let rejeicoesWelch = 0;
    let rejeicoesMannWhitney = 0;
    for (let i = 0; i < repeticoes; i++) {
      const a = gerarLognormal(parametros, n, rng).map((tempo) => tempo * fator);
      const b = gerarLognormal(parametros, n, rng);
      if (welch(a, b).pValor < alfa) rejeicoesWelch++;
      if (mannWhitney(a, b).pValor < alfa) rejeicoesMannWhitney++;
    }
    return [
      { cenario, teste: 'welch', tamanho_efeito, taxa_rejeicao: rejeicoesWelch / repeticoes },
      { cenario, teste: 'mann_whitney', tamanho_efeito, taxa_rejeicao: rejeicoesMannWhitney / repeticoes },
    ];
  });
}
