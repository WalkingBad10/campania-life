#!/usr/bin/env python3
"""Ritocco deterministico degli asset M1 già inclusi nel progetto.

Non introduce texture nuove o casuali: modifica solo i pixel degli asset
autorevoli per avvicinarli alle foto di riferimento analizzate dal modello VL.

- Guglia dell'Immacolata: nicchie/statue intermedie, bassorilievi, colonne
  tortili e balaustra sul basamento.
- Gesù Nuovo:_bugnato in pietra vulcanica scura, senza toccare le aperture e
  le cornici chiare.
"""
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
PIXELS = ROOT / "client" / "public" / "assets" / "pixel"


def darken_stone(filename: str, strength: float = 0.80) -> None:
    path = PIXELS / filename
    im = Image.open(path).convert("RGBA")
    out = im.copy()
    src, dst = im.load(), out.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = src[x, y]
            if a < 100:
                continue
            lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
            spread = max(r, g, b) - min(r, g, b)
            # Solo la pietra grigia/antracite: vetri, dorature e cornici chiare
            # restano inalterati, così il contratto architettonico non crolla.
            if 58 <= lum <= 175 and spread <= 46:
                dst[x, y] = (
                    max(18, round(r * strength)),
                    max(16, round(g * strength)),
                    max(18, round(b * strength)),
                    a,
                )
    out.save(path)


def add_guglia_details() -> None:
    path = PIXELS / "guglia.png"
    im = Image.open(path).convert("RGBA")
    layer = Image.new("RGBA", im.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)

    # Nicchie e piccole statue a mezza altezza: la foto reale ha sculture e
    # bassorilievi scanditi lungo il fusto, non una colonna liscia.
    for y in (96, 128, 160):
        d.ellipse((55, y - 5, 71, y + 7), fill=(35, 39, 45, 225))
        d.rectangle((55, y + 2, 71, y + 18), fill=(35, 39, 45, 225))
        d.ellipse((60, y + 1, 66, y + 7), fill=(214, 209, 196, 235))
        d.rectangle((62, y + 6, 64, y + 15), fill=(199, 194, 181, 230))
        d.line((52, y + 20, 74, y + 20), fill=(234, 226, 208, 190), width=2)

    # Cornici intermedie in rilievo.
    for y in (84, 116, 148, 180):
        d.line((51, y, 75, y), fill=(238, 230, 212, 205), width=2)
        d.line((51, y + 2, 75, y + 2), fill=(88, 84, 79, 150), width=1)

    # Basamento: colonne tortili e balaustra, come nel monumento reale.
    for x in (26, 42, 84, 100):
        for y in range(184, 208, 4):
            d.line((x - 2, y, x + 2, y + 2), fill=(232, 224, 207, 210), width=2)
            d.line((x + 2, y + 2, x - 2, y + 4), fill=(112, 106, 98, 175), width=1)
    d.line((18, 210, 108, 210), fill=(235, 227, 210, 215), width=3)
    d.line((16, 222, 110, 222), fill=(150, 143, 130, 200), width=2)
    for x in range(20, 109, 7):
        d.line((x, 211, x, 221), fill=(220, 213, 198, 205), width=2)
        d.ellipse((x - 1, 209, x + 1, 211), fill=(243, 236, 220, 210))

    # Tutto il ritocco resta dentro la sagoma originale: nessun rettangolo
    # opaco aggiunto attorno al monumento.
    mask = ImageChops.multiply(layer.getchannel("A"), im.getchannel("A"))
    layer.putalpha(mask)
    Image.alpha_composite(im, layer).save(path)


if __name__ == "__main__":
    darken_stone("m1-gesu_facade_ref.png", 0.80)
    darken_stone("gesu-facade.png", 0.80)
    add_guglia_details()
    print("Ritocco M1 applicato: guglia, gesu-facade, m1-gesu_facade_ref")
