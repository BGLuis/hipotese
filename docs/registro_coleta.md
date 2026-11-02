# Registro da coleta

Fonte: https://github.com/microsoft/vscode. Extração em 02/11/2026.

## Protocolo e recorte

PRs criados em setembro de 2025 e integrados antes de 01/10/2025, sempre em UTC. A configuração completa está em `coleta_config.json`. Fixaram-se duas consultas, cada uma limitada à primeira página de 100 candidatos em ordem de criação, antes da seleção final. Não houve sorteio, remoção de extremos ou seleção por tempo de merge.

```text
repo:microsoft/vscode is:pr is:merged created:2025-09-01..2025-09-30 merged:<2025-10-01 commenter:copilot-pull-request-reviewer[bot]
repo:microsoft/vscode is:pr is:merged created:2025-09-01..2025-09-30 merged:<2025-10-01 -commenter:copilot-pull-request-reviewer[bot]
```

A união deduplicada dessas páginas forma a moldura de seleção. Percorre-se a ordem `(created_at, numero_pr)` até preencher as quotas. O estrato de busca não é o grupo final: o histórico é verificado individualmente. Depois de preencher B, candidatos adicionais do estrato sem Copilot são registrados como não examinados, sem alegar que sejam elegíveis ou atribuir-lhes classificação.

## Resultado efetivamente obtido

- Grupo A (revisão Copilot anterior ao merge): 30 PRs.
- Grupo B (sem revisão automatizada identificada): 30 PRs.
- Candidatos percorridos no registro: 131.
- Decisão `selecionado`: 60.
- Decisão `excluido`: 6.
- Decisão `nao_examinado`: 65.

Os totais são relativos aos candidatos percorridos. Não são estimativas da população do mês. A lista completa com IDs, decisões e motivos está em `data/candidatos_examinados.csv`.

## Verificação das evidências

- `rest_timeline_complete`: 26 registros selecionados.
- `html_timeline_complete`: 4 registros selecionados.
- `html_positive`: 30 registros selecionados.

`html_positive` identifica revisão formal do aplicativo no PR com seu permalink e horário. `rest_timeline_complete` consulta todas as páginas do endpoint de eventos, incluindo revisões e comentários. `html_timeline_complete` é a alternativa usada quando a cota REST está esgotada: exige a timeline pública presente e sem indicador de paginação pendente, inspecionando autores de revisões e comentários. HTML não comprova ausência de eventos privados ou removidos. Mudanças na interface podem exigir atualização do parser.

Cada registro selecionado tem um snapshot mínimo em `data/auditoria/pr_NUMERO.json`. O snapshot de candidatos preserva os horários e autores retornados pela API. Nenhuma credencial foi salva. `--offline` usa esses snapshots e permite repetir a seleção sem rede.

## Exclusões

| PR | Grupo indicado | Motivo |
| --- | --- | --- |
| [264292](https://github.com/microsoft/vscode/pull/264292) | INCERTO | Bot/comentario ambiguo: requer revisao humana |
| [264362](https://github.com/microsoft/vscode/pull/264362) | Não classificado | Autoria automatizada |
| [264471](https://github.com/microsoft/vscode/pull/264471) | INCERTO | Bot/comentario ambiguo: requer revisao humana |
| [264611](https://github.com/microsoft/vscode/pull/264611) | INCERTO | Bot/comentario ambiguo: requer revisao humana |
| [264614](https://github.com/microsoft/vscode/pull/264614) | Não classificado | Autoria automatizada |
| [265683](https://github.com/microsoft/vscode/pull/265683) | Não classificado | Autoria automatizada |

## Distribuição temporal dos grupos

| Grupo | Primeira criação (UTC) | Última criação (UTC) |
| --- | --- | --- |
| A | 2025-09-05T16:38:13Z | 2025-09-17T17:52:50Z |
| B | 2025-09-01T00:17:54Z | 2025-09-02T21:23:39Z |

Diferenças entre as janelas efetivas podem confundir associação com a adoção do bot ou mudanças no processo de revisão durante o mês. A amostra não permite atribuir causalidade.

## Validação e reprodução

Execute `python scripts/coletar_prs_github.py --offline` e `python scripts/validar_dados.py`. O resultado estrutural está em `data/validacao.json`. A validação confere duplicidades, quotas, autoria operacional, UTC, datas, cálculo de horas, ordem de seleção, links e classificação no snapshot.

A validação local não substitui conferir os links atuais. Recomenda-se ao grupo abrir pelo menos três PRs de cada grupo, confirmar autoria, horários e atuação real do bot. Os links foram obtidos das fontes públicas durante a coleta; o estado remoto pode mudar.

## Escopo de entrega

Somente coleta e cenário da Sprint 01. A simulação, os testes e os gráficos G1/G2 devem ser implementados na atividade seguinte. Para a nota individual, falta associar a contribuição a uma Issue atribuída à integrante e referenciar essa Issue no commit. Não foi criado commit ou push sem essa identificação. O repositório original informado é https://github.com/BGLuis/hipotese.
