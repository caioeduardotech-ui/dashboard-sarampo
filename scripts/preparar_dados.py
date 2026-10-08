"""Prepara os dados do painel a partir dos arquivos baixados e grava `dados.js`.

Uso:  python preparar_dados.py            (lê a pasta definida em config.py e grava em saida/dados.js)

Etapas:
 1. casos confirmados por UF (PDF do Ministério da Saúde);
 2. cobertura da tríplice viral por UF e por município (TabNet 2018-2022; painel por residência 2023-2025);
 3. cobertura mensal e de outras vacinas (painel por residência);
 4. população total e por idade (IBGE/SIDRA);
 5. casos por faixa etária (SINAN);
 6. malhas do IBGE convertidas em desenhos leves (SVG).
"""
import csv, json, re, subprocess, sys
from pathlib import Path
import openpyxl
from config import *
from shapefile_simples import abrir_zip, caminhos_svg

NOMES = {"Rondônia": "RO", "Acre": "AC", "Amazonas": "AM", "Roraima": "RR", "Pará": "PA", "Amapá": "AP", "Tocantins": "TO",
         "Maranhão": "MA", "Piauí": "PI", "Ceará": "CE", "Rio Grande do Norte": "RN", "Paraíba": "PB", "Pernambuco": "PE",
         "Alagoas": "AL", "Sergipe": "SE", "Bahia": "BA", "Minas Gerais": "MG", "Espírito Santo": "ES", "Rio de Janeiro": "RJ",
         "São Paulo": "SP", "Paraná": "PR", "Santa Catarina": "SC", "Rio Grande do Sul": "RS", "Mato Grosso do Sul": "MS",
         "Mato Grosso": "MT", "Goiás": "GO", "Distrito Federal": "DF"}
COD_UF = {11: "RO", 12: "AC", 13: "AM", 14: "RR", 15: "PA", 16: "AP", 17: "TO", 21: "MA", 22: "PI", 23: "CE", 24: "RN",
          25: "PB", 26: "PE", 27: "AL", 28: "SE", 29: "BA", 31: "MG", 32: "ES", 33: "RJ", 35: "SP", 41: "PR", 42: "SC",
          43: "RS", 50: "MS", 51: "MT", 52: "GO", 53: "DF"}
PEQUENAS = {"De", "Da", "Do", "Dos", "Das", "E"}
IDADES = {"<1 Ano": "Menos de 1 ano", "1-4": "1 a 4 anos", "5-9": "5 a 9 anos", "10-14": "10 a 14 anos", "15-19": "15 a 19 anos",
          "20-29": "20 a 29 anos", "30-39": "30 a 39 anos", "40-49": "40 a 49 anos", "50-59": "50 a 59 anos",
          "60-64": "60 a 64 anos", "65-69": "65 a 69 anos", "70-79": "70 a 79 anos", "80 e +": "80 anos ou mais"}
# Como cada faixa do SINAN corresponde aos grupos de 5 anos do IBGE
GRUPOS_IBGE = {"5-9": ["5 a 9 anos"], "10-14": ["10 a 14 anos"], "15-19": ["15 a 19 anos"], "20-29": ["20 a 24 anos", "25 a 29 anos"],
               "30-39": ["30 a 34 anos", "35 a 39 anos"], "40-49": ["40 a 44 anos", "45 a 49 anos"],
               "50-59": ["50 a 54 anos", "55 a 59 anos"], "60-64": ["60 a 64 anos"], "65-69": ["65 a 69 anos"],
               "70-79": ["70 a 74 anos", "75 a 79 anos"], "80 e +": ["80 a 84 anos", "85 a 89 anos", "90 anos ou mais"]}


def titulo(nome):
    """Nomes de município em MAIÚSCULAS (TabNet) -> Título."""
    return " ".join(w if w not in PEQUENAS else w.lower() for w in nome.replace("\\'", "'").title().split())

def num(txt, casas=2):
    return round(float(txt.replace(",", ".")), casas)

def csv_latin(nome):
    return list(csv.reader(open(PASTA_ENTRADA / nome, encoding="latin1"), delimiter=";"))

def xlsx(nome):
    ws = openpyxl.load_workbook(PASTA_ENTRADA / nome, data_only=True).worksheets[0]
    return [list(r) for r in ws.iter_rows(values_only=True)]


# ---------------------------------------------------------------- 1. casos
def casos():
    texto = subprocess.run(["pdftotext", "-layout", str(PASTA_ENTRADA / CASOS_PDF), "-"], capture_output=True, text=True).stdout
    res = {}
    for linha in texto.splitlines():
        linha = linha.strip()
        for nome, uf in sorted(NOMES.items(), key=lambda x: -len(x[0])):   # nomes longos primeiro (Mato Grosso do Sul antes de Mato Grosso)
            if linha.startswith(nome + " ") and uf not in res:
                numeros = re.findall(r"[\d\.]+", linha[len(nome):])
                if len(numeros) == 37:                                      # 1990 a 2026
                    res[uf] = {str(1990 + i): int(x.replace(".", "")) for i, x in enumerate(numeros)}
                    break
    assert len(res) == 27, "não encontrei as 27 UFs no PDF"
    return res


# ---------------------------------------------------------------- 2. cobertura 2018-2022 (TabNet)
def cobertura_tabnet():
    cov, tot = {}, {}
    for arq in D1_UF_ANOS:                                 # D1 por UF: linha 2 = ano; colunas = UFs + Total
        R = csv_latin(arq); cab = [x.strip() for x in R[0]]; linha = R[1]; ano = str(int(linha[0]))
        for k, v in zip(cab[1:], linha[1:]):
            if k == "Total": tot[ano] = num(v, 10)
            else: cov.setdefault(k, {})[ano] = num(v, 10)
    cov2, tot2, mun = {}, {}, {}
    for ano, arq in D2_MUN.items():                        # D2 por município; a última linha traz o total de cada UF
        R = csv_latin(arq); cab = [x.strip() for x in R[0]]; ano = str(ano); linhas = {}
        for r in R[1:-1]:
            cod, nome = r[0].split(" ", 1)
            linhas[cod] = [COD_UF[int(cod[:2])], titulo(nome), None, None, num(r[-1]), None, cod]
        total = dict(zip(cab[1:], R[-1][1:]))
        for uf in COD_UF.values(): cov2.setdefault(uf, {})[ano] = num(total[uf])
        tot2[ano] = num(total["Total"]); mun[ano] = linhas
    for ano, arq in D1_MUN.items():                        # D1 por município
        R = csv_latin(arq); ano = str(ano)
        for r in R[1:-1]:
            cod, nome = r[0].split(" ", 1)
            linhas = mun[ano].setdefault(cod, [COD_UF[int(cod[:2])], titulo(nome), None, None, None, None, cod])
            linhas[2] = num(r[-1])
    for arq in D2_UF_ANOS:                                 # conferência: D2 por UF deve bater com o total do arquivo municipal
        R = csv_latin(arq); cab = [x.strip() for x in R[0]]; ano = str(int(R[1][0]))
        for uf in COD_UF.values():
            assert num(R[1][cab.index(uf)]) == cov2[uf][ano], f"D2 {uf} {ano} não bate"
    return cov, tot, cov2, tot2, {a: list(v.values()) for a, v in mun.items()}


# ---------------------------------------------------------------- 3. painel por residência (2023-2026)
def painel_mensal():
    """Cobertura anual por UF (2023-2025) e cobertura mês a mês (2023-2026)."""
    cov, tot, meses = {}, {}, []
    for ano, arq in MENSAL_UF.items():
        A = xlsx(arq); n = (len(A[3]) - 3) // 3                         # nº de meses preenchidos neste arquivo
        for r in A[5:]:
            if not isinstance(r[2], int): continue
            uf = COD_UF[r[2]]
            for i in range(n):
                doses, pop_alvo, data = r[4 + 3 * i], r[5 + 3 * i], A[1][3 + 3 * i]
                if doses is None: continue
                mes_num = data.month if hasattr(data, "month") else i + 1
                meses.append([uf, ano, mes_num, round(doses / pop_alvo * 100, 2) if pop_alvo else None])
            if ano <= 2025:                                              # ano fechado: soma das doses ÷ soma da população-alvo
                d = sum(r[4 + 3 * i] or 0 for i in range(12)); p = sum(r[5 + 3 * i] or 0 for i in range(12))
                cov.setdefault(uf, {})[str(ano)] = round(d / p * 100, 2)
        if ano <= 2025:                                                  # linha "Brasil" (índice 3 do arquivo)
            d = sum(A[3][4 + 3 * i] or 0 for i in range(12)); p = sum(A[3][5 + 3 * i] or 0 for i in range(12))
            tot[str(ano)] = round(d / p * 100, 2)
    return cov, tot, meses


def painel_municipal():
    mun, vac, cov2, tot2 = {}, {}, {}, {}
    for ano, arq in MUNICIPAL.items():
        A = xlsx(arq); ano = str(ano)
        c1 = [i for i, v in enumerate(A[0]) if v == "Tríplice Viral - 1° Dose"][0]
        c2 = [i for i, v in enumerate(A[0]) if v == "Tríplice Viral - 2° Dose"][0]
        colunas = [(i, v) for i, v in enumerate(A[0]) if v and i >= 6]   # uma coluna de cobertura por vacina
        V, linhas, uf = {}, [], None
        for r in A[2:]:
            if r[0] == "Brasil": k = "BR"
            elif r[2] is not None and r[3] == "Totais": k = uf = r[2]
            else: k = None
            if k:                                                        # total do Brasil ou da UF
                for i, v in colunas:
                    if isinstance(r[i], (int, float)): V.setdefault(v, {})[k] = round(r[i] * 100, 1)
                if k == "BR": tot2[ano] = round(r[c2] * 100, 2)
                else: cov2.setdefault(k, {})[ano] = round(r[c2] * 100, 2)
            elif all(r[i] is None for i in range(5)) and r[5]:           # linha de município
                cod, nome = r[5].split(" - ", 1)
                if r[c1] is None or not r[c1 + 2]: continue
                linhas.append([uf, nome, round(r[c1] * 100, 1), int(r[c1 + 2]), round((r[c2] or 0) * 100, 1), int(r[c2 + 2] or 0), cod.strip()])
        mun[ano], vac[ano] = linhas, V
    return mun, vac, cov2, tot2


# ---------------------------------------------------------------- 4. população
def populacao():
    R = list(csv.reader(open(PASTA_ENTRADA / POP_7358, encoding="utf-8-sig"), delimiter=";")); cab = R[5]
    pop, grupos = {}, {}
    for x in R[6:]:
        if len(x) == len(cab) and x[1].isdigit():
            pop.setdefault(NOMES[x[0]], {})[x[1]] = int(x[2])                      # total da UF
            if int(x[1]) >= 2020:
                for j in range(3, len(cab)):
                    grupos.setdefault(cab[j], {}).setdefault(x[1], 0); grupos[cab[j]][x[1]] += int(x[j])   # soma do Brasil
    R = list(csv.reader(open(PASTA_ENTRADA / POP_IDADE_SIMPLES, encoding="utf-8-sig"), delimiter=";")); cab = R[5]
    i0 = cab.index("0 ano"); i14 = [cab.index("1 ano")] + [cab.index(f"{k} anos") for k in (2, 3, 4)]
    zero, um_a_quatro = {}, {}
    for x in R[6:]:
        if len(x) == len(cab) and x[1].isdigit():
            zero[x[1]] = zero.get(x[1], 0) + int(x[i0]); um_a_quatro[x[1]] = um_a_quatro.get(x[1], 0) + sum(int(x[i]) for i in i14)
    anos = [str(a) for a in range(2020, 2027)]
    pop_idade = {"<1 Ano": {a: zero[a] for a in anos}, "1-4": {a: um_a_quatro[a] for a in anos}}
    for faixa, gs in GRUPOS_IBGE.items(): pop_idade[faixa] = {a: sum(grupos[g][a] for g in gs) for a in anos}
    return pop, pop_idade


# ---------------------------------------------------------------- 5. casos por faixa etária (SINAN)
def idade(pop_idade):
    R = xlsx(SINAN_IDADE); linhas = R[9:22]                       # 13 faixas; colunas = 2020 a 2026
    casos_idade = {IDADES[r[0]]: {str(2020 + j): (0 if r[1 + j] in ("-", None) else int(r[1 + j])) for j in range(7)} for r in linhas}
    return {"faixas": [IDADES[r[0]] for r in linhas], "cases": casos_idade, "pop": {IDADES[k]: v for k, v in pop_idade.items()}}


# ---------------------------------------------------------------- 6. malhas
def malhas():
    p, bb = caminhos_svg(abrir_zip(PASTA_ENTRADA / MALHA_MUNICIPIOS), "CD_MUN", 0.03, tamanho_id=6)
    mgeo = {"p": p, "bb": bb}
    pu, bu = caminhos_svg(abrir_zip(PASTA_ENTRADA / MALHA_UF), "SIGLA_UF", 0.07)
    x0 = min(b[0] for b in bu.values()); y0 = min(b[1] for b in bu.values()); x1 = max(b[2] for b in bu.values()); y1 = max(b[3] for b in bu.values())
    geo = {"vb": f"{x0 - 3} {y0 - 3} {x1 - x0 + 6} {y1 - y0 + 6}", "p": pu}
    return mgeo, geo


def main():
    PASTA_SAIDA.mkdir(exist_ok=True)
    dados = {"cases": casos()}
    cov, tot, cov2, tot2, mun = cobertura_tabnet()
    c_pain, t_pain, meses = painel_mensal()
    mun_pain, vac, c2_pain, t2_pain = painel_municipal()
    for uf, v in c_pain.items(): cov.setdefault(uf, {}).update(v)
    tot.update(t_pain)
    for uf, v in c2_pain.items(): cov2.setdefault(uf, {}).update(v)
    tot2.update(t2_pain); mun.update(mun_pain)
    dados.update(cov=cov, tot=tot, cov2=cov2, tot2=tot2, mun=mun, vac=vac, mes=meses)
    dados["pop"], pop_idade = populacao()
    dados["age"] = idade(pop_idade)
    dados["mgeo"], geo = malhas()
    with open(PASTA_SAIDA / "dados.js", "w", encoding="utf-8") as f:
        f.write("// Dados do painel (gerado por scripts/preparar_dados.py)\n")
        f.write("const DATA=" + json.dumps(dados, ensure_ascii=False, separators=(",", ":")) + ";const GEO=" + json.dumps(geo, ensure_ascii=False, separators=(",", ":")) + ";\n")
    print("Pronto:", PASTA_SAIDA / "dados.js")


if __name__ == "__main__":
    main()
