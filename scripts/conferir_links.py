"""Conferência remota opcional de três PRs por grupo, sem alterar a base."""
import csv
import json
from pathlib import Path
from coletar_prs_github import Client, classify, html_reviews

ROOT=Path(__file__).resolve().parents[1]
cfg=json.loads((ROOT/'coleta_config.json').read_text(encoding='utf-8'))
with (ROOT/'data/prs_reais.csv').open(encoding='utf-8-sig',newline='') as f:
    rows=list(csv.DictReader(f))
report=[]
client=Client()
for group in ('A','B'):
    values=[r for r in rows if r['grupo']==group]
    for index in (0,len(values)//2,len(values)-1):
        r=values[index]
        pr={'html_url':r['url_pr'],'merged_at':r['merged_at']}
        snapshot=html_reviews(client,pr,cfg)
        observed,evidence=classify(snapshot['events'],pr,cfg)
        ok=observed==group and (group=='A' or snapshot['top_level_timeline_complete'])
        report.append({'numero_pr':r['numero_pr'],'grupo_esperado':group,
                       'grupo_observado':observed,'url':r['url_pr'],'confere':ok,
                       'sha256_html':snapshot['sha256_response']})
        if not ok:
            raise ValueError('Conferencia remota divergente: '+r['numero_pr'])
(ROOT/'data/conferencia_links.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print('Seis paginas publicas verificadas; grupos e evidencias conferem.')
