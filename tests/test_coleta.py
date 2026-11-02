from pathlib import Path
import json
import sys
import unittest

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
from coletar_prs_github import classify


class ClassificacaoTest(unittest.TestCase):
    def setUp(self):
        self.config=json.loads((ROOT/'coleta_config.json').read_text(encoding='utf-8'))
        self.pr={'merged_at':'2025-09-15T12:00:00Z'}

    def event(self,login='copilot-pull-request-reviewer[bot]',kind='reviewed',at='2025-09-15T11:00:00Z',body=''):
        return {'login':login,'type':'Bot','event':kind,'at':at,'body_excerpt':body,'url':'https://github.com/example/repo/pull/1#pullrequestreview-1'}

    def test_revisao_antes_do_merge(self):
        self.assertEqual(classify([self.event()],self.pr,self.config)[0],'A')

    def test_revisao_tardia_nao_conta(self):
        for when in ('2025-09-15T12:00:00Z','2025-09-15T13:00:00Z'):
            self.assertEqual(classify([self.event(at=when)],self.pr,self.config)[0],'B')

    def test_ci_nao_e_revisao_de_codigo(self):
        event=self.event(login='github-actions[bot]',kind='commented',body='CI complete. No actionable comments were generated.')
        self.assertEqual(classify([event],self.pr,self.config)[0],'B')

    def test_bot_desconhecido_exige_revisao_humana(self):
        self.assertEqual(classify([self.event(login='unknown-reviewer[bot]')],self.pr,self.config)[0],'INCERTO')

    def test_avisos_nao_comprovam_revisao(self):
        event=self.event(kind='commented',body='Review skipped: rate limit')
        self.assertEqual(classify([event],self.pr,self.config)[0],'B')


if __name__=='__main__':
    unittest.main()
