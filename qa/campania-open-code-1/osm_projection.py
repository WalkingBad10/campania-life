#!/usr/bin/env python3
"""Proiezione metrica OSM -> griglia di gioco, con confronto sugli ancoraggi.

Non e' un generatore di mappe: e' uno strumento di verifica. Legge le geometrie
OSM scaricate dal file JSON locale (api.openstreetmap.org, licenza ODbL), le
proietta in metri con una tangent plane attorno al centro della piazza, le
converte in celle da 2,0 m e confronta gli ancoraggi dichiarati nel gioco.

Ogni scarto viene riportato esplicitamente: una semplificazione documentata e'
preferibile a una fedelta' dichiarata ma non verificata.
"""
from __future__ import annotations

import json
import math
import statistics
from pathlib import Path

HERE = Path(__file__).resolve().parent
RAW = HERE.parent.parent / "client" / "src" / "game"
GEOM = Path("/private/var/folders/_s/02q2txw13sgf302965d4f1_m0000gn/T/opencode/visual-review/pro-review/osm-geom.json")

PIAZZA = 563345000
GUGLIA = 261256738
GESU = 261249895
CROCE = 27179695
TILE_M = 2.0

# Ancoraggi dichiarati in client/src/game/maps.js (function napoli()).
GAME = {
    "guglia": (36, 26),       # POI, tile
    "gesu": (20, 9),          # POI
    "croce": (63, 32),        # POI
    "piazza_center": (42, 27), # centro della pavimentazione pedonale
}


def load() -> dict[int, list[tuple[float, float]]]:
    data = json.loads(GEOM.read_text())
    return {int(k): [(float(a), float(b)) for a, b in v] for k, v in data.items()}


def projector(points):
    lat0 = statistics.mean(p[0] for p in points)
    lon0 = statistics.mean(p[1] for p in points)
    mlat = 111132.0
    mlon = 111320.0 * math.cos(math.radians(lat0))

    def xy(p):
        return ((p[1] - lon0) * mlon, (p[0] - lat0) * mlat)

    return xy


def center(xy, pts):
    xs, ys = zip(*(xy(p) for p in pts))
    return statistics.mean(xs), statistics.mean(ys)


def main():
    ways = load()
    allp = [p for pts in ways.values() for p in pts]
    xy = projector(allp)
    c_piazza = center(xy, ways[PIAZZA])
    c_guglia = center(xy, ways[GUGLIA])
    c_gesu = center(xy, ways[GESU])

    print("CAMPANIA OPEN CODE 1 — verifica proiezione OSM -> griglia")
    print(f"TILE = {TILE_M} m; origine = centro medio delle geometrie OSM")
    print()
    for wid, name in [(PIAZZA, "Piazza del Gesu Nuovo"), (GUGLIA, "Guglia dell'Immacolata"),
                      (GESU, "Chiesa del Gesu Nuovo"), (CROCE, "Via Benedetto Croce")]:
        pts = [xy(p) for p in ways[wid]]
        xs, ys = zip(*pts)
        print(f"{name:26s} way {wid}: {max(xs)-min(xs):6.1f} x {max(ys)-min(ys):6.1f} m "
              f"({(max(xs)-min(xs))/TILE_M:4.1f} x {(max(ys)-min(ys))/TILE_M:4.1f} celle)")

    def delta(a, b, ga, gb, label):
        dx, dy = a[0] - b[0], a[1] - b[1]
        gdx, gdy = ga[0] - gb[0], ga[1] - gb[1]
        real = (dx / TILE_M, dy / TILE_M)
        print(f"{label:34s} OSM ({real[0]:+6.1f},{real[1]:+6.1f}) celle | "
              f"gioco ({gdx:+3d},{gdy:+3d}) celle | scarto "
              f"({gdx-real[0]:+6.1f},{gdy-real[1]:+6.1f})")

    print()
    delta(c_guglia, c_piazza, GAME["guglia"], GAME["piazza_center"], "Guglia da centro piazza")
    delta(c_gesu, c_piazza, GAME["gesu"], GAME["piazza_center"], "Gesu da centro piazza")
    d_real = math.dist(c_guglia, c_gesu) / TILE_M
    d_game = math.dist(GAME["guglia"], GAME["gesu"])
    print(f"Distanza Guglia->Gesu: OSM {d_real:5.1f} celle, gioco {d_game:5.1f} celle "
          f"-> compressione {d_game/d_real:.2f}x")

    pts = [xy(p) for p in ways[CROCE]]
    ang = math.degrees(math.atan2(pts[-1][1] - pts[0][1], pts[-1][0] - pts[0][0]))
    print(f"Asse Via Benedetto Croce: {ang:.1f} gradi (est=0, nord=90)")

    print()
    print("Semplificazioni dichiarate:")
    print("- La viewport logica (480x270 px = 60x34 m) non puo' contenere la piazza reale "
          "e il fronte del Gesu' alla distanza OSM senza ridurre l'adulto sotto 9x14 px.")
    print("- Il gioco comprime l'asse nord-sud Guglia->Gesu'; gli ancoraggi dei portali "
          "sono preservati e lo scarto e' riportato sopra, non occultato.")
    print("- La pavimentazione e' derivata da surface=sett (way 563345000 e 27179695); "
          "il disegno del basolato e' stilizzato, non una fototessera della lastricatura.")


if __name__ == "__main__":
    main()
