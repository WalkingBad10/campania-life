#!/usr/bin/env python3
"""Proiezione metrica OSM -> griglia di gioco e generatore del patch cartografico.

Questo file e' l'entry point operativo: ricostruisce effettivamente le superfici
delle 11 mappe esterne leggendo le geometrie OSM reali salvate in osm-data/
(api.openstreetmap.org, licenza ODbL) e scrive client/src/game/osm-geometry.js.
Accanto al patch stampa il report degli ancoraggi e delle semplificazioni, così
la fedelta' dichiarata resta verificabile.

Uso:
    python3 qa/campania-open-code-1/osm_projection.py
"""
from __future__ import annotations

import json
import math

import build_osm_geometry as gen

GUGLIA = 261256738
GESU = 261249895
CROCE = 27179695
PIANURA_SQUARE = 580193824
PIANURA_CHURCH = 148046054
PIANURA_TOWNHALL = 262236201


def build() -> tuple[dict, dict]:
    """Genera il patch OSM usato dal gioco e lo restituisce per il report."""
    maps = {map_id: gen.build_map(map_id, cfg) for map_id, cfg in gen.CONFIG.items()}
    out = {
        "version": 1,
        "attribution": gen.ATTRIBUTION,
        "tileM": gen.TILE_M,
        "licenseUrl": "https://opendatacommons.org/licenses/odbl/1-0/",
        "maps": maps,
    }
    gen.OUT.write_text(
        "window.CL_OSM = " + json.dumps(out, separators=(",", ":"), ensure_ascii=False) + ";\n"
    )
    return maps, out


def report(maps: dict, out: dict) -> None:
    print("CAMPANIA OPEN CODE 1 — proiezione OSM -> griglia e patch applicato")
    print(f"{out['attribution']}")
    print(f"TILE = {gen.TILE_M} m; output = {gen.OUT}")
    print()
    for map_id, spec in maps.items():
        anchors = ", ".join(
            f"{a['spec']}->{tuple(a['grid'])}" for a in spec["anchors"]
        ) or "nessuno"
        st = spec["stats"]
        print(f"{map_id:12s} tiles={st['tiles']:5d} props={st['props']:3d} "
              f"buildings={st['buildings']:3d} compression="
              f"{spec['projection']['compression']:.2f} | {anchors}")

    # Verifica storica del centro di Napoli, ora ricalcolata dagli stessi dati OSM
    # che generano il patch (non da un file temporaneo).
    cfg = gen.CONFIG["napoli"]
    nodes, ways, origin = gen.load(cfg)
    pts = {
        "guglia": gen.feature_point("way:%d:centroid" % GUGLIA, nodes, ways, origin, 1 / gen.TILE_M),
        "gesu_centro": gen.feature_point("way:%d:centroid" % GESU, nodes, ways, origin, 1 / gen.TILE_M),
        "gesu_prospetto": gen.feature_point("way:%d:south-face" % GESU, nodes, ways, origin, 1 / gen.TILE_M),
    }
    if all(pts.values()):
        print()
        d_facade = math.dist(pts["guglia"], pts["gesu_prospetto"]) / gen.TILE_M
        d_centro = math.dist(pts["guglia"], pts["gesu_centro"]) / gen.TILE_M
        d_game = math.dist((36, 26), (20, 14))
        print(f"Napoli Guglia->Gesu: prospetto OSM {d_facade:.1f} celle, gioco {d_game:.1f} celle "
              f"-> compressione frontale {d_game / d_facade:.2f}x")
        print(f"Distanza tra centroid OSM {d_centro:.1f} celle: il gioco ancoraggio il "
              f"prospetto, non il centro dell'edificio ({d_game / d_centro:.2f}x sul centro).")
    if CROCE in ways:
        pts_c = [gen.to_meters(nodes[n]["lat"], nodes[n]["lon"], origin)
                 for n in ways[CROCE].get("nodes", []) if n in nodes]
        if len(pts_c) >= 2:
            a, b = pts_c[0], pts_c[-1]
            ang = math.degrees(math.atan2(b[1] - a[1], b[0] - a[0]))
            print(f"Asse Via Benedetto Croce: {ang:.1f} gradi (est=0, nord=90)")

    print()
    print("Semplificazioni dichiarate:")
    print("- La viewport logica (480x270 px = 60x34 m) non puo' contenere la piazza reale "
          "e il fronte del Gesu' alla distanza OSM senza ridurre l'adulto sotto 9x14 px.")
    print("- Le compressioni riportate sopra sono misurate tra ancoraggi OSM reali, non stimate.")
    print("- La pavimentazione deriva dai tag surface=sett/paving_stones; il disegno del "
          "basolato e' stilizzato, non una fototessera della lastricatura.")
    print("- Le distanze superiori alla viewport (es. Castello di Baia, Reggia di Caserta) "
          "restano facciate metriche M1 e non vengono forzate nella griglia.")
    print("- I percorsi giocabili preesistenti sono protetti dal patch: nessuna strada nuova "
          "viene inventata per collegare spawn, portali, POI e residenti.")

    # Pianura: riporta le distanze reali tra ancoraggi verificati, così la
    # semplificazione di scala resta esplicita e non viene mascherata da un
    # posizionamento arbitrario dei POI nella piazza.
    cfg = gen.CONFIG["pianura"]
    nodes, ways, origin = gen.load(cfg)
    def point(spec: str):
        return gen.feature_point(spec, nodes, ways, origin, 1 / gen.TILE_M)
    square = point("way:%d:centroid" % PIANURA_SQUARE)
    church = point("way:%d:centroid" % PIANURA_CHURCH)
    townhall = point("way:%d:centroid" % PIANURA_TOWNHALL)
    if square and church and townhall:
        print()
        print(f"Pianura Piazza San Giorgio->chiesa: {math.dist(square, church) / gen.TILE_M:.1f} celle OSM "
              f"-> 15 celle nel gioco (facciata metrica ancorata).")
        print(f"Pianura Piazza San Giorgio->Municipio: {math.dist(square, townhall) / gen.TILE_M:.1f} celle OSM "
              f"-> bordo ovest compresso e dichiarato; la stazione Circumflegrea "
              f"(40.8560001,14.1624307) resta fuori griglia, quindi solo varco metro, non fabbricato.")


if __name__ == "__main__":
    built_maps, built_out = build()
    report(built_maps, built_out)
