#!/usr/bin/env python3
"""Genera gli asset monumentali metrici per Campania Life.

Le dimensioni seguono qa/campania-open-code-1/PROPORTIONS.md:
  PX_PER_M = 8   ->   Guglia 22 m = 176 px, ingombro OSM 15,7 m = 126 px.

`guglia.png` NON viene rigenerato: e' l'asset M1 dettagliato (128x176) la cui
silhouette corrisponde gia' alle misure reali; era solo disegnato a meta'
dimensione dal motore. Viene invece generato `campanile.png`, che prima
esisteva solo come sprite procedurale 40x112. Lo script e' deterministico.
"""
from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parents[1] / 'public' / 'assets' / 'pixel'
OUT.mkdir(parents=True, exist_ok=True)


def box(d, x0, y0, x1, y1, color):
    d.rectangle([x0, y0, x1, y1], fill=color)


def make_guglia():
    W, H = 64, 176
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    cx = 32

    # Ombra a terra, dentro l'impronta solida.
    d.ellipse([5, 168, 59, 176], fill=(18, 22, 28, 60))

    # --- Gradinata: 0-1,5 m (12 px), larghezza 7 m (56 px) ---
    box(d, 4, 164, 59, 175, '#b8ac98')
    box(d, 4, 164, 59, 166, '#e2d9c7')
    box(d, 4, 173, 59, 175, '#958a78')
    box(d, 8, 156, 55, 163, '#cec3b0')
    box(d, 8, 156, 55, 158, '#ece3d1')
    box(d, 12, 149, 51, 155, '#c3b7a4')
    box(d, 12, 149, 51, 151, '#ded4c2')

    # --- Primo ordine: plinth 12-14 px + 4 statue (1,5-5 m) ---
    box(d, 12, 153, 51, 163, '#d3c9b6')
    box(d, 12, 153, 51, 155, '#efe7d7')
    box(d, 12, 160, 51, 163, '#aea290')
    for i in range(4):
        sx = 14 + i * 9
        box(d, sx, 150, sx + 6, 152, '#b3a793')          # predellino
        box(d, sx + 1, 140, sx + 5, 149, '#d9d0be')       # corpo
        box(d, sx + 1, 140, sx + 2, 149, '#efe7d6')       # luce
        box(d, sx + 2, 136, sx + 4, 140, '#cfc5b2')       # testa
        box(d, sx + 1, 135, sx + 5, 136, '#b8ad99')       # nimbo

    # --- Plinth intermedio con rilievi: 5-9 m (32 px), 4 m (32 px) ---
    box(d, 16, 132, 47, 135, '#c1b5a1')                  # cornice inferiore
    box(d, 16, 110, 47, 131, '#d6ccba')
    box(d, 16, 110, 18, 131, '#ebe2d0')
    box(d, 45, 110, 47, 131, '#b3a793')
    for i in range(4):
        rx = 18 + i * 7
        box(d, rx, 114, rx + 5, 127, '#e6ddcb')
        box(d, rx + 1, 115, rx + 4, 126, '#c6bba8')
        box(d, rx + 2, 117, rx + 3, 124, '#d9cfbc')       # rilievo centrale
    box(d, 14, 104, 49, 109, '#c9bda9')                  # cornice superiore
    box(d, 14, 104, 49, 106, '#eee5d3')

    # --- Fusto dell'obelisco: 9-18 m (72 px), rastremato 26 -> 18 px ---
    d.polygon([(19, 103), (44, 103), (41, 32), (23, 32)], fill='#cdc2ae')
    d.polygon([(19, 103), (23, 32), (26, 32), (23, 103)], fill='#e8dfcd')
    d.polygon([(41, 103), (44, 103), (41, 32), (38, 32)], fill='#ab9f8c')
    for yy in (92, 74, 54, 38):
        box(d, 20 + (103 - yy) // 9, yy, 43 - (103 - yy) // 9, yy + 2, '#a99d89')
    # Medaglioni bronzei sui lati del fusto.
    for yy in (84, 64):
        box(d, 19, yy, 21, yy + 6, '#c9a44a')
        box(d, 42, yy, 44, yy + 6, '#c9a44a')

    # --- Immacolata in rame e coronamento: 18-22 m (32 px) ---
    box(d, 24, 28, 40, 31, '#c9bda9')                    # basetta
    box(d, 26, 26, 38, 28, '#e2d8c4')
    # Mantello e figura in rame ossidato.
    d.polygon([(26, 26), (38, 26), (36, 12), (28, 12)], fill='#4f9a86')
    d.polygon([(26, 26), (29, 26), (30, 12), (28, 12)], fill='#79bca7')
    box(d, 29, 8, 35, 13, '#63ad97')                     # busto
    box(d, 30, 4, 34, 9, '#a9d6c4')                      # volto
    box(d, 29, 3, 35, 5, '#3f7c6b')                      # velo
    box(d, 27, 10, 29, 18, '#4f9a86')                    # braccio sinistro
    box(d, 35, 10, 37, 18, '#4f9a86')                    # braccio destro
    box(d, 30, 1, 34, 3, '#d4b04f')                      # corona
    box(d, 31, 0, 33, 2, '#f2d66b')                      # fiamma/croce

    path = OUT / 'guglia.png'
    im.save(path)
    return path, im.size


def make_campanile():
    """Campanile di Santa Chiara: 50 m = 400 px, base 14 m = 112 px."""
    W, H = 112, 400
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)

    # Base scarpata ~10 m = 80 px.
    d.polygon([(16, 320), (96, 320), (112, 399), (0, 399)], fill='#8d7259')
    d.polygon([(16, 320), (56, 320), (56, 399), (0, 399)], fill='#a08469')
    box(d, 16, 316, 96, 320, '#d6cbb7')

    # Primo e secondo ordine: laterizio con lesene e finestre.
    box(d, 18, 176, 94, 316, '#a85b46')
    box(d, 18, 176, 23, 316, '#8d4938')
    box(d, 89, 176, 94, 316, '#8d4938')
    for yy in range(190, 312, 34):
        box(d, 18, yy, 94, yy + 2, '#8d4938')
        for xx in (32, 56, 80):
            box(d, xx, yy + 4, xx + 8, yy + 20, '#3d4147')
            box(d, xx + 1, yy + 5, xx + 7, yy + 19, '#e7dfcf')
    box(d, 14, 164, 98, 175, '#d6cbb7')
    box(d, 16, 166, 96, 169, '#eee5d3')

    box(d, 20, 70, 92, 163, '#a85b46')
    box(d, 20, 70, 25, 163, '#8d4938')
    box(d, 87, 70, 92, 163, '#8d4938')
    for yy in range(84, 156, 30):
        box(d, 20, yy, 92, yy + 2, '#8d4938')
        box(d, 40, yy + 4, 48, yy + 18, '#3d4147')
        box(d, 64, yy + 4, 72, yy + 18, '#3d4147')
    box(d, 16, 58, 96, 69, '#d6cbb7')

    # Cella campanaria: tre archi e campane.
    box(d, 18, 18, 94, 57, '#c4b7a0')
    box(d, 20, 21, 92, 54, '#d8cdb8')
    for ax in (26, 50, 74):
        d.rectangle([ax, 28, ax + 12, 50], fill='#3d4147')
        d.pieslice([ax, 22, ax + 12, 34], 180, 360, fill='#3d4147')
        box(d, ax + 4, 34, ax + 8, 47, '#c9a44a')
        box(d, ax + 2, 26, ax + 10, 28, '#e7dfcf')
    box(d, 14, 14, 98, 18, '#6b5540')

    # Cuspide a maioliche.
    d.polygon([(10, 14), (56, 0), (102, 14)], fill='#8b4a3a')
    d.polygon([(18, 14), (56, 4), (94, 14)], fill='#3f8f86')
    d.polygon([(28, 14), (56, 7), (84, 14)], fill='#d9b24f')
    box(d, 55, 0, 58, 4, '#d4b04f')

    path = OUT / 'campanile.png'
    im.save(path)
    return path, im.size


if __name__ == '__main__':
    guglia = OUT / 'guglia.png'
    if not guglia.exists():
        make_guglia()  # fallback solo se l'asset M1 e' mancante
    p, size = make_campanile()
    print(f'{p.relative_to(OUT.parents[2])}  {size[0]}x{size[1]}')
    print(f'{guglia.relative_to(OUT.parents[2])}  M1 preservato (non riscritto)')
