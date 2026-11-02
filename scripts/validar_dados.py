"""Valida a base e a rastreabilidade no snapshot local, sem acesso à rede."""
from collections import Counter
from datetime import datetime
import csv
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from coletar_prs_github import classify, dt


def validate():
    cfg = json.loads((ROOT / 'coleta_config.json').read_text(encoding='utf-8'))
    with (ROOT / 'data/prs_reais.csv').open(encoding='utf-8-sig', newline='') as f:
        rows = list(csv.DictReader(f))
    with (ROOT / 'data/candidatos_examinados.csv').open(encoding='utf-8-sig', newline='') as f:
        log = list(csv.DictReader(f))
    pool = json.loads((ROOT / 'data/auditoria/candidatos.json').read_text(encoding='utf-8'))
    by_number = {str(p['number']): p for p in pool}
    errors = []
    def check(condition, message):
        if not condition:
            errors.append(message)
    keys = [(r['repositorio'], r['numero_pr']) for r in rows]
    check(len(keys) == len(set(keys)), 'Duplicidades na base')
    check(len(log) == len({r['numero_pr'] for r in log}), 'Duplicidades no registro')
    expected = sorted((p for p in pool if cfg['created_from'] <= p['created_at'] < cfg['created_before']),
                      key=lambda p: (p['created_at'], p['number']))
    check([int(r['numero_pr']) for r in log] == [p['number'] for p in expected[:len(log)]],
          'O registro nao segue um prefixo da ordem predefinida')
    counts = Counter(r['grupo'] for r in rows)
    selected_log = {r['numero_pr'] for r in log if r['decisao'] == 'selecionado'}
    check(selected_log == {r['numero_pr'] for r in rows}, 'Registro e base divergem')
    for row in rows:
        number = row['numero_pr']
        pr = by_number[number]
        check(row['repositorio'] == cfg['repository'], number + ': repositorio divergente')
        check(row['url_pr'] == 'https://github.com/' + cfg['repository'] + '/pull/' + number,
              number + ': URL incorreta')
        check(row['tipo_autor'] == pr['user']['type'] == 'User', number + ': autoria nao elegivel')
        check(row['autor'] == pr['user']['login'], number + ': autor divergente')
        check(row['created_at'] == pr['created_at'] and row['merged_at'] == pr['merged_at'],
              number + ': datas divergem da API')
        start, end = dt(row['created_at']), dt(row['merged_at'])
        check(cfg['created_from'] <= row['created_at'] < cfg['created_before'], number + ': fora do recorte')
        check(row['merged_at'] < cfg['merged_before'], number + ': merge posterior ao corte')
        check(start.utcoffset().total_seconds() == end.utcoffset().total_seconds() == 0,
              number + ': datas devem ser UTC')
        hours = (end - start).total_seconds() / 3600
        check(hours > 0 and abs(hours - float(row['tempo_merge_h'])) < 1e-9, number + ': tempo incorreto')
        snapshot = json.loads((ROOT / ('data/auditoria/pr_' + number + '.json')).read_text(encoding='utf-8'))
        group, evidence = classify(snapshot['events'], pr, cfg)
        check(group == row['grupo'], number + ': classificacao divergente')
        if group == 'A':
            check(bool(row['nome_bot'] and row['data_revisao_bot']), number + ': evidencia incompleta')
            check(dt(row['data_revisao_bot']) < end, number + ': revisao posterior ao merge')
            check(row['evidencia_revisao'] == evidence['url'], number + ': link de evidencia divergente')
        elif group == 'B':
            check(snapshot['method'] in ('rest_timeline_complete', 'html_timeline_complete'), number + ': ausencia sem auditoria completa')
            if snapshot['method'] == 'html_timeline_complete':
                check(snapshot.get('top_level_timeline_complete'), number + ': HTML com timeline incompleta')
            check(not row['nome_bot'] and not row['data_revisao_bot'], number + ': B com bot atribuido')
        else:
            check(False, number + ': grupo invalido')
    complete = all(counts[g] == cfg['target_per_group'] for g in ('A', 'B'))
    report = {'registros': len(rows), 'contagem_grupos': dict(counts), 'erros': errors,
              'validade_estrutural': not errors, 'meta_amostral_atingida': complete,
              'escopo': 'Consistencia local com snapshots da API e evidencias HTML; nao prova causalidade nem ausencia de eventos removidos.'}
    (ROOT / 'data/validacao.json').write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding='utf-8')
    print(json.dumps(report, indent=2, ensure_ascii=True))
    return 0 if not errors and complete else 1


if __name__ == '__main__':
    sys.exit(validate())
