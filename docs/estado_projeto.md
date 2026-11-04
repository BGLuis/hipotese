# Estado do projeto em 04/11/2026

Base utilizada: commit `f747301` do repositório `BGLuis/hipotese`.

## Divisão de responsabilidades conferida no GitHub Projects

| Atividade | Responsável | Estado no quadro consultado |
| --- | --- | --- |
| Coletar dados reais e documentar cenário — issue #3 | IsabellaLDias | Done, issue fechada |
| Simulação inicial, Welch e Mann-Whitney — issue #1 | alencarleandro | Backlog, issue aberta |
| Dashboard com G1 e G2 — issue #2 | BGLuis | Done, issue fechada |

Fonte: [Projects laboratorio](https://github.com/users/BGLuis/projects/1). O estado do quadro acima foi apenas consultado. Esta implementação está publicada pelo A.R.S.E.N.A.L e é versionada com referência à issue #1; o quadro, as issues e a hospedagem anterior na Vercel não foram alterados.

## Entrega local da simulação

- Modelo lognormal calibrado com os 30 tempos reais de cada grupo, aproveitando o gerador e os testes estatísticos já presentes no dashboard.
- Comando `npm run simular` na pasta `dashboard`, com semente, alfa, repetições e destino configuráveis.
- Módulo de análise compartilhado entre o dashboard e a exportação; preservação das amostras do G1 e das estatísticas t sob H₀ do G2.
- Exportação dos tempos simulados, resumo dos dois testes e distribuição nula dos dois testes usando pares de amostras comuns.
- Validações de entradas e tratamento explícito de amostras degeneradas.
- Instruções e interpretação em [simulacao_inicial.md](simulacao_inicial.md).

Os resultados padrão estão em `resultados/simulacao/`. Welch produz t = 2,060217 e p = 0,048443; Mann-Whitney produz U = 584 e p = 0,048413. Ambos rejeitam H₀ a 5% nesse exemplo simulado.

## Verificação realizada

- `npm test`: **48 testes aprovados**, em 6 arquivos, incluindo as referências SciPy já existentes e os novos testes de integração, exportação e áreas dos gráficos.
- `npm run build`: **concluído**. O empacotador avisa sobre o tamanho do pacote de gráficos; o aviso não impede a compilação.
- `npm run simular`: **concluído**, com 60 observações no CSV e 5.000 repetições sob H₀.

A coleta Python e seus testes não foram reexecutados; os dados originais foram mantidos. A entrega é registrada no Git com referência à issue #1. O fechamento da issue e a atualização do Projects devem acompanhar a revisão do grupo.

A Sprint 02 (avaliação sistemática de erro tipo I e poder com 10.000 simulações) permanece fora desta entrega.

Após receber o enunciado completo, foram incluídos os links do trabalho no topo e os textos de interpretação, corrigida a faixa do G1 para incluir todos os tempos e sombreada a área bicaudal do p-valor no G2. A região de rejeição agora segue a mesma referência t usada para calcular o p-valor. Veja a [conferência de requisitos por sprint](conferencia_enunciado.md).

## Hospedagem no A.R.S.E.N.A.L

Publicado em **https://arsenal.dev.br/hipotese/**, com cadastro `Hipótese LAB04`, porta local 4120 e tratamento de rota `keep`. O app inicia automaticamente com o A.R.S.E.N.A.L. O Git automático deste cadastro foi desativado para preservar a entrega local sem commit ou push automático.

O comando cadastrado é `npm run build && npm run servir -- --port %PORT%`, executado na pasta `dashboard` desta cópia. Ele compila e serve o resultado pelo Vite Preview, adequado para esta demonstração acadêmica. O acesso pelo domínio do A.R.S.E.N.A.L está permitido na configuração do preview. Para aplicar alterações futuras, use **Reiniciar app** neste cadastro.

Validação da publicação: página, JavaScript, CSS e três arquivos JSON responderam com HTTP 200 pelo domínio público; os 60 PRs, G1, G2 e tabela de resultados foram conferidos no navegador, sem erros de console. A disponibilidade depende do computador, do A.R.S.E.N.A.L e do túnel estarem ligados.
