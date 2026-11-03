# LAB04 — Testes de Hipótese por Dentro

## Dashboard (G1 e G2)

Site em React + TypeScript que lê `data/*.json` e exibe os gráficos G1 e G2, a simulação inicial e a conferência dos links. Ele só exibe: a coleta continua nos scripts Python.

```bash
cd dashboard
npm install
npm run dev        # copia ../data/*.json para public/data e abre em http://localhost:5173
npm test           # estatística validada contra valores do SciPy
npm run build
```

Origem dos dados: por padrão `./data` (cópia local). Para ler direto do repositório público:

```bash
VITE_DATA_BASE=https://raw.githubusercontent.com/BGLuis/hipotese/main/data npm run build
```
