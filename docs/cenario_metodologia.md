# Cenário e metodologia

## Tema e contexto

Análise comparativa do tempo de integração de Pull Requests com e sem revisão automatizada de código em um projeto de código aberto. O tempo até o merge descreve a demora entre a proposta de uma alteração e sua integração e é relevante para o fluxo de desenvolvimento de software.

## Pergunta e objetivo

Existe diferença no tempo até o merge entre PRs com revisão automatizada de código identificada antes da integração e PRs sem revisão automatizada identificada no histórico público?

O objetivo é descrever essa associação e fornecer dados reais rastreáveis para calibrar as futuras simulações do LAB04, par P1: t de Welch versus Mann-Whitney. Esta etapa não calcula p-valores, não executa simulações e não apresenta uma recomendação empírica sobre qual teste é superior.

## Grupos e variável

- Grupo A: PR de conta pessoal, integrado, com revisão formal do aplicativo `copilot-pull-request-reviewer` antes do merge. Neste estudo, a revisão automatizada é operacionalizada especificamente pelo GitHub Copilot. Outros aplicativos não são agrupados silenciosamente com ele.
- Grupo B: PR elegível sem revisão automatizada de código identificada no histórico público consultado, por API ou página sem paginação pendente. A presença de bot de CI, cobertura, cópia de PR ou atualização de dependências não define o grupo A.
- Casos com bot ou conteúdo ambíguo são excluídos e registrados. Um resumo descritivo ou aviso de revisão pulada, sozinho, não comprova revisão efetiva.
- Variável resposta: `tempo_merge_h = (merged_at - created_at).total_seconds() / 3600`, em horas corridas, com datas em UTC. Não usar `closed_at` como substituto de `merged_at`.

## Fonte, recorte e seleção

Fonte primária: [microsoft/vscode](https://github.com/microsoft/vscode), projeto público do editor Visual Studio Code. Há histórico público de integração, revisão humana e revisão pelo aplicativo GitHub Copilot. O mesmo projeto fornece ambos os grupos, evitando confundir completamente presença de bot com origem do repositório.

O recorte fixado no arquivo `coleta_config.json` contém PRs criados entre 01/09/2025 às 00:00:00 UTC (inclusive) e 01/10/2025 às 00:00:00 UTC (exclusive), com merge anterior a esse limite final. A coleta é executada em 02/11/2026. PRs abertos e PRs fechados sem merge não integram a população elegível.

A moldura de candidatos é a união das primeiras 100 respostas de cada uma de duas buscas REST, ordenadas por criação: com interação do revisor Copilot e sem essa interação. A busca apenas localiza candidatos; a classificação final depende da evidência de revisão e das datas. Essa moldura limitada de 200 candidatos é uma amostra de conveniência por estratos do índice de busca, e não um censo do mês. Na união deduplicada, percorre-se a ordem crescente de criação, com desempate por número, até selecionar 30 elegíveis por grupo. Após preencher B, os demais candidatos do estrato sem Copilot deixam de ser examinados. Como A exige Copilot, esse estrato não fornece integrantes de A. Os tempos não são usados para ordenar a seleção ou remover observações extremas.

Os tamanhos efetivos, as exclusões e a data de extração estão em `data/resumo_coleta.json` e `docs/registro_coleta.md`.

## Hipóteses e interpretação futura

Os testes serão bicaudais, com nível de significância planejado de 5%, porque a pergunta admite aumento ou redução do tempo de merge.

**t de Welch**: H0: a média populacional do tempo de merge no grupo A é igual à do grupo B. H1: essas médias diferem. O teste compara médias de amostras independentes e não exige variâncias iguais.

**Mann-Whitney**: H0 clássica: as distribuições populacionais dos tempos de merge são iguais. A alternativa bicaudal procura diferenças na posição relativa das observações pelos postos. O teste não é um detector universal de qualquer diferença de forma; distribuições distintas podem produzir a mesma probabilidade de superioridade. Sua leitura como comparação de medianas exige condições adicionais, como formas semelhantes e diferença de localização.

Os dois testes respondem a aspectos diferentes da pergunta ampla. Igualdade de médias não implica igualdade de distribuições. Na etapa de simulação será necessário explicitar o modelo que permite comparar o controle de erro tipo I sob um nulo comum.

## Expectativa anterior à simulação

Tempos de merge podem apresentar assimetria à direita e valores extremos. Espera-se que Mann-Whitney seja menos sensível à magnitude de extremos e possa apresentar vantagens em alguns desses cenários. Welch permanece relevante quando a pergunta substantiva é sobre médias. Essa expectativa é qualitativa: esta etapa não demonstra maior poder ou melhor controle de erro de nenhum teste.

## Limitações

A coleta é observacional e não demonstra que bots causam mudanças no tempo de merge. Porte e complexidade do PR, autor, disponibilidade dos revisores, caminhos alterados, tipo de mudança e práticas de manutenção podem confundir a associação. A seleção por quotas não é aleatória: A concentra criações de 05 a 17/09 e B de 01 a 02/09, um desequilíbrio temporal importante.

Selecionar apenas PRs já integrados até uma data fixa favorece mudanças que terminam mais rapidamente e exclui PRs demorados ainda abertos. A separação entre PRs com e sem Copilot pode refletir a adoção da ferramenta durante o mês; diferenças temporais devem ser examinadas antes de qualquer interpretação. PRs do mesmo autor ou revisados pela mesma equipe podem ser dependentes. A categoria `User` na API e a ausência de indicadores de automação são critérios operacionais de autoria pessoal, sem prova de que todo o trabalho foi feito por uma pessoa sem ferramentas de IA.

O grupo B significa ausência de revisão automatizada identificada no histórico público consultado. Revisões privadas, eventos removidos, edições e ferramentas que não deixam comentários podem não ser observados. Conteúdo de comentários editáveis é o disponível na data de coleta, e sua presença inicial não prova que toda edição já existia antes do merge. Os resultados não devem ser generalizados para outros projetos ou para todos os tipos de revisão.

## Próxima etapa do grupo

Revisar manualmente uma amostra dos links de ambos os grupos. Depois, usar os dados reais para avaliar a forma da distribuição e definir os parâmetros do gerador. A simulação inicial, a aplicação dos testes e os gráficos G1 e G2 pertencem às demais atividades da Sprint 01.

## Referências

- [Metadados e listagem de PRs na API REST do GitHub](https://docs.github.com/en/rest/pulls/pulls)
- [Eventos completos da linha do tempo](https://docs.github.com/en/rest/issues/timeline)
- [Revisões de PRs](https://docs.github.com/en/rest/pulls/reviews)
- [Revisão de código pelo GitHub Copilot](https://docs.github.com/en/copilot/concepts/agents/code-review)
- [Mann-Whitney na documentação do SciPy](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.mannwhitneyu.html)
