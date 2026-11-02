from collections import Counter
from pathlib import Path
import csv
import json

ROOT = Path(__file__).resolve().parents[1]


def prepare():
    with (ROOT/'data/prs_reais.csv').open(encoding='utf-8-sig', newline='') as f:
        rows = list(csv.DictReader(f))
    with (ROOT/'data/candidatos_examinados.csv').open(encoding='utf-8-sig', newline='') as f:
        log = list(csv.DictReader(f))
    summary = json.loads((ROOT/'data/resumo_coleta.json').read_text(encoding='utf-8'))
    (ROOT/'data/prs_reais.json').write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding='utf-8')
    groups = Counter(r['grupo'] for r in rows)
    methods = Counter(r['metodo_verificacao'] for r in rows)
    dispositions = Counter(r['decisao'] for r in log)
    texts = ['# Registro da coleta', '',
             'Fonte: https://github.com/microsoft/vscode. Extração em 02/11/2026.', '',
             '## Protocolo e recorte', '',
             'PRs criados em setembro de 2025 e integrados antes de 01/10/2025, sempre em UTC. '
             'A configuração completa está em `coleta_config.json`. Fixaram-se duas consultas, '
             'cada uma limitada à primeira página de 100 candidatos em ordem de criação, '
             'antes da seleção final. Não houve sorteio, remoção de extremos ou seleção por tempo de merge.', '',
             '```text', *summary['config']['candidate_queries'], '```', '',
             'A união deduplicada dessas páginas forma a moldura de seleção. '
             'Percorre-se a ordem `(created_at, numero_pr)` até preencher as quotas. '
             'O estrato de busca não é o grupo final: o histórico é verificado individualmente. '
             'Depois de preencher B, candidatos adicionais do estrato sem Copilot são registrados como não examinados, '
             'sem alegar que sejam elegíveis ou atribuir-lhes classificação.', '',
             '## Resultado efetivamente obtido', '',
             f'- Grupo A (revisão Copilot anterior ao merge): {groups["A"]} PRs.',
             f'- Grupo B (sem revisão automatizada identificada): {groups["B"]} PRs.',
             f'- Candidatos percorridos no registro: {len(log)}.',
             *[f'- Decisão `{k}`: {v}.' for k,v in dispositions.items()], '',
             'Os totais são relativos aos candidatos percorridos. Não são estimativas da população do mês. '
             'A lista completa com IDs, decisões e motivos está em `data/candidatos_examinados.csv`.', '',
             '## Verificação das evidências', '',
             *[f'- `{k}`: {v} registros selecionados.' for k,v in methods.items()], '',
             '`html_positive` identifica revisão formal do aplicativo no PR com seu permalink e horário. '
             '`rest_timeline_complete` consulta todas as páginas do endpoint de eventos, incluindo revisões e comentários. '
             '`html_timeline_complete` é a alternativa usada quando a cota REST está esgotada: exige a timeline pública '
             'presente e sem indicador de paginação pendente, inspecionando autores de revisões e comentários. '
             'HTML não comprova ausência de eventos privados ou removidos. Mudanças na interface podem exigir atualização do parser.', '',
             'Cada registro selecionado tem um snapshot mínimo em `data/auditoria/pr_NUMERO.json`. '
             'O snapshot de candidatos preserva os horários e autores retornados pela API. '
             'Nenhuma credencial foi salva. `--offline` usa esses snapshots e permite repetir a seleção sem rede.', '',
             '## Exclusões', '',
             '| PR | Grupo indicado | Motivo |', '| --- | --- | --- |']
    texts.extend(f'| [{r["numero_pr"]}]({r["url_pr"]}) | {r["grupo"] or "Não classificado"} | {r["motivo"]} |'
                 for r in log if r['decisao']=='excluido')
    texts += ['', '## Distribuição temporal dos grupos', '',
              '| Grupo | Primeira criação (UTC) | Última criação (UTC) |', '| --- | --- | --- |']
    for group in ('A','B'):
        dates = [r['created_at'] for r in rows if r['grupo']==group]
        texts.append(f'| {group} | {min(dates) if dates else "Sem dados"} | {max(dates) if dates else "Sem dados"} |')
    texts += ['', 'Diferenças entre as janelas efetivas podem confundir associação com a adoção do bot ou '
              'mudanças no processo de revisão durante o mês. A amostra não permite atribuir causalidade.', '',
              '## Validação e reprodução', '',
              'Execute `python scripts/coletar_prs_github.py --offline` e `python scripts/validar_dados.py`. '
              'O resultado estrutural está em `data/validacao.json`. A validação confere duplicidades, quotas, '
              'autoria operacional, UTC, datas, cálculo de horas, ordem de seleção, links e classificação no snapshot.', '',
              'A validação local não substitui conferir os links atuais. Recomenda-se ao grupo abrir pelo menos '
              'três PRs de cada grupo, confirmar autoria, horários e atuação real do bot. '
              'Os links foram obtidos das fontes públicas durante a coleta; o estado remoto pode mudar.', '',
              '## Escopo de entrega', '',
              'Somente coleta e cenário da Sprint 01. A simulação, os testes e os gráficos G1/G2 devem ser '
              'implementados na atividade seguinte. Para a nota individual, falta associar a contribuição a uma '
              'Issue atribuída à integrante e referenciar essa Issue no commit. Não foi criado commit ou push sem '
              'essa identificação. O repositório original informado é https://github.com/BGLuis/hipotese.']
    (ROOT/'docs/registro_coleta.md').write_text('\n'.join(texts)+'\n',encoding='utf-8')


if __name__ == '__main__':
    prepare()
