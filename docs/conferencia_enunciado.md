# Conferência com o enunciado do LAB04

Conferência em 04/11/2026 a partir do enunciado fornecido pelo grupo.

## Sprint 01 — 7 pontos

| Exigência | Estado da implementação local e publicada |
| --- | --- |
| Dados reais: cerca de 30 por grupo, com fonte e coleta | Base existente com 30 PRs em A e 30 em B; fonte e seleção descritas no cenário |
| Pergunta, H₀/H₁, distribuição, parâmetros e expectativa prévia | Presentes no cenário, documentação e dashboard |
| Código que gera os dados simulados com semente fixa | Gerador lognormal calibrado por grupo, padrão 42; comando `npm run simular` |
| Dois testes em um conjunto simulado e interpretação | Welch e Mann-Whitney, com estatística, p-valor, decisão e interpretação em texto |
| G1: histogramas reais × simulados por grupo | Presente no dashboard; intervalo dinâmico para incluir valores extremos |
| G2: distribuição sob H₀, rejeição sombreada e p-valor como área | Presente para Welch; caudas do p-valor sob a referência t e região de rejeição do mesmo teste |
| Textos curtos explicando os gráficos | Presentes junto a G1 e G2 |
| Links do dashboard, repositório e Projects no topo | Presentes |
| Executar com um comando documentado ou estar publicado | Publicado em https://arsenal.dev.br/hipotese/; comando da simulação no README |
| Integrante como assignee de issue, código commitado e referência à issue | A tarefa está atribuída a `alencarleandro`; esta entrega é versionada com referência à issue #1. A atualização do Projects e o fechamento da issue seguem o fluxo de revisão do grupo |

O identificador correto para referenciar esta entrega é **#1**: o número da issue no GitHub. O título dela começa com “#2 - Implementar...”, mas isso não muda seu identificador. A mensagem do commit desta implementação inclui `refs #1`. O fechamento da issue deve seguir o fluxo de revisão do grupo.

Os 5.000 pares sob H₀ servem à visualização inicial do G2. Eles não foram apresentados como cumprimento das exigências de 10.000 repetições da Sprint 02. A referência t de Student é aproximada e usa os graus de liberdade do exemplo; sua área não deve ser confundida com a área do histograma empírico lognormal.

## Sprint 02 — 7 pontos: ainda não implementada

- Q1: 10.000 conjuntos com H₀ verdadeira, proporção de rejeições dos dois testes.
- Q2: poder para pelo menos cinco valores de efeito, começando em zero.
- Q3: repetir Q1 e Q2 em uma situação adicional que desafie os pressupostos paramétricos.
- G3: erro tipo I dos dois testes por situação, com linha de referência em 5%.
- G4: curvas de poder dos dois testes por tamanho do efeito e situação.
- Manter cores consistentes por teste e explicar os resultados junto aos gráficos.

## Entrega final — 6 pontos: ainda não concluída

O dashboard final deve reunir as sete seções do enunciado, incluindo a tabela dos testes nos **dados reais**, com tamanho do efeito e conclusão, e uma recomendação sustentada pelas simulações. Também falta preparar a apresentação de até sete minutos, dividindo as quinze perguntas e garantindo pelo menos quatro por integrante. Os documentos desta pasta são apoio ao desenvolvimento; não substituem o dashboard exigido como entrega final.

## Verificação desta atualização

48 testes aprovados e compilação concluída. G1, G2, interpretação do exemplo e links do topo conferidos no endereço público. A conferência técnica não substitui a avaliação do professor ou a revisão do grupo.
