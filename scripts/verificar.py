"""Compara o dados.js gerado por preparar_dados.py com outro dados.js (por exemplo, o que está publicado no painel).
Uso:  python verificar.py saida/dados.js ../dados.js"""
import json, re, sys


def carregar(caminho):
    texto = open(caminho, encoding="utf-8").read()
    dados = json.loads(re.search(r"const DATA=(\{.*?\});const GEO=", texto, re.S).group(1))
    geo = json.loads(re.search(r";const GEO=(\{.*?\});\s*$", texto.strip() + "\n", re.S).group(1))
    return dados, geo


def normalizar(chave, valor):
    if chave == "mun":                       # a ordem das cidades não importa
        return {ano: sorted(linhas, key=lambda r: (r[0], r[-1] if len(r) > 6 else r[1])) for ano, linhas in valor.items()}
    if chave == "mes": return sorted(valor)
    return valor


def main(a, b):
    da, ga = carregar(a); db, gb = carregar(b); ok = True
    for chave in sorted(set(da) | set(db)):
        igual = chave in da and chave in db and normalizar(chave, da[chave]) == normalizar(chave, db[chave])
        print(f"{chave:6s}", "igual" if igual else "DIFERENTE"); ok &= igual
    print("GEO    ", "igual" if ga == gb else "diferente (pode ser esperado: malha de origem diferente)")
    return ok


if __name__ == "__main__":
    sys.exit(0 if main(sys.argv[1], sys.argv[2]) else 1)
