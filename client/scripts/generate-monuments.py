#!/usr/bin/env python3
"""Genera gli asset monumentali metrici per Campania Life.

Scala unica: PX_PER_M = 8.

Guglia dell'Immacolata:
    impronta OSM 15,71 m -> 126 px;
    monumento completo (pavimento -> Immacolata dorata) ~30 m -> 240 px.
    I 22 m del solo obelisco in marmo non sono l'altezza totale: la fonte
    fotografica M1 (128x176) e' l'asset autoritativo, ma il suo fusto e'
    compresso. `build_guglia_30m()` lo ricompone per architettura (statua,
    fusto, plinto, gradini); viene chiamato SOLO con --force-guglia, perche'
    un asset M1 esistente non deve mai essere sovrascritto in automatico.

Campanile di Santa Chiara:
    OSM 48 m -> 384 px, pianta 14 m -> 112 px. Il disegno procedurale e'
    ricalcolato in proporzione (non ritagliato né stirato da un bitmap).
"""
import argparse
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw

OUT = Path(__file__).resolve().parents[1] / 'public' / 'assets' / 'pixel'
OUT.mkdir(parents=True, exist_ok=True)

GUGLIA = OUT / 'guglia.png'
CAMPANILE = OUT / 'campanile.png'
DIST_GUGLIA = Path(__file__).resolve().parents[1] / 'dist' / 'assets' / 'pixel' / 'guglia.png'

# Tagli della silhouette M1, ricavati dall'analisi riga per riga dell'alpha.
# Ogni intervallo e' (inizio, fine-esclusiva) sull'originale 128x176.
STATUE = (0, 35)        # coronamento, Immacolata e sua base
UPPER_CORNICE = (35, 47)  # cornice superiore del fusto
SHAFT = (47, 74)        # campo marmoreo stretto del fusto
LOWER_CORNICE = (74, 92)  # fascia inferiore con rilievi
PLINTH = (92, 147)      # plinto a gradoni con le statue
STEPS = (147, 176)      # gradinata finale

SOURCE_SIZE = (128, 176)
TARGET_SIZE = (126, 240)


def box(d, x0, y0, x1, y1, color):
    d.rectangle([x0, y0, x1, y1], fill=color)


def alpha_spans(im, threshold=16):
    """Silhouette riga per riga: (xmin, xmax, conteggio) per alpha > soglia."""
    a = im.getchannel('A')
    spans = []
    for y in range(im.height):
        xs = [x for x in range(im.width) if a.getpixel((x, y)) > threshold]
        spans.append((xs[0], xs[-1], len(xs)) if xs else (None, None, 0))
    return spans


def resize_rgba(im, size):
    """Resize LANCZOS con alpha premoltiplicato: niente aloni scuri sui bordi."""
    r, g, b, a = im.split()
    premul = Image.merge('RGBA', (
        ImageChops.multiply(r, a),
        ImageChops.multiply(g, a),
        ImageChops.multiply(b, a),
        a,
    ))
    resized = premul.resize(size, Image.Resampling.LANCZOS)
    rr, gg, bb, aa = resized.split()
    inv = [0 if v == 0 else min(255, round(255 * 255 / v)) for v in range(256)]
    lut = aa.point(inv)
    return Image.merge('RGBA', (
        ImageChops.multiply(rr, lut),
        ImageChops.multiply(gg, lut),
        ImageChops.multiply(bb, lut),
        aa,
    ))


def find_m1_source():
    """Usa l'M1 intatto; dopo un --force-guglia può servire la copia in dist."""
    for candidate in (GUGLIA, DIST_GUGLIA):
        if not candidate.exists():
            continue
        with Image.open(candidate) as probe:
            if probe.size == SOURCE_SIZE:
                return candidate
    raise SystemExit(
        'Sorgente M1 128x176 non trovata: ripristina guglia.png oppure '
        'client/dist/assets/pixel/guglia.png.'
    )


def lengthen_shaft(src):
    """Allunga SOLO il fusto marmoreo, non l'intera fotografia.

    Le cornici restano a risoluzione nativa; il campo marmoreo viene
    ricostruito con resampling LANCZOS dedicato (27 -> 91 righe), con le
    prime/ultime due righe riscritte dal sorgente per giunti invisibili e
    alcune venature orizzontali prelevate dal marmo originale.
    """
    target_h = 91  # 240 - (35 + 12 + 18 + 55 + 29)
    shaft = resize_rgba(src, (SOURCE_SIZE[0], target_h))
    # Giunti esatti con le cornici: riprendi le righe originali dei due estremi.
    shaft.paste(src.crop((0, 0, 128, 2)), (0, 0))
    shaft.paste(src.crop((0, 25, 128, 27)), (0, target_h - 2))

    # Tre leggere assise di marmo, campionate dal fusto stesso (non inventate).
    joint = src.crop((0, 13, 128, 15))
    joint = resize_rgba(joint, (128, 3))
    joint.putalpha(joint.getchannel('A').point(lambda v: round(v * 0.35)))
    for y in (24, 46, 68):
        region = shaft.crop((0, y, 128, y + 3))
        region.alpha_composite(joint)
        shaft.paste(region, (0, y))
    return shaft


def build_guglia_30m():
    """Ricompatta l'M1 in 126x240: fusto allungato, altre parti invariate."""
    source_path = find_m1_source()
    with Image.open(source_path) as fh:
        src = fh.convert('RGBA')
    if src.size != SOURCE_SIZE:
        raise SystemExit(f'Sorgente M1 inattesa: {src.size}')

    spans = alpha_spans(src)
    # Verifica delle soglie silhouette usate per isolare i quattro elementi.
    assert spans[STEPS[0]][2] > 90, 'gradini non rilevati'
    assert spans[PLINTH[0]][1] - spans[PLINTH[0]][0] > 50, 'plinto non rilevato'
    assert spans[SHAFT[0]][2] <= 24, 'fusto non rilevato'

    def part(bounds):
        return src.crop((0, bounds[0], SOURCE_SIZE[0], bounds[1]))

    pieces = [
        part(STATUE),
        part(UPPER_CORNICE),
        lengthen_shaft(part(SHAFT)),
        part(LOWER_CORNICE),
        part(PLINTH),
        part(STEPS),
    ]
    assert sum(p.height for p in pieces) == TARGET_SIZE[1]

    canvas = Image.new('RGBA', (SOURCE_SIZE[0], TARGET_SIZE[1]), (0, 0, 0, 0))
    y = 0
    for piece in pieces:
        canvas.alpha_composite(piece, (0, y))
        y += piece.height

    # Unica trasformazione orizzontale: 128 -> 126 px (15,71 m -> 15,75 m).
    out = resize_rgba(canvas, TARGET_SIZE)
    out.save(GUGLIA, optimize=True)
    return GUGLIA, out.size


def make_campanile():
    """Campanile di Santa Chiara: 48 m = 384 px, base 14 m = 112 px.

    Il disegno 50 m viene ricalcolato proporzionalmente (fattore 0,96) su
    coordinate vettoriali: non è un crop né uno stretch di un bitmap.
    """
    W, H = 112, 384
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)

    def y(v):
        """Rimappa l'altezza storica di progetto (400 px / 50 m) a 384 px."""
        return round(v * H / 400)

    # Base scarpata ~9,6 m.
    d.polygon([(16, y(320)), (96, y(320)), (112, y(399)), (0, y(399))], fill='#8d7259')
    d.polygon([(16, y(320)), (56, y(320)), (56, y(399)), (0, y(399))], fill='#a08469')
    box(d, 16, y(316), 96, y(320), '#d6cbb7')

    # Primo e secondo ordine: laterizio con lesene e finestre.
    box(d, 18, y(176), 94, y(316), '#a85b46')
    box(d, 18, y(176), 23, y(316), '#8d4938')
    box(d, 89, y(176), 94, y(316), '#8d4938')
    for old in range(190, 312, 34):
        yy = y(old)
        box(d, 18, yy, 94, yy + 2, '#8d4938')
        for xx in (32, 56, 80):
            box(d, xx, yy + 4, xx + 8, yy + 20, '#3d4147')
            box(d, xx + 1, yy + 5, xx + 7, yy + 19, '#e7dfcf')
    box(d, 14, y(164), 98, y(175), '#d6cbb7')
    box(d, 16, y(166), 96, y(169), '#eee5d3')

    box(d, 20, y(70), 92, y(163), '#a85b46')
    box(d, 20, y(70), 25, y(163), '#8d4938')
    box(d, 87, y(70), 92, y(163), '#8d4938')
    for old in range(84, 156, 30):
        yy = y(old)
        box(d, 20, yy, 92, yy + 2, '#8d4938')
        box(d, 40, yy + 4, 48, yy + 18, '#3d4147')
        box(d, 64, yy + 4, 72, yy + 18, '#3d4147')
    box(d, 16, y(58), 96, y(69), '#d6cbb7')

    # Cella campanaria: tre archi e campane.
    box(d, 18, y(18), 94, y(57), '#c4b7a0')
    box(d, 20, y(21), 92, y(54), '#d8cdb8')
    for ax in (26, 50, 74):
        d.rectangle([ax, y(28), ax + 12, y(50)], fill='#3d4147')
        d.pieslice([ax, y(22), ax + 12, y(34)], 180, 360, fill='#3d4147')
        box(d, ax + 4, y(34), ax + 8, y(47), '#c9a44a')
        box(d, ax + 2, y(26), ax + 10, y(28), '#e7dfcf')
    box(d, 14, y(14), 98, y(18), '#6b5540')

    # Cuspide a maioliche.
    d.polygon([(10, y(14)), (56, y(0)), (102, y(14))], fill='#8b4a3a')
    d.polygon([(18, y(14)), (56, y(4)), (94, y(14))], fill='#3f8f86')
    d.polygon([(28, y(14)), (56, y(7)), (84, y(14))], fill='#d9b24f')
    box(d, 55, y(0), 58, y(4), '#d4b04f')

    im.save(CAMPANILE, optimize=True)
    return CAMPANILE, im.size


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        '--force-guglia', action='store_true',
        help='Ricompone guglia.png (126x240) dalla sorgente M1; '
             'senza questo flag l\'M1 esistente non viene toccato.',
    )
    args = parser.parse_args()

    if args.force_guglia:
        p, size = build_guglia_30m()
        print(f'{p.name}  {size[0]}x{size[1]}  (ricomposto da M1)')
    elif GUGLIA.exists():
        print(f'{GUGLIA.name}  M1 preservato (non riscritto)')
    else:
        print(f'{GUGLIA.name}  MANCANTE: usa --force-guglia per ricomporlo')

    p, size = make_campanile()
    print(f'{p.name}  {size[0]}x{size[1]}')


if __name__ == '__main__':
    main()
