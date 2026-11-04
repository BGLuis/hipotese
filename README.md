<p align="center">
  <picture><source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/header/graph.svg?title=LAB04&subtitle=Welch+%C3%97+Mann-Whitney+em+tempos+de+merge+de+PRs&align=left&mode=dark" /><img alt="LAB04" src="https://shieldcn.dev/header/graph.svg?title=LAB04&subtitle=Welch+%C3%97+Mann-Whitney+em+tempos+de+merge+de+PRs&align=left&mode=light" /></picture>
</p>

<p align="center">
  <picture><source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/github/stars/BGLuis/hipotese.svg?variant=secondary&size=sm&mode=dark" /><img alt="GitHub Stars" src="https://shieldcn.dev/github/stars/BGLuis/hipotese.svg?variant=secondary&size=sm&mode=light" /></picture>
  <picture><source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/github/forks/BGLuis/hipotese.svg?variant=secondary&size=sm&mode=dark" /><img alt="GitHub Forks" src="https://shieldcn.dev/github/forks/BGLuis/hipotese.svg?variant=secondary&size=sm&mode=light" /></picture>
  <picture><source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/github/watchers/BGLuis/hipotese.svg?variant=secondary&size=sm&mode=dark" /><img alt="Watchers" src="https://shieldcn.dev/github/watchers/BGLuis/hipotese.svg?variant=secondary&size=sm&mode=light" /></picture>
  <picture><source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/github/contributors/BGLuis/hipotese.svg?theme=emerald&size=sm&mode=dark" /><img alt="Contributors" src="https://shieldcn.dev/github/contributors/BGLuis/hipotese.svg?theme=emerald&size=sm&mode=light" /></picture>
  <picture><source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/github/license/BGLuis/hipotese.svg?variant=ghost&size=sm&mode=dark" /><img alt="License" src="https://shieldcn.dev/github/license/BGLuis/hipotese.svg?variant=ghost&size=sm&mode=light" /></picture>
</p>

<p align="center">
  <img alt="TypeScript" src="https://shieldcn.dev/badge/Language-TypeScript-3178C6.svg?logo=typescript&variant=branded&size=sm" />
  <img alt="Python" src="https://shieldcn.dev/badge/Language-Python-3776AB.svg?logo=python&variant=branded&size=sm" />
  <img alt="React" src="https://shieldcn.dev/badge/Framework-React-61DAFB.svg?logo=react&variant=branded&size=sm" />
  <img alt="Vite" src="https://shieldcn.dev/badge/Tool-Vite-646CFF.svg?logo=vite&variant=branded&size=sm" />
  <img alt="Plotly" src="https://shieldcn.dev/badge/Tool-Plotly-3F4F75.svg?logo=plotly&variant=branded&size=sm" />
</p>

# LAB04 — Testes de Hipótese por Dentro

# 📖 Sobre

Estudo comparativo entre o **t de Welch** e o **Mann-Whitney** aplicado ao tempo até o merge de Pull Requests do [microsoft/vscode](https://github.com/microsoft/vscode), com (grupo A) e sem (grupo B) revisão automatizada do GitHub Copilot.

O projeto reúne a coleta dos dados reais pela API do GitHub (scripts em Python, com evidências auditáveis em `data/`), a metodologia em `docs/` e um dashboard em React + TypeScript com os gráficos G1 (dados reais × simulados) e G2 (estatística do teste sob H₀).

Site hospedado: <https://dashboard-iti2.vercel.app/>

Versão com a entrega da simulação no A.R.S.E.N.A.L: <https://arsenal.dev.br/hipotese/>

# 📋 Motivo

Trabalho da disciplina Laboratório de Medição e Experimentação em Engenharia de Software.

# 💻 Como iniciar

### Requisitos

- [Node.js](https://nodejs.org/en/download) (dashboard)
- [Python](https://www.python.org/downloads/) (coleta e reprodução dos dados)

### Instalação

1. Clone o repositório:

   ```sh
   git clone https://github.com/BGLuis/hipotese.git
   ```

2. Entre no diretório do projeto:

   ```sh
   cd hipotese
   ```

3. Instale e inicie o dashboard:

   ```sh
   cd dashboard
   npm install
   npm run dev        # copia ../data/*.json para public/data e abre em http://localhost:5173
   ```

   Outros comandos: `npm test` (estatística validada contra valores do SciPy) e `npm run build`.

   Origem dos dados: por padrão `./data` (cópia local). Para ler direto do repositório público:

   ```sh
   VITE_DATA_BASE=https://raw.githubusercontent.com/BGLuis/hipotese/main/data npm run build
   ```

4. Para reconstruir e validar a base de dados sem rede (na raiz do projeto):

   ```sh
   pip install -r requirements.txt
   python scripts/reproduzir.py
   ```

## Simulação inicial e aplicação dos dois testes

Na pasta `dashboard`, após `npm ci`, execute:

```sh
npm run simular
```

O comando gera os dados simulados e aplica **Welch e Mann-Whitney**, usando a mesma lógica do dashboard. Exporta CSVs e um resumo JSON em `resultados/simulacao/`, com semente 42, alfa de 5% e 5.000 repetições sob H₀. Não precisa de acesso à API do GitHub.

Veja [metodologia, parâmetros, resultados e opções de execução](docs/simulacao_inicial.md). Para reproduzir as versões instaladas, use Node.js 24 ou superior e `npm ci`.

Veja também a [conferência dos requisitos do enunciado por sprint](docs/conferencia_enunciado.md).

# 🤝 Contribuidores

<a href="https://github.com/BGLuis/hipotese/graphs/contributors">
  <picture><source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/contributors/BGLuis/hipotese.svg?title=false&preset=transparent&border=false&mode=dark" /><img alt="Contribuidores" src="https://shieldcn.dev/contributors/BGLuis/hipotese.svg?title=false&preset=transparent&border=false&mode=light" /></picture>
</a>

# 📄 Licença

Distribuído sob a licença [MIT](LICENSE).
