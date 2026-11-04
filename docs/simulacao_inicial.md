# Simulação inicial — Sprint 01

Entrega da [tarefa #1](https://github.com/BGLuis/hipotese/issues/1), atribuída a `alencarleandro`: gerar dados simulados e aplicar t de Welch e Mann-Whitney. O [Projects laboratorio](https://github.com/users/BGLuis/projects/1) separa essa atividade da coleta e cenário (`IsabellaLDias`) e do dashboard G1/G2 (`BGLuis`).

## Executar

Na pasta `dashboard`, com Node.js 24 ou superior:

```sh
npm ci
npm run simular
```

O comando lê `data/prs_reais.json` localmente, sem repetir a coleta, e grava em `resultados/simulacao/`:

| Arquivo | Conteúdo |
| --- | --- |
| `dados_simulados.csv` | 60 tempos em horas, com grupo A/B e índice da observação simulada |
| `resumo.json` | Configuração, parâmetros ajustados, hash SHA-256 da entrada, estatísticas, p-valores e decisões do exemplo |
| `distribuicao_nula.csv` | 5.000 repetições sob H₀, com estatísticas, p-valores e decisões dos dois testes |

É possível alterar a configuração:

```sh
npm run simular -- --semente 123 --repeticoes 1000 --alfa 0.05 --saida ../resultados/exemplo_123
```

O caminho de saída personalizado é relativo à pasta de execução. A saída padrão é sempre relativa à raiz do repositório. A semente deve ser um inteiro entre 0 e 4.294.967.295; as repetições, um inteiro positivo; e alfa, um número entre zero e um, sem incluir os extremos. Argumentos inválidos encerram o programa com código 1 antes de gravar os arquivos.

## Modelo e reprodução

Os grupos vêm da base real: 30 PRs com revisão Copilot (A) e 30 sem revisão automatizada identificada (B). Para cada grupo, calculamos `mu = média(log(tempo_merge_h))` e `sigma = desvio padrão amostral(log(tempo_merge_h))`, com divisor `n - 1`. Geramos `exp(mu + sigma * Z)`, onde Z é normal padrão obtida por Box-Muller e o gerador uniforme é mulberry32.

A lognormal é um modelo inicial para tempos positivos com assimetria à direita. O ajuste não comprova aderência à distribuição. Nenhum extremo é removido, arredondado ou truncado. Os testes recebem os tempos em horas; o log é usado no ajuste e na visualização, não para transformar a variável testada.

A configuração padrão é semente 42, alfa 0,05 e 5.000 repetições. O mesmo fluxo aleatório gera primeiro A e B para o exemplo G1 e depois os pares sob H₀ para G2. Reexecutar com a mesma base e configuração produz os mesmos arquivos, sem carimbo de data variável. O SHA-256 registra qual entrada foi usada. Mudar o número de repetições não muda a amostra do exemplo.

O módulo `dashboard/src/estatistica/analise.ts` é compartilhado entre o painel e o comando de exportação. A integração preserva as amostras e a sequência de t de Welch que o dashboard já usava.

## Dois testes bicaudais

- **Welch:** H₀ de igualdade de médias; calcula t e graus de liberdade de Welch-Satterthwaite, sem supor variâncias iguais.
- **Mann-Whitney:** H₀ de distribuições iguais; calcula U do grupo A e p-valor por aproximação normal, com postos médios nos empates e correção de continuidade. Interpretar como teste de medianas exige hipóteses adicionais sobre as formas das distribuições.

A decisão é rejeitar H₀ quando `p < alfa`. Não rejeitar H₀ não comprova igualdade. Amostras insuficientes ou não finitas são rejeitadas; o ajuste também rejeita tempos não positivos. Welch com variância total zero informa erro, pois a estatística fica indefinida. Mann-Whitney com todos os valores iguais retorna p = 1.

Para a distribuição nula, ajustamos uma única lognormal aos 60 tempos reunidos e geramos duas amostras independentes desse mesmo modelo em cada repetição. Assim, a igualdade de distribuições e a igualdade de médias valem simultaneamente. Os dois testes recebem o mesmo par de amostras em cada repetição. Esse modelo não representa um nulo de médias iguais com distribuições diferentes.

## Resultado reproduzível do exemplo

Para a base incluída no repositório e a configuração padrão:

| Teste | Estatística | Graus de liberdade | p-valor | Decisão a 5% |
| --- | ---: | ---: | ---: | --- |
| Welch | 2,060217 | 29,024018 | 0,048443 | Rejeita H₀ |
| Mann-Whitney | 584 | — | 0,048413 | Rejeita H₀ |

Esses resultados pertencem a **uma amostra simulada**, calibrada separadamente por grupo. Não são p-valores dos dados reais, nem evidência de efeito causal do Copilot. A proximidade dos p-valores não demonstra equivalência ou superioridade dos testes. A avaliação sistemática de erro tipo I e poder com 10.000 simulações continua como atividade da Sprint 02.

## Validação

```sh
npm test
npm run build
```

Os testes incluem referências numéricas do SciPy já presentes no projeto, reprodução com semente fixa, integração com a base real, preservação do G2, entradas inválidas e exportação pelo comando de terminal.

Referências: [Welch em scipy.stats.ttest_ind](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.ttest_ind.html) e [Mann-Whitney no SciPy](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.mannwhitneyu.html).
