import { mannWhitney } from './mannWhitney';
import { criarGerador, estimarLognormal, gerarLognormal } from './simulacao';
import { validarInteiro } from './validacao';
import { welch } from './welch';

export interface ConfiguracaoSimulacao {
  semente: number;
  repeticoes: number;
  alfa: number;
}

export const CONFIGURACAO_PADRAO: ConfiguracaoSimulacao = {
  semente: 42, repeticoes: 5000, alfa: 0.05,
};

/** Contrato único para o dashboard e a exportação. Os testes recebem tempos em horas, sem log. */
export function executarSimulacao(
  reais: { A: readonly number[]; B: readonly number[] },
  opcoes: Partial<ConfiguracaoSimulacao> = {},
) {
  const configuracao = { ...CONFIGURACAO_PADRAO, ...opcoes };
  const { semente, repeticoes, alfa } = configuracao;
  validarInteiro(repeticoes, 1, 'Repetições');
  if (!Number.isFinite(alfa) || alfa <= 0 || alfa >= 1) {
    throw new RangeError('Alfa deve estar entre 0 e 1, exclusivamente');
  }
  const parametros = { A: estimarLognormal(reais.A), B: estimarLognormal(reais.B) };
  const conjunta = estimarLognormal([...reais.A, ...reais.B]);
  if (conjunta.sigma === 0) throw new RangeError('A base conjunta deve apresentar variação');
  const rng = criarGerador(semente);
  const simulados = {
    A: gerarLognormal(parametros.A, reais.A.length, rng),
    B: gerarLognormal(parametros.B, reais.B.length, rng),
  };
  const decidir = <T extends { pValor: number }>(resultado: T) => ({
    ...resultado, rejeitaH0: resultado.pValor < alfa,
  });
  const aplicar = (a: readonly number[], b: readonly number[]) => ({
    welch: decidir(welch(a, b)), mannWhitney: decidir(mannWhitney(a, b)),
  });
  // Um nulo comum: ambos os grupos são independentes e vêm da mesma lognormal.
  // As mesmas amostras de cada repetição alimentam os dois testes.
  const nula = Array.from({ length: repeticoes }, () => aplicar(
    gerarLognormal(conjunta, reais.A.length, rng),
    gerarLognormal(conjunta, reais.B.length, rng),
  ));
  const exemplo = aplicar(simulados.A, simulados.B);
  return {
    configuracao, reais, parametros, conjunta, simulados,
    ...exemplo,
    tNula: nula.map((r) => r.welch.estatistica),
    nula,
  };
}
