"""Aprendizado de máquina do projeto: agrupamento (k-médias) de estados e de cidades.

O que o script faz
 1. Estados: junta os 27 estados em grupos parecidos, olhando (a) % de crianças vacinadas e (b) casos por 100 mil habitantes.
 2. Cidades: junta as cidades em grupos com histórico de vacinação parecido (1ª dose, de 2018 a 2025).
 3. Nos dois casos, testa de 2 a 6 grupos e fica com o número que separa melhor (maior "silhouette").

Uso:  python aprendizado_maquina.py [caminho/para/dados.js]
Grava em saida/: agrupamento_estados.csv, agrupamento_cidades.csv e perfis.js (usado pela página).
É um método que DESCREVE semelhanças; não prevê surtos nem prova causa.
"""
import csv, json, re, sys
import numpy as np
from config import PASTA_SAIDA

ANOS_CIDADES = [str(a) for a in range(2018, 2026)]     # anos usados no perfil das cidades
KS = range(2, 7)                                       # números de grupos testados


def carregar_dados(caminho):
    texto = open(caminho, encoding="utf-8").read()
    return json.loads(re.search(r"const DATA=(\{.*?\});const GEO=", texto, re.S).group(1))


def kmeans(X, k, iteracoes=30):
    """k-médias simples. Os centros iniciais são pontos espaçados ao longo da 1ª coluna (sem sorteio, para o resultado ser sempre o mesmo)."""
    n = len(X)
    ordem = np.argsort(X[:, 0], kind="stable")
    posicoes = [int(np.floor(i * (n - 1) / (k - 1) + 0.5)) for i in range(k)]
    centros = X[ordem[posicoes]].astype(float)
    for _ in range(iteracoes):
        dist = np.linalg.norm(X[:, None, :] - centros[None, :, :], axis=2)
        rotulos = dist.argmin(axis=1)
        for i in range(k):
            grupo = X[rotulos == i]
            if len(grupo): centros[i] = grupo.mean(axis=0)
    return rotulos


def silhouette(X, rotulos, k, bloco=500):
    """Nota de 'separação' dos grupos (de -1 a 1): quanto mais perto de 1, mais distintos entre si."""
    n = len(X)
    H = np.eye(k)[rotulos]                      # matriz "ponto x grupo"
    tamanhos = H.sum(axis=0)
    notas = np.zeros(n)
    for ini in range(0, n, bloco):
        D = np.linalg.norm(X[ini:ini + bloco, None, :] - X[None, :, :], axis=2)
        soma = D @ H                            # soma das distâncias a cada grupo
        for j in range(len(D)):
            i = ini + j; g = rotulos[i]
            if tamanhos[g] <= 1: continue       # grupo de 1 ponto: nota 0
            a = soma[j, g] / (tamanhos[g] - 1)
            b = min(soma[j, h] / tamanhos[h] for h in range(k) if h != g and tamanhos[h] > 0)
            notas[i] = (b - a) / max(a, b)
    return float(notas.mean())


def escolher_k(X):
    resultados = {}
    for k in KS:
        if k >= len(X): break
        rotulos = kmeans(X, k)
        if len(set(rotulos)) < k: continue      # algum grupo ficou vazio
        resultados[k] = (silhouette(X, rotulos, k), rotulos)
    melhor = max(resultados, key=lambda k: (round(resultados[k][0], 10), -k))   # empate: menos grupos
    return melhor, resultados


def estados(dados, ano_ini=2018, ano_fim=2026):
    ufs = sorted(dados["cases"])
    linhas, X = [], []
    for uf in ufs:
        anos_cov = [a for a in dados["cov"][uf] if ano_ini <= int(a) <= ano_fim]
        cov = dados["cov"][uf][max(anos_cov, key=int)]                       # cobertura do último ano com dado
        casos = sum(dados["cases"][uf].get(str(a), 0) for a in range(ano_ini, ano_fim + 1))
        anos_pop = [a for a in dados["pop"][uf] if ano_ini <= int(a) <= ano_fim]
        inc = casos / dados["pop"][uf][max(anos_pop, key=int)] * 1e5        # casos por 100 mil habitantes
        linhas.append([uf, cov, inc, casos]); X.append([cov, np.log10(inc + 1)])
    X = np.array(X); Z = (X - X.mean(axis=0)) / X.std(axis=0)                # padroniza (média 0, desvio 1)
    k, res = escolher_k(Z)
    rotulos = res[k][1]
    ordem = np.argsort([np.mean([l[1] for l, r in zip(linhas, rotulos) if r == g]) for g in range(k)])   # A = menor cobertura média
    letra = {int(g): "ABCDEF"[i] for i, g in enumerate(ordem)}
    return k, {kk: v[0] for kk, v in res.items()}, [(l, letra[int(r)]) for l, r in zip(linhas, rotulos)]


def cidades(dados):
    por_cidade = {}
    for ano in ANOS_CIDADES:
        for r in dados["mun"][ano]:
            if r[2] is not None: por_cidade.setdefault(r[6], {"uf": r[0], "nome": r[1], "cov": {}})["cov"][ano] = r[2]
    completas = {c: v for c, v in por_cidade.items() if len(v["cov"]) == len(ANOS_CIDADES)}   # só cidades com os 8 anos
    codigos = sorted(completas)
    X = np.clip(np.array([[completas[c]["cov"][a] for a in ANOS_CIDADES] for c in codigos]), 0, 120)   # limita valores absurdos
    k, res = escolher_k(X)
    rotulos = res[k][1]
    ordem = np.argsort([X[rotulos == g, -1].mean() for g in range(k)])     # A = menor cobertura em 2025
    posicao = {int(g): i for i, g in enumerate(ordem)}
    grupo = {c: posicao[int(r)] for c, r in zip(codigos, rotulos)}
    pos_grupo = np.array([grupo[c] for c in codigos])
    medias = [[round(float(X[pos_grupo == i][:, j].mean()), 1) for j in range(len(ANOS_CIDADES))] for i in range(k)]
    perfis = {"anos": [int(a) for a in ANOS_CIDADES], "k": k, "sil": {str(kk): round(v[0], 3) for kk, v in res.items()},
              "ids": list("ABCDEF"[:k]), "n": [int((pos_grupo == i).sum()) for i in range(k)], "media": medias,
              "g": grupo, "usadas": len(codigos), "total": len(por_cidade)}
    return perfis, completas


def main():
    caminho = sys.argv[1] if len(sys.argv) > 1 else str(PASTA_SAIDA / "dados.js")
    dados = carregar_dados(caminho); PASTA_SAIDA.mkdir(exist_ok=True)
    k, sils, linhas = estados(dados)
    print("ESTADOS: grupos testados e nota de separação:", {kk: round(v, 3) for kk, v in sils.items()}, "-> escolhido:", k)
    with open(PASTA_SAIDA / "agrupamento_estados.csv", "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f, delimiter=";"); w.writerow(["UF", "% vacinados (último ano)", "casos por 100 mil", "casos no período", "grupo"])
        for l, g in sorted(linhas, key=lambda x: (x[1], x[0][0])): w.writerow([l[0], round(l[1], 2), round(l[2], 2), l[3], g])
    perfis, completas = cidades(dados)
    print("CIDADES: grupos testados e nota de separação:", perfis["sil"], "-> escolhido:", perfis["k"], "| cidades usadas:", perfis["usadas"], "de", perfis["total"])
    for i, gid in enumerate(perfis["ids"]): print(f"  grupo {gid}: {perfis['n'][i]} cidades, cobertura média por ano {perfis['media'][i]}")
    with open(PASTA_SAIDA / "agrupamento_cidades.csv", "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f, delimiter=";"); w.writerow(["codigo", "UF", "cidade", "grupo"] + ANOS_CIDADES)
        for c in sorted(completas): w.writerow([c, completas[c]["uf"], completas[c]["nome"], perfis["ids"][perfis["g"][c]]] + [completas[c]["cov"][a] for a in ANOS_CIDADES])
    with open(PASTA_SAIDA / "perfis.js", "w", encoding="utf-8") as f:
        f.write("// Perfis de cidades (gerado por scripts/aprendizado_maquina.py)\nconst PERFIS=" + json.dumps(perfis, ensure_ascii=False, separators=(",", ":")) + ";\n")


if __name__ == "__main__":
    main()
