# Sprint 2: cenário base (Q1 e Q2)

Na pasta `dashboard`, com Node.js 24 ou superior:

```sh
npm ci
npm run simular:base
```

O comando lê `data/prs_reais.json`, usa semente 42 e grava `resultados/sprint02/base.json`. Não consulta o GitHub nem altera as saídas da Sprint 1. A saída tem uma linha por teste e efeito, com os campos `cenario`, `teste`, `tamanho_efeito` e `taxa_rejeicao`. A taxa é uma fração: `0.0442` corresponde a 4,42% no dashboard.

## Como a simulação funciona

O modelo de referência é uma única lognormal ajustada aos 60 tempos reais reunidos, em horas. Na escala do logaritmo natural, a média amostral é μ ≈ 0,071486 e o desvio padrão amostral é σ ≈ 2,210336. Os testes recebem tempos em horas. O ajuste é usado para calibrar a simulação e não pressupõe que os tempos reais sigam exatamente essa distribuição.

- **Q1:** em cada uma de 10.000 repetições, são gerados dois grupos independentes de 30 tempos da mesma lognormal. Assim, as médias e as distribuições são iguais sob H₀.
- **Q2:** para cada efeito de 10%, 20%, 40% e 60%, são gerados outros 10.000 pares. Somente os tempos de A são multiplicados por `1 + efeito/100`; B permanece na escala de referência. Por exemplo, com efeito 20, um tempo de 10 h em A se torna 12 h. O ponto de efeito zero é o resultado de Q1, calculado uma única vez e usado nos dois gráficos.

Welch e Mann-Whitney são bicaudais e recebem o mesmo par em cada repetição. A taxa estimada é a quantidade de p-valores estritamente menores que 0,05, dividida por 10.000. No zero ela estima o erro tipo I; nos demais efeitos, o poder.

## Resultado

| Aumento simulado em A | Welch | Mann-Whitney |
| ---: | ---: | ---: |
| 0% | 1,86% | 4,42% |
| 10% | 1,72% | 5,16% |
| 20% | 1,78% | 5,79% |
| 40% | 2,35% | 8,76% |
| 60% | 3,24% | 12,20% |

No zero, Welch ficou abaixo do nível nominal de 5%, enquanto Mann-Whitney ficou mais próximo de 5%. Mann-Whitney teve maior poder estimado em todos os efeitos positivos, mas os dois testes detectaram poucos efeitos mesmo no aumento de 60%. O modelo base já tem forte assimetria à direita, com grande variabilidade nos tempos, e as taxas estimadas têm variação de Monte Carlo. Esses resultados descrevem apenas esta simulação; não medem o efeito real do Copilot nos PRs.

## Rotina compartilhada com Q3

O módulo `dashboard/src/estatistica/sprint02.ts` exporta `simularCenarioSprint02({ cenario, parametros, semente?, repeticoes?, alfa? })`. Para o cenário alternativo, passe `cenario: 'assimetria'` e os parâmetros lognormais definidos pela Pessoa 2. Os padrões são semente 42, 10.000 repetições por efeito e alfa de 0,05. A rotina mantém 30 tempos por grupo, a mesma escala de efeito e o mesmo formato de saída.
