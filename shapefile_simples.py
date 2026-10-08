"""Leitor mínimo de shapefile (.shp e .dbf) só com numpy, usado para converter as malhas do IBGE
em caminhos SVG leves. Cada polígono é arredondado para uma grade (quanto maior o passo, mais simples o desenho)."""
import struct, zipfile, tempfile
from pathlib import Path
import numpy as np


def abrir_zip(caminho_zip):
    pasta = Path(tempfile.mkdtemp())
    zipfile.ZipFile(caminho_zip).extractall(pasta)
    return str(next(pasta.glob("*.shp")))[:-4]


def ler_dbf(base):
    d = open(base + ".dbf", "rb").read()
    n, hl, rl = struct.unpack("<IHH", d[4:12])
    campos, off, i = [], 1, 32
    while d[i] != 0x0D:
        campos.append((d[i:i + 11].split(b"\0")[0].decode(), off, d[i + 16])); off += d[i + 16]; i += 32
    def coluna(nome):
        o, l = [(c[1], c[2]) for c in campos if c[0] == nome][0]
        return [d[hl + k * rl + o:hl + k * rl + o + l].decode("latin1").strip() for k in range(n)]
    return coluna


def caminhos_svg(base, coluna_id, passo, tamanho_id=None, inteiros=True, escala=None):
    """Devolve ({id: caminho SVG}, {prefixo_UF: [xmin, ymin, xmax, ymax]}).
    As coordenadas são lon/passo e -lat/passo, em números inteiros, com comandos relativos (mais compactos)."""
    ids = ler_dbf(base)(coluna_id)
    b = np.fromfile(base + ".shp", dtype=np.uint8); mv = memoryview(b)
    pos, reg, saida, caixas = 100, 0, {}, {}
    while pos < len(b):
        n = struct.unpack(">i", mv[pos + 4:pos + 8])[0] * 2; c = pos + 8; pos = c + n
        if struct.unpack("<i", mv[c:c + 4])[0] == 0:
            reg += 1; continue
        nparts, npts = struct.unpack("<ii", mv[c + 36:c + 44])
        partes = np.frombuffer(mv[c + 44:c + 44 + 4 * nparts], dtype="<i4")
        pts = np.frombuffer(mv[c + 44 + 4 * nparts:c + 44 + 4 * nparts + 16 * npts], dtype="<f8").reshape(-1, 2)
        ident = ids[reg][:tamanho_id] if tamanho_id else ids[reg]; reg += 1
        fim = list(partes[1:]) + [npts]; desenho = []
        for a, e in zip(partes, fim):
            r = pts[a:e]
            for g in (passo, passo / 3, passo / 8):          # municípios muito pequenos usam grade mais fina
                q = np.round(np.c_[r[:, 0] / g, -r[:, 1] / g]).astype(np.int64)
                q = q[np.r_[True, np.any(q[1:] != q[:-1], axis=1)]]
                if len(q) > 1 and (q[0] == q[-1]).all(): q = q[:-1]
                if len(q) >= 3: break
            if len(q) < 3: continue
            if g != passo: q = (q * (g / passo)).round().astype(np.int64)
            d0 = np.diff(q, axis=0)
            desenho.append(f"M{q[0,0]},{q[0,1]}l" + " ".join(f"{x},{y}" for x, y in d0) + "z")
            cx = caixas.setdefault(ident[:2], [1e9, 1e9, -1e9, -1e9])
            cx[0] = min(cx[0], int(q[:, 0].min())); cx[1] = min(cx[1], int(q[:, 1].min()))
            cx[2] = max(cx[2], int(q[:, 0].max())); cx[3] = max(cx[3], int(q[:, 1].max()))
        saida[ident] = "".join(desenho)
    return saida, caixas
