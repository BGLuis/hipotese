"""Reconstroi e valida a entrega a partir do snapshot, sem rede."""
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
for command in [
    [sys.executable, 'scripts/coletar_prs_github.py', '--offline'],
    [sys.executable, 'scripts/validar_dados.py'],
    [sys.executable, 'scripts/preparar_entrega.py'],
    [sys.executable, '-m', 'unittest', 'discover', '-s', 'tests', '-v']
]:
    subprocess.run(command, cwd=ROOT, check=True)
print('Base e documentacao reconstruidas. Validacao concluida sem rede.')
