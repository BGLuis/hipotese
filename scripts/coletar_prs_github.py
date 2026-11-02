"""Coleta PRs públicos e preserva evidências para reprodução sem rede."""
import argparse
from collections import Counter
from datetime import datetime, timezone
import csv
import hashlib
import json
import os
from pathlib import Path
import re
import sys
import time
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
FIELDS = ['numero_pr', 'repositorio', 'url_pr', 'autor', 'tipo_autor', 'created_at',
          'merged_at', 'grupo', 'nome_bot', 'data_revisao_bot', 'evidencia_revisao',
          'tempo_merge_h', 'metodo_verificacao']


def dt(value):
    return datetime.fromisoformat(value.replace('Z', '+00:00'))


class Client:
    def __init__(self, offline=False):
        self.offline = offline
        self.cache = ROOT / 'data' / 'auditoria'
        self.cache.mkdir(parents=True, exist_ok=True)

    def request(self, url):
        headers = {'User-Agent': 'LAB04-public-academic-study',
                   'Accept': 'application/vnd.github+json' if 'api.github.com' in url else 'text/html'}
        token = os.getenv('GH_TOKEN') or os.getenv('GITHUB_TOKEN')
        if token and url.startswith('https://api.github.com/'):
            headers['Authorization'] = 'Bearer ' + token
        for attempt in range(3):
            try:
                with urlopen(Request(url, headers=headers), timeout=60) as response:
                    return response.read(), response.headers
            except HTTPError as exc:
                if exc.code in (403, 429):
                    reset = exc.headers.get('X-RateLimit-Reset', '')
                    raise RuntimeError('Limite/acesso GitHub: HTTP %s; reset Unix=%s. '
                                       'Cache preservado. Retome depois ou use GH_TOKEN já autorizado.'
                                       % (exc.code, reset)) from None
                if exc.code < 500 or attempt == 2:
                    raise RuntimeError('GitHub HTTP %s em %s' % (exc.code, url)) from None
            except URLError as exc:
                if attempt == 2:
                    raise RuntimeError('Falha de rede em %s: %s' % (url, exc.reason)) from None
            time.sleep(2 ** attempt)

    def pages(self, url):
        values = []
        while url:
            body, headers = self.request(url)
            values.extend(json.loads(body))
            match = re.search(r'<([^>]+)>; rel="next"', headers.get('Link', ''))
            url = match.group(1) if match else None
        return values

    def cached(self, name, producer):
        path = self.cache / (name + '.json')
        if path.exists():
            return json.loads(path.read_text(encoding='utf-8'))
        if self.offline:
            raise RuntimeError('Snapshot ausente: ' + str(path))
        value = producer()
        path.write_text(json.dumps(value, indent=2, ensure_ascii=False), encoding='utf-8')
        return value


def clean_event(event):
    user = event.get('user') or event.get('actor') or {}
    return {'event': event.get('event'), 'login': user.get('login', ''),
            'type': user.get('type', ''),
            'at': event.get('submitted_at') or event.get('created_at'),
            'url': event.get('html_url', ''),
            'body_excerpt': (event.get('body') or '') if user.get('type') == 'Bot' else ''}


def html_reviews(client, pr, config):
    # A ausência de revisão só sustenta o grupo B com uma timeline completa.
    from lxml import html
    body, _ = client.request(pr['html_url'])
    tree = html.fromstring(body)
    evidence = []
    for node in tree.xpath('//*[starts-with(@id,"pullrequestreview-")]'):
        authors = node.xpath('.//a[contains(concat(" ",normalize-space(@class)," ")," author ")]')
        if not authors:
            authors = node.xpath('.//a[starts-with(@href,"/apps/")]')
        logins = [a.get('href', '').split('/')[-1].replace('[bot]', '') for a in authors]
        bot = next((v for v in logins if v in config['review_bots']), None)
        if not bot:
            apps = node.xpath('.//a[starts-with(@href,"/apps/")]/@href')
            bot = apps[0].split('/')[-1] if apps else None
        dates = node.xpath('.//relative-time/@datetime')
        if bot and dates and dt(dates[0]) < dt(pr['merged_at']):
            evidence.append({'event': 'reviewed', 'login': bot + '[bot]', 'type': 'Bot',
                             'at': dates[0], 'url': pr['html_url'] + '#' + node.get('id'),
                             'body_excerpt': 'Revisão formal publicada por aplicativo de revisão de código.'})
    for node in tree.xpath('//*[starts-with(@id,"issuecomment-")]'):
        if not re.fullmatch(r'issuecomment-\d+', node.get('id', '')):
            continue
        authors = node.xpath('.//a[contains(concat(" ",normalize-space(@class)," ")," author ")]')
        dates = node.xpath('.//relative-time/@datetime')
        bodies = node.xpath('.//*[contains(concat(" ",normalize-space(@class)," ")," comment-body ")]')
        if not authors or not dates or not bodies:
            continue
        href = authors[0].get('href', '')
        login = href.split('/')[-1].replace('[bot]', '')
        if href.startswith('/apps/') or '[bot]' in authors[0].text_content():
            evidence.append({'event': 'commented', 'login': login + '[bot]', 'type': 'Bot',
                             'at': dates[0], 'url': pr['html_url'] + '#' + node.get('id'),
                             'body_excerpt': bodies[0].text_content()})
    text = body.decode('utf-8', errors='replace')
    incomplete = bool(re.search(r'timeline_more|load more (items|comments)|Load more (items|comments)', text))
    return {'method': 'html_positive', 'source': pr['html_url'],
            'top_level_timeline_complete': not incomplete and bool(tree.xpath('//*[@id="partial-timeline"]')),
            'review_nodes': len(tree.xpath('//*[starts-with(@id,"pullrequestreview-")]')),
            'comment_nodes': len(tree.xpath('//*[starts-with(@id,"issuecomment-") and not(contains(@id,"-permalink")) and not(contains(@id,"-edit-form"))]')),
            'sha256_response': hashlib.sha256(body).hexdigest(),
            'events': evidence}


def classify(events, pr, config):
    positives, ambiguous = [], []
    for event in events:
        if event['event'] not in ('commented', 'reviewed') or not event['at']:
            continue
        if dt(event['at']) >= dt(pr['merged_at']):
            continue
        login = event['login'].lower().replace('[bot]', '')
        body = event.get('body_excerpt', '').lower()
        is_bot = event['type'] == 'Bot' or '[bot]' in event['login']
        if not is_bot:
            continue
        if login in config['administrative_bots']:
            continue
        if login in config['review_bots']:
            # Comentário de status/skip/resumo simples não comprova revisão.
            actual = event['event'] == 'reviewed' or any(marker in body for marker in (
                'actionable comments posted', 'no actionable comments were generated'))
            if actual:
                positives.append(event)
            elif any(marker in body for marker in ('review skipped', 'reviews are disabled',
                      'automatic reviews are disabled', 'rate limit', 'walkthrough', 'summary by',
                      'review in progress', 'currently processing', 'summarize by coderabbit.ai')):
                continue
            else:
                ambiguous.append(event)
        else:
            ambiguous.append(event)
    if positives:
        return 'A', min(positives, key=lambda e: e['at'])
    if ambiguous:
        return 'INCERTO', None
    return 'B', None


def write_csv(path, rows, fields):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open('w', newline='', encoding='utf-8-sig') as stream:
        writer = csv.DictWriter(stream, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)


def run(offline=False, refresh=False):
    config = json.loads((ROOT / 'coleta_config.json').read_text(encoding='utf-8'))
    client = Client(offline)
    old_summary = ROOT / 'data/resumo_coleta.json'
    collected_at = datetime.now(timezone.utc).isoformat()
    if old_summary.exists() and not refresh:
        collected_at = json.loads(old_summary.read_text(encoding='utf-8'))['collected_at_utc']
    if refresh:
        backup = ROOT / 'data' / ('auditoria_backup_' + datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ'))
        backup.mkdir(exist_ok=False)
        for file in client.cache.glob('*.json'):
            file.rename(backup / file.name)
    repo = config['repository']
    api = 'https://api.github.com/repos/' + repo

    def candidates():
        if config.get('candidate_queries'):
            output = {}
            for query_index, query in enumerate(config['candidate_queries']):
                for page in range(1, config['pages_per_query'] + 1):
                    url = ('https://api.github.com/search/issues?q=' + quote(query) +
                           '&sort=created&order=asc&per_page=100&page=' + str(page))
                    body, _ = client.request(url)
                    result = json.loads(body)
                    if result.get('incomplete_results'):
                        raise RuntimeError('Busca incompleta no GitHub; retome mais tarde.')
                    for item in result['items']:
                        output[item['number']] = {
                            'number': item['number'], 'html_url': item['html_url'],
                            'created_at': item['created_at'],
                            'merged_at': item['pull_request'].get('merged_at'),
                            'search_stratum': 'with_copilot' if query_index == 0 else 'without_copilot',
                            'user': {k: item['user'][k] for k in ('login', 'type')}}
            return list(output.values())
        output = []
        page = 1
        while True:
            url = api + '/pulls?state=closed&sort=created&direction=desc&per_page=100&page=' + str(page)
            data, _ = client.request(url)
            values = json.loads(data)
            for pr in values:
                output.append({k: pr[k] for k in ('number', 'html_url', 'created_at', 'merged_at', 'user')})
                output[-1]['user'] = {k: pr['user'][k] for k in ('login', 'type')}
            if not values or min(p['created_at'] for p in values) < config['created_from']:
                break
            page += 1
        return output

    pool = client.cached('candidatos', candidates)
    pool = sorted((p for p in pool if config['created_from'] <= p['created_at'] < config['created_before']),
                  key=lambda p: (p['created_at'], p['number']))
    selected, log, counts = [], [], Counter()
    try:
        for pr in pool:
            record = {'numero_pr': pr['number'], 'url_pr': pr['html_url'],
                      'created_at': pr['created_at'], 'grupo': '', 'decisao': '', 'motivo': ''}
            if pr.get('search_stratum') == 'without_copilot' and counts['B'] >= config['target_per_group']:
                record.update(decisao='nao_examinado', motivo='Cota do estrato sem interacao Copilot preenchida')
            elif not pr['merged_at'] or pr['merged_at'] >= config['merged_before']:
                record.update(decisao='excluido', motivo='Sem merge anterior ao corte temporal')
            elif pr['user']['type'] != 'User' or pr['user']['login'].endswith('[bot]'):
                record.update(decisao='excluido', motivo='Autoria automatizada')
            elif dt(pr['merged_at']) <= dt(pr['created_at']):
                record.update(decisao='excluido', motivo='Intervalo nao positivo')
            else:
                def inspect_pr():
                    positive = html_reviews(client, pr, config)
                    if classify(positive['events'], pr, config)[0] == 'A':
                        return positive
                    try:
                        events = client.pages(api + '/issues/' + str(pr['number']) + '/timeline?per_page=100')
                    except RuntimeError as error:
                        if 'Limite/acesso GitHub' in str(error) and positive['top_level_timeline_complete']:
                            positive['method'] = 'html_timeline_complete'
                            positive['fallback_reason'] = 'Cota REST indisponivel; timeline publica sem paginacao pendente'
                            return positive
                        raise
                    return {'method': 'rest_timeline_complete',
                            'source': api + '/issues/' + str(pr['number']) + '/timeline?per_page=100',
                            'events': [clean_event(e) for e in events if e.get('event') in ('commented', 'reviewed')]}
                snapshot = client.cached('pr_' + str(pr['number']), inspect_pr)
                # Migração de snapshots preliminares que limitavam o texto a 700 caracteres.
                if not offline and any(len(e.get('body_excerpt', '')) == 700 for e in snapshot['events']):
                    html_snapshot = html_reviews(client, pr, config)
                    for event in snapshot['events']:
                        match = next((e for e in html_snapshot['events'] if e['url'] == event['url']), None)
                        if match:
                            event['body_excerpt'] = match['body_excerpt']
                    (client.cache / ('pr_' + str(pr['number']) + '.json')).write_text(
                        json.dumps(snapshot, indent=2, ensure_ascii=False), encoding='utf-8')
                group, evidence = classify(snapshot['events'], pr, config)
                record['grupo'] = group
                if group == 'INCERTO':
                    record.update(decisao='excluido', motivo='Bot/comentario ambiguo: requer revisao humana')
                elif counts[group] >= config['target_per_group']:
                    record.update(decisao='nao_selecionado', motivo='Cota do grupo ja preenchida')
                else:
                    counts[group] += 1
                    record.update(decisao='selecionado', motivo='Elegivel em ordem de criacao')
                    selected.append(dict(zip(FIELDS, [pr['number'], repo, pr['html_url'],
                        pr['user']['login'], pr['user']['type'], pr['created_at'], pr['merged_at'], group,
                        evidence['login'] if evidence else '', evidence['at'] if evidence else '',
                        evidence['url'] if evidence else snapshot['source'],
                        (dt(pr['merged_at']) - dt(pr['created_at'])).total_seconds() / 3600,
                        snapshot['method']])))
                print('PR', pr['number'], record['grupo'], record['decisao'], dict(counts), flush=True)
            log.append(record)
            if all(counts[g] >= config['target_per_group'] for g in ('A', 'B')):
                break
    finally:
        write_csv(ROOT / 'data/prs_reais.csv', selected, FIELDS)
        write_csv(ROOT / 'data/candidatos_examinados.csv', log,
                  ['numero_pr', 'url_pr', 'created_at', 'grupo', 'decisao', 'motivo'])
        summary = {'collected_at_utc': collected_at,
                   'config': config, 'selected': dict(counts), 'examined': len(log),
                   'decisions': dict(Counter(r['decisao'] for r in log)),
                   'complete': all(counts[g] == config['target_per_group'] for g in ('A', 'B'))}
        (ROOT / 'data/resumo_coleta.json').write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding='utf-8')
    if not summary['complete']:
        raise RuntimeError('Amostra incompleta: ' + str(dict(counts)))
    return summary


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--offline', action='store_true', help='Reconstruir exclusivamente do snapshot local')
    parser.add_argument('--refresh', action='store_true', help='Arquivar o cache anterior e iniciar nova extracao remota')
    args = parser.parse_args()
    try:
        if args.offline and args.refresh:
            parser.error('--offline e --refresh nao podem ser combinados')
        print(json.dumps(run(args.offline, args.refresh), ensure_ascii=True, indent=2))
    except (RuntimeError, HTTPError) as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
