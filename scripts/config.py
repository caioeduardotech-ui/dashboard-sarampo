"""Configuração: onde estão os arquivos baixados e qual arquivo corresponde a qual ano/dose.
Os nomes abaixo são os dos arquivos baixados nas consultas (TabNet, SIDRA, painel de cobertura e SINAN).
Se os seus arquivos tiverem outros nomes, ajuste aqui."""
import os
from pathlib import Path

PASTA_ENTRADA = Path(os.environ.get("ENTRADA", "entrada"))          # pasta com os arquivos baixados
PASTA_SAIDA = Path(os.environ.get("SAIDA", "saida"))              # onde os resultados serão gravados

# Casos confirmados por UF, 1990-2026 (PDF do Ministério da Saúde)
CASOS_PDF = "casos-confirmados-sarampo-1990-2026.pdf"

# TabNet/PNI: cobertura por UF, 1ª dose (um arquivo por ano; o ano está dentro do arquivo)
D1_UF_ANOS = ["cpnibr17907999052.csv", "cpnibr17907999995.csv", "cpnibr17908000104.csv",
              "cpnibr17908000184.csv", "cpnibr17908000357.csv"]
# TabNet/PNI: cobertura por UF, 2ª dose (o ano está dentro do arquivo; 2020 vem do total do arquivo municipal)
D2_UF_ANOS = ["cpnibr17910821199.csv", "cpnibr17910821234.csv", "cpnibr17910821676.csv", "cpnibr17910821737.csv"]
# TabNet/PNI: cobertura por município (linhas = município, colunas = UF); o ano e a dose foram identificados
# comparando o total de cada arquivo com a cobertura por UF
D1_MUN = {2018: "cpnibr17910829137.csv", 2019: "cpnibr17910829166.csv", 2020: "cpnibr17910829194.csv",
          2021: "cpnibr17910829221.csv", 2022: "cpnibr17910829258.csv"}
D2_MUN = {2018: "cpnibr17910822651.csv", 2019: "cpnibr17910823224.csv", 2020: "cpnibr17910823399.csv",
          2021: "cpnibr17910823620.csv", 2022: "cpnibr17910823466.csv"}

# Painel de cobertura por residência (Excel): mensal por UF e anual por município
MENSAL_UF = {2023: "373c0732-50e5-4382-bcba-d4f91cef109e.xlsx", 2024: "8861d2b3-5741-4563-8cb2-d461a66bcb38.xlsx",
             2025: "3ea0409f-cd71-450f-b154-34f230f50870.xlsx", 2026: "06bfa6c0-59b2-4d54-a454-1bfc4e54a8f4.xlsx"}
MUNICIPAL = {2023: "7b166dfa-a739-4737-a3a1-437fdf71c3b7.xlsx", 2024: "f8100821-8396-47b4-ad0c-d8eb290beea4.xlsx",
             2025: "2315b71c-36b9-40f3-9e39-cda4993c7c75.xlsx"}

# IBGE (SIDRA)
POP_7358 = "tabela7358__1_.csv"            # projeção por faixa etária (grupos de 5 anos), 2018-2026
POP_IDADE_SIMPLES = "tabela7358__2_.csv"   # mesma tabela, com idades simples (0, 1, 2, 3, 4 anos)
# SINAN (TabNet): casos por faixa etária, Brasil, 2020-2026
SINAN_IDADE = "Dados_Sarampo_faixa_etária.xlsx"
# Malhas do IBGE (shapefile compactado)
MALHA_MUNICIPIOS = "BR_Municipios_2022.zip"
MALHA_UF = "br_unidades_da_federacao.zip"
