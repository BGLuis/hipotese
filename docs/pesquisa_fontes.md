# Pesquisa e escolha da fonte

Pesquisa realizada em 02/11/2026, antes de usar os tempos de merge para comparar grupos.

Foram considerados três projetos públicos:

| Projeto | Verificação de viabilidade | Decisão |
| --- | --- | --- |
| NVIDIA/cccl | Histórico de CodeRabbit confirmado em páginas de revisão e na API. Exploração inicial em outubro de 2026 mostrou forte predominância de revisão automatizada e pouquíssimos casos sem evidência. | A coleta exploratória foi interrompida; seus registros não entram na base final. |
| langchain-ai/langchain | Busca REST no recorte outubro de 2026 retornou zero PRs integrados com comentários do CodeRabbit e dois com comentários do revisor Copilot. Resultados de busca são indicadores de viabilidade, não contagens de revisões efetivas. | Sem evidência de amostra suficiente para o grupo com bot nesse recorte. |
| microsoft/vscode | Buscas em outubro de 2026 e em meses de 2025 indicaram variação forte na adoção do revisor Copilot. Em setembro de 2025, a busca preliminar localizou 302 PRs integrados com interação dessa conta, frente a poucos casos nos meses anteriores. | Selecionado para a coleta definitiva, com ambos os grupos do mesmo projeto e mês. |

O recorte inicial de exploração foi substituído explicitamente por setembro de 2025 no VS Code, por viabilidade de composição dos dois grupos, sem seleção por duração de merge. O novo recorte e as buscas definitivas foram fixados em `coleta_config.json` antes da seleção final. A base definitiva não mistura repositórios ou recortes.

As buscas preliminares não estabelecem a prevalência de revisão: comentários podem ser avisos, e uma revisão pode acontecer depois do merge. Por isso, cada observação final foi verificada separadamente.

A consulta usa apenas dados públicos. A API REST fornece metadados e, quando há cota, o histórico de eventos. Páginas públicas de PR são usadas para evidências positivas e, após o limite anônimo de requisições, para verificar históricos sem paginação pendente. Nenhuma autenticação ou credencial nova foi solicitada.
