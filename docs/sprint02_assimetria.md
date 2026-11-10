# Sprint 2: cenário alternativo de assimetria (Q3)

Na pasta `dashboard`, com Node.js 24 ou superior:

```sh
npm ci
npm run simular:alternativo
```

O comando também pode ser executado pelo atalho `npm run simular:assimetria`. Ele lê `data/prs_reais.json`, calibra o modelo lognormal com os 30 tempos reais do Grupo A (PRs com revisão Copilot), utiliza a semente 42 e grava `resultados/sprint02/assimetria.json`. Não consulta o GitHub nem altera as saídas da Sprint 1 ou do cenário base. A saída possui uma linha por teste e efeito, com os campos `cenario`, `teste`, `tamanho_efeito` e `taxa_rejeicao`. A taxa é uma fração: `0.0442` corresponde a 4,42% no dashboard.

## Como a simulação funciona

O cenário alternativo responde à pergunta **Q3** do enunciado do LAB04: repetir o experimento de erro tipo I (Q1) e poder (Q2) em uma situação que desafie ainda mais os pressupostos dos testes paramétricos.

Para isso, utiliza-se a distribuição lognormal ajustada aos 30 tempos empíricos do **Grupo A** (PRs com revisão do Copilot). Na escala do logaritmo natural, os parâmetros estimados são média amostral μ ≈ 0,855746 e desvio padrão amostral σ ≈ 2,668453 (calculado com divisor $n - 1$).

### Por que este cenário desafia o teste paramétrico

Em uma distribuição lognormal, o coeficiente de assimetria de Fisher-Pearson depende exclusivamente de σ:

$$\gamma_1 = (e^{\sigma^2} + 2)\sqrt{e^{\sigma^2} - 1}$$

- No **cenário base** (calibrado nos 60 PRs conjuntos, com σ ≈ 2,2103), a assimetria teórica já era alta ($\gamma_1 \approx 1.500$).
- No **cenário de assimetria** (calibrado no Grupo A, com σ ≈ 2,6685), a assimetria teórica explode para $\gamma_1 \approx 43.500$, com cauda à direita extremamente pesada e alta probabilidade de observações com ordens de grandeza muito superiores à mediana.

O teste t de Welch pressupõe normalidade ou proximidade da normalidade das médias amostrais. Sob $n = 30$, observações extremas na cauda inflacionam drasticamente a variância amostral $s^2$, que compõe o denominador da estatística $t = (\bar{X}_A - \bar{X}_B) / \sqrt{s_A^2/n_A + s_B^2/n_B}$. Isso comprime a estatística $t$ em direção a zero, reduzindo severamente o poder do teste de Welch e deflacionando o erro tipo I muito abaixo do nível nominal de 5%.

Em contrapartida, o teste não-paramétrico de Mann-Whitney opera sobre postos ordinais: a magnitude extrema de um outlier não distorce a ordenação dos postos além de posicioná-lo no topo, conferindo robustez natural a distribuições altamente assimétricas.

### Procedimento de simulação

- **Q1 (Erro Tipo I sob H₀):** em cada uma de 10.000 repetições, são geradas duas amostras independentes de 30 tempos sorteados da mesma lognormal calibrada ($\mu_A, \sigma_A$). Sob H₀, as médias populacionais e as distribuições são idênticas.
- **Q2 (Poder sob H₁):** para cada efeito de 10%, 20%, 40% e 60%, são gerados outros 10.000 pares de amostras. Apenas os tempos do grupo A são multiplicados pelo fator $1 + \text{efeito}/100$; o grupo B permanece na escala de referência. O efeito zero é o mesmo resultado obtido em Q1.

Ambos os testes recebem exatamente os mesmos pares em cada repetição e adotam nível de significância bicaudal de $\alpha = 0{,}05$. A taxa de rejeição estimada é o número de repetições com $p < 0{,}05$ dividido por 10.000.

## Resultado

| Aumento simulado em A | Welch | Mann-Whitney |
| ---: | ---: | ---: |
| 0% (Erro Tipo I) | 1,39% | 4,42% |
| 10% (Poder) | 1,28% | 5,02% |
| 20% (Poder) | 1,22% | 5,46% |
| 40% (Poder) | 1,47% | 7,57% |
| 60% (Poder) | 2,10% | 9,92% |

## Comparação: Cenário Base × Cenário de Assimetria

Comparando com o cenário base (`resultados/sprint02/base.json`):

1. **Erro Tipo I sob H₀ (efeito 0%):**
   - **Mann-Whitney** manteve taxa de rejeição empírica de **4,42%**, muito próxima do nível nominal de 5%. Sob a mesma semente PRNG, os postos relativos sob uma transformação de escala preservam o mesmo ordenamento, ilustrando a estabilidade do teste não-paramétrico.
   - **Welch** tornou-se ainda mais ultraconservador: sua taxa de rejeição sob H₀ caiu de **1,86%** no cenário base para apenas **1,39%** no cenário de assimetria (muito abaixo do nominal de 5%).

2. **Curva de Poder (efeitos positivos de 10% a 60%):**
   - No efeito máximo de 60%, o poder estimado de **Welch** caiu de **3,24%** no base para **2,10%** no cenário alternativo. Essa taxa de detecção é inferior até mesmo ao nível de significância nominal de 5%, comprovando o colapso do teste paramétrico quando confrontado com assimetria extrema e variância inflacionada por caudas longas.
   - **Mann-Whitney** manteve capacidade de detectar efeitos sistematicamente superior à de Welch em todos os patamares, atingindo **9,92%** de poder com 60% de aumento (embora a grande dispersão global reduza o poder absoluto de ambos os testes).

Esses resultados fornecem a fundamentação empírica para os gráficos G3 e G4 a serem integrados no dashboard (Sprint 2 / Issue #5).
