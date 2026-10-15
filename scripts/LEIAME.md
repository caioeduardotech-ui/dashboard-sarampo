# Scripts de preparação dos dados

Estes scripts transformam os arquivos baixados das fontes oficiais no arquivo `dados.js` usado pela página.

## Como usar
1. Instale o Python 3 e as bibliotecas: `pip install -r requirements.txt`. Instale também o `pdftotext` (pacote poppler).
2. Crie a pasta `entrada/` e coloque nela os arquivos baixados (PDF de casos, CSVs do TabNet, planilhas do painel de cobertura, tabelas do SIDRA, planilha do SINAN e as malhas do IBGE).
3. Confira em `config.py` se os nomes dos arquivos são os mesmos (ajuste se forem diferentes).
4. Rode: `python preparar_dados.py` (grava `saida/dados.js`).
5. Para comparar com o `dados.js` publicado: `python verificar.py saida/dados.js ../dados.js`.
6. Para refazer o agrupamento (aprendizado de máquina): `python aprendizado_maquina.py saida/dados.js` (grava `saida/perfis.js`, `agrupamento_estados.csv` e `agrupamento_cidades.csv`).

## O que cada arquivo faz
- `config.py`: pastas e nomes dos arquivos de entrada, com o ano e a dose de cada um.
- `shapefile_simples.py`: lê os shapefiles do IBGE e gera desenhos SVG leves (mapa dos estados e das cidades).
- `preparar_dados.py`: lê todas as fontes, calcula a cobertura anual e monta o `dados.js`.
- `verificar.py`: compara dois arquivos `dados.js` e mostra o que é igual ou diferente.
- `aprendizado_maquina.py`: agrupa estados e cidades em perfis parecidos (k-médias), testando de 2 a 6 grupos e escolhendo o que separa melhor.

## Como os números são calculados
- Cobertura anual de 2023–2025 por UF: soma das doses dos 12 meses ÷ soma da população-alvo dos 12 meses.
- Cobertura de 2018–2022: valores do TabNet. O ano e a dose de cada arquivo municipal foram identificados comparando o total de cada arquivo com a cobertura por UF.
- Casos por 100 mil habitantes é calculado na própria página (casos ÷ população × 100.000).

## Conferência feita
Rodando os scripts sobre os arquivos originais, todos os blocos de dados (casos, cobertura, população, idades, municípios, vacinas e mês a mês) resultam idênticos aos usados na página. O mapa dos estados passou a ser gerado pelos scripts a partir da malha de UFs do IBGE.

## Aprendizado de máquina
Usa o **k-médias**, que junta itens parecidos em grupos sem que ninguém diga os grupos antes. Estados: % vacinados e casos por 100 mil. Cidades: vacinação da 1ª dose de 2018 a 2025. O número de grupos é escolhido testando de 2 a 6 e usando a nota **silhouette** (de -1 a 1; mais perto de 1, grupos mais distintos). O método descreve semelhanças; não prevê surtos nem prova causa. A página faz o mesmo cálculo para os estados no navegador e conferimos que o resultado é igual ao do Python.
