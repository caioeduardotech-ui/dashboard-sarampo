# Dashboard Interativo de Cobertura Vacinal e Sarampo

Projeto Integrador IV — UNIVESP (Bacharelado em Ciência de Dados e Engenharia da Computação).
Painel interativo que mostra quantas crianças foram vacinadas contra o sarampo, onde houve casos e quais lugares merecem mais atenção.

**Página:** https://SEU-USUARIO.github.io/dashboard-sarampo  <!-- troque pelo seu endereço -->

## O que a página mostra
Visão geral, mapa por estado, vacinação ano a ano e mês a mês, vacinação × casos, cidades com poucas crianças vacinadas (mapa e tabela), tabelas por estado e por ano, estados que merecem atenção, casos por idade e resumo em frases. Filtros: ano, região, estado e dose.

## Dados (todos públicos e agregados, sem informação pessoal)
| Dado | Fonte | Período |
|---|---|---|
| Casos confirmados de sarampo por UF | Ministério da Saúde (CGVDI/SVSA) | 2018–2026 (2026 preliminar) |
| Casos por faixa etária (Brasil) | SINAN (via TabNet/DATASUS) | 2020–2026 |
| Cobertura da tríplice viral, 1ª e 2ª doses, por UF e município | SI-PNI / Ministério da Saúde (TabNet, 2018–2022; painel por residência, 2023–2025) | 2018–2025 |
| Cobertura de outras vacinas e mês a mês | Painel de cobertura por residência | 2023–2026 |
| População total e por idade | IBGE, SIDRA (tabelas 7358 e 9514) | 2018–2026 |
| Malhas territoriais | IBGE | UF e município (2022) |

A planilha com todos os dados organizados está em `base-consolidada-sarampo.xlsx`.

## Indicadores
- **Crianças vacinadas (cobertura):** doses aplicadas ÷ crianças que deveriam ser vacinadas. Meta: 95%.
- **Casos por 100 mil habitantes:** casos do período ÷ população do último ano × 100.000.
- **Estados que merecem atenção:** cobertura abaixo de 95% e casos entre os 25% mais altos. É critério de triagem, não de risco.
- **Agrupamento de estados:** k-médias (3 grupos) sobre cobertura e incidência padronizadas.

## Limitações
2026 é parcial; casos por idade só para o Brasil (2020–2026); população-alvo por cidade só a partir de 2023; cobertura acima de 100% reflete a estimativa de população. A página é descritiva e não prova causa.

## Estrutura do repositório
- `index.html`: estrutura da página (textos, seções e filtros).
- `estilo.css`: aparência (cores, tabelas, modo escuro, impressão).
- `app.js`: lógica da página (filtros, gráficos, mapas, tabelas, agrupamento de estados).
- `dados.js`: dados usados pela página (casos, vacinação, população e malhas do IBGE).
- `scripts/`: programas em Python que preparam os dados a partir dos arquivos das fontes (veja `scripts/LEIAME.md`).
- `dados/base-consolidada-sarampo.xlsx`: os mesmos dados em planilha, com a descrição de cada aba na aba LEIA-ME.

## Como atualizar
Para trocar os dados, gere um novo `dados.js` com a mesma estrutura e substitua o arquivo. Para mudar textos, edite `index.html` e `app.js`.

## Ferramentas e apoio utilizados
<!-- PREENCHER pelo grupo, com o que realmente aconteceu -->

## Equipe
Bruno dos Santos Passos · Caio Eduardo Vieira de Oliveira Silva · Lincoln Silírio da Silva · Maria Ana da Silva
