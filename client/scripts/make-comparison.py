#!/usr/bin/env python3
"""Crea qa/campania-open-code-1/confronto-visivo.jpg.

Affianca inquadrature di gioco (emulazione Playwright) a fotografie reali e
all'ortofoto OSM/Esri, per la revisione umana richiesta prima della pubblicazione.
Lo script e' deterministico e non usa input dell'utente.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
QA = ROOT / 'qa' / 'campania-open-code-1'
REF = QA / 'references'

PANEL_W, PANEL_H = 480, 340
LABEL_H = 28
GAP = 6

ROWS = [
    ('GIOCO · Guglia vista da sud (36,30)', QA / 'macbook-napoli-guglia-davanti.png',
     'FOTO · Piazza del Gesu Nuovo', REF / 'naples_piazza_gesu_nuovo.jpg'),
    ('GIOCO · Guglia vista da nord (36,24)', QA / 'macbook-napoli-guglia-dietro.png',
     'FOTO · Obelisco dell Immacolata', REF / 'obelisco_immacolata3.jpg'),
    ('GIOCO · Prospetto del Gesu (20,18)', QA / 'macbook-napoli-gesu-prospetto.png',
     'FOTO · Piazza del Gesu', REF / 'piazza_del_gesu.jpg'),
    ('GIOCO · Santa Chiara e campanile (50,22)', QA / 'macbook-napoli-campanile.png',
     'ORTOFOTO · Guglia (OSM way 261256738)', REF / 'satellite-guglia-crop.png'),
]


def fit(img: Image.Image) -> Image.Image:
    """Ritaglio centrale alla proporzione del pannello, poi resize."""
    src = img.convert('RGB')
    target = PANEL_W / PANEL_H
    w, h = src.size
    if w / h > target:
        nw = round(h * target)
        src = src.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
    else:
        nh = round(w / target)
        src = src.crop((0, (h - nh) // 2, w, (h - nh) // 2 + nh))
    return src.resize((PANEL_W, PANEL_H), Image.Resampling.LANCZOS)


def main() -> None:
    row_h = LABEL_H + PANEL_H
    out = Image.new('RGB', (PANEL_W * 2 + GAP, row_h * len(ROWS) + GAP * (len(ROWS) - 1)), '#1b1b1b')
    d = ImageDraw.Draw(out)
    try:
        font = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf', 15)
    except OSError:
        font = ImageFont.load_default()
    for r, (l_title, l_path, r_title, r_path) in enumerate(ROWS):
        y = r * (row_h + GAP)
        for col, (title, path) in enumerate(((l_title, l_path), (r_title, r_path))):
            x = col * (PANEL_W + GAP)
            d.text((x + 8, y + 6), title, fill='#f2e9d8', font=font)
            panel = fit(Image.open(path))
            out.paste(panel, (x, y + LABEL_H))
    dest = QA / 'confronto-visivo.jpg'
    out.save(dest, quality=90)
    print(f'{dest.relative_to(ROOT)}  {out.width}x{out.height}')


if __name__ == '__main__':
    main()
