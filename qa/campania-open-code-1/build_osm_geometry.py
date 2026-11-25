#!/usr/bin/env python3
"""Trasforma le geometrie OSM scaricate in patch di griglia per le 11 mappe esterne.

Output: client/src/game/osm-geometry.js (window.CL_OSM).

Il generatore usa esclusivamente dati OpenStreetMap reali (api.openstreetmap.org,
ODbL) salvati in osm-data/. Ogni mappa ha ancoraggi espliciti: le geometrie
vengono proiettate in metri e poi trasformate nella griglia di gioco. Le
semplificazioni (compressione lungo l'asse tra due ancoraggi) restano misurate
nel metadata, non nascoste.
"""
from __future__ import annotations

import json
import math
import statistics
from pathlib import Path

from shapely.geometry import LineString, Polygon, Point, box

HERE = Path(__file__).resolve().parent
DATA = HERE / "osm-data"
OUT = HERE.parent.parent / "client" / "src" / "game" / "osm-geometry.js"

TILE_M = 2.0
ATTRIBUTION = "© OpenStreetMap contributors — ODbL — retrieve 2026-11-25"

# id mappa -> (dataset, dimensione griglia, cella base, ancoraggi OSM, ancoraggi griglia)
# Gli ancoraggi OSM sono (lat, lon) di feature reali; quelli griglia sono celle.
CONFIG = {
    "napoli": dict(
        files=["piazza_gesu.json", "napoli_gesu.json"], w=72, h=48, base="p",
        anchors=[("way:261256738:centroid", (36, 26)),
                 ("way:261249895:south-face", (20, 14))],
        note="Guglia e fronte sud del Gesù; compressione misurata sull'asse.",
    ),
    "costiera": dict(
        files=["costiera.json"], w=72, h=40, base=".",
        anchors=[("node:4741283502", (20, 14))],
        note="Positano: fermata Chiesa Nuova ancorata alla viabilità reale.",
    ),
    "vesuvio": dict(
        files=["vesuvio.json"], w=64, h=48, base=".",
        anchors=[("way:1263655806:centroid", (32, 36))],
        note="Piazzale di quota 1000 e sentieri reali del Parco del Vesuvio.",
    ),
    "pompei": dict(
        files=["pompei.json"], w=56, h=40, base="g",
        anchors=[("node:318021222", (28, 20))],
        note="Scavi archeologici: point of information OSM ancorato al centro scavi.",
    ),
    "capri": dict(
        files=["capri.json"], w=30, h=24, base=".",
        anchors=[("node:2472122090", (15, 19))],
        note="Marina Grande: fermata OSM ancorata all'imbarco.",
    ),
    "bacoli": dict(
        files=["bacoli.json", "ways/144917231.json", "ways/249546668.json"], w=48, h=30, base=".",
        anchors=[("way:249546668:centroid", (24, 12))],
        note="Via Spiaggia ancorata; il Castello di Baia resta facciata metrica M1 (distanza OSM ~1 km non riproducibile nella viewport).",
    ),
    "salerno": dict(
        files=["salerno.json"], w=56, h=36, base="p",
        anchors=[("way:104213919:centroid", (12, 9))],
        note="Castello di Arechi e centro storico reali; il lungomare resta compresso.",
    ),
    "avellino": dict(
        files=["avellino.json"], w=48, h=32, base=".",
        anchors=[("way:157242032:centroid", (24, 16))],
        note="Piazza Duomo e centro storico irpino reali.",
    ),
    "caserta": dict(
        files=["caserta.json", "ways/1323664364.json"], w=60, h=40, base="p",
        anchors=[("way:34298618:centroid", (30, 22))],
        note="Piazza Dante e isolati reali; la Reggia resta la facciata metrica M1.",
    ),
    "fuorigrotta": dict(
        files=["fuorigrotta.json", "ways/226082932.json"], w=72, h=48, base="p",
        anchors=[("way:226082932:centroid", (52, 26))],
        note="Piazzale Tecchio e viabilità reale; lo stadio resta la facciata metrica M1.",
    ),
    "pianura": dict(
        files=["pianura.json", "ways/580193824.json", "ways/148046054.json",
               "ways/262236201.json"], w=64, h=40, base="p",
        anchors=[("way:580193824:centroid", (32, 23)),
                 ("way:148046054:centroid", (32, 8))],
        note=("Piazza San Giorgio, chiesa e borgo: doppio ancoraggio OSM. "
              "Piazza Municipio e' 130 m a ovest, compressa sul bordo; "
              "la stazione Circumflegrea e il Bar Etoile sono fuori bbox e restano "
              "solo targhe direzionali, non edifici inventati."),
        keepChars="rpgPdDeS,.",  # solo superfici: strade, marciapiedi, piazze, verde
    ),
}

PROTECT_TILES = {
    "napoli": [(58, 42), (26, 46), (58, 36), (59, 44), (26, 42)]
              + [(66 + i, 25 - i) for i in range(6)],
    # Le corsie dei veicoli e gli attraversamenti sono contratti di gameplay:
    # restano sulla carreggiata storica, mentre OSM ricostruisce il contesto.
    "costiera": [(x, y) for x in range(72) for y in (14, 15)]
                + [(21, 31), (63, 30)] + [(x, y) for y in range(24, 33) for x in (21, 63)],
    "vesuvio": [(30, 10), (30, 11), (30, 12), (31, 12), (32, 12)],
    "pompei": [(12, 29)] + [(x, y) for y in range(19, 25) for x in range(39, 48)],
    "capri": [(15, 19)],
    "bacoli": [(x, y) for x in range(48) for y in (11, 12)]
              + [(24, y) for y in range(11, 24)] + [(44, 22)],
    "salerno": [(12, 9), (28, 31)] + [(x, y) for x in range(56) for y in (18, 19)],
    "avellino": [(x, y) for x in (24, 25) for y in range(32)] + [(24, 21)],
    "caserta": [(30, y) for y in range(4, 32)]
               + [(x, y) for x in range(60) for y in (32, 33)],
    "fuorigrotta": [(11, 26), (11, 22), (19, 18), (52, 26), (64, 31),
                    (30, 19), (50, 36)]
                   + [(x, y) for x in range(72) for y in (18, 19, 35, 36)],
    "pianura": [(11, 36), (32, 17), (1, 27)]
               + [(x, y) for x in range(64) for y in (38, 39)]
               + [(x, y) for x in range(24, 37) for y in range(33, 40)]
               + [(x, y) for x in range(62) for y in (37, 38, 39)],
}

SOFT = set(".,pdreSg")
NEVER = set("YGDOKUEIHLFQb#=O^CTW~XPnquvwxyz1234567890")


def load(config: dict) -> tuple[dict[int, dict], dict[int, dict], tuple[float, float]]:
    nodes: dict[int, dict] = {}
    ways: dict[int, dict] = {}
    for name in config["files"]:
        path = DATA / name
        data = json.loads(path.read_text())
        for e in data.get("elements", []):
            if e.get("type") == "node":
                nodes[e["id"]] = e
            elif e.get("type") == "way":
                ways[e["id"]] = e
    if not nodes:
        return nodes, ways, (0.0, 0.0)
    origin = (statistics.mean(n["lat"] for n in nodes.values()),
              statistics.mean(n["lon"] for n in nodes.values()))
    return nodes, ways, origin


def to_meters(lat: float, lon: float, origin: tuple[float, float]) -> tuple[float, float]:
    lat0, lon0 = origin
    return ((lon - lon0) * 111320.0 * math.cos(math.radians(lat0)),
            (lat - lat0) * 111132.0)


def feature_point(spec: str, nodes: dict[int, dict], ways: dict[int, dict],
                  origin: tuple[float, float], scale: float) -> tuple[float, float] | None:
    if spec.startswith("node:"):
        node = nodes.get(int(spec[5:]))
        return to_meters(node["lat"], node["lon"], origin) if node else None
    if spec.startswith("way:"):
        parts = spec.split(":")
        wid = int(parts[1])
        way = ways.get(wid)
        if not way:
            return None
        pts = [to_meters(nodes[n]["lat"], nodes[n]["lon"], origin)
               for n in way.get("nodes", []) if n in nodes]
        if len(pts) < 2:
            return None
        if len(parts) > 2 and parts[2] == "south-face":
            # Lato sud del poligono: punto medio dell'edge a latitudine minima.
            best = None
            for a, b in zip(pts, pts[1:]):
                my = (a[1] + b[1]) / 2
                if best is None or my < best[0]:
                    best = (my, ((a[0] + b[0]) / 2, my))
            return best[1] if best else None
        return Polygon(pts).centroid.coords[0]
    if spec.startswith("name:"):
        name = spec[5:]
        for e in list(ways.values()) + list(nodes.values()):
            if e.get("tags", {}).get("name") == name:
                if e.get("type") == "node":
                    return to_meters(e["lat"], e["lon"], origin)
                pts = [to_meters(nodes[n]["lat"], nodes[n]["lon"], origin)
                       for n in e.get("nodes", []) if n in nodes]
                if len(pts) >= 2:
                    return Polygon(pts).centroid.coords[0] if len(pts) > 2 else LineString(pts).centroid.coords[0]
    return None


class Transform:
    def __init__(self, osm_pts: list[tuple[float, float]], grid_pts: list[tuple[int, int]]):
        self.osm = osm_pts
        self.grid = grid_pts
        if len(osm_pts) >= 2:
            dx, dy = osm_pts[1][0] - osm_pts[0][0], osm_pts[1][1] - osm_pts[0][1]
            gx, gy = grid_pts[1][0] - grid_pts[0][0], grid_pts[1][1] - grid_pts[0][1]
            d = math.hypot(dx, dy)
            gd = math.hypot(gx, gy)
            self.uo = (dx / d, dy / d)
            self.ug = (gx / gd, gy / gd)
            self.no = (-self.uo[1], self.uo[0])
            self.ng = (-self.ug[1], self.ug[0])
            self.s_parallel = gd / d
            self.s_perp = 1.0 / TILE_M
            self.compression = self.s_parallel / self.s_perp
        else:
            self.s_parallel = self.s_perp = 1.0 / TILE_M
            self.compression = 1.0

    def __call__(self, p: tuple[float, float]) -> tuple[float, float]:
        if len(self.osm) >= 2:
            v = (p[0] - self.osm[0][0], p[1] - self.osm[0][1])
            a = v[0] * self.uo[0] + v[1] * self.uo[1]
            b = v[0] * self.no[0] + v[1] * self.no[1]
            gx = self.grid[0][0] + a * self.s_parallel * self.ug[0] + b * self.s_perp * self.ng[0]
            gy = self.grid[0][1] + a * self.s_parallel * self.ug[1] + b * self.s_perp * self.ng[1]
            return gx, gy
        return (self.grid[0][0] + (p[0] - self.osm[0][0]) * self.s_perp,
                self.grid[0][1] - (p[1] - self.osm[0][1]) * self.s_perp)

    def meta(self) -> dict:
        if len(self.osm) >= 2:
            return {"type": "anchored-affine", "osmAnchors": self.osm,
                    "gridAnchors": self.grid, "parallelScale": self.s_parallel,
                    "perpendicularScale": self.s_perp,
                    "compression": self.compression}
        return {"type": "centered-metric", "osmAnchor": self.osm[0],
                "gridAnchor": self.grid[0], "scale": self.s_perp, "compression": 1.0}


def highway_tile(tags: dict) -> tuple[str, float] | None:
    h = tags.get("highway")
    if not h:
        return None
    if h in ("pedestrian", "footway", "path", "steps", "cycleway"):
        return ("e" if tags.get("surface") in ("sett", "paving_stones") or h == "pedestrian" else "p", 1.6)
    if h in ("residential", "living_street", "unclassified", "service"):
        return ("r", 2.0)
    if h in ("tertiary", "secondary", "primary", "trunk"):
        return ("r", 3.0)
    if h == "track":
        return ("p", 1.2)
    return None


def building_char(tags: dict) -> str:
    if tags.get("amenity") == "place_of_worship" or tags.get("building") in ("church", "cathedral", "basilica"):
        return "b"
    return "b"


def layer_geoms(nodes: dict, ways: dict, tr: Transform, w: int, h: int,
                origin: tuple[float, float]):
    layers = []
    for wid, way in ways.items():
        tags = way.get("tags", {})
        pts_m = [to_meters(nodes[n]["lat"], nodes[n]["lon"], origin)
                 for n in way.get("nodes", []) if n in nodes]
        if len(pts_m) < 2:
            continue
        pts = [tr(p) for p in pts_m]
        if not any(-8 <= x <= w + 8 and -8 <= y <= h + 8 for x, y in pts):
            continue
        try:
            if len(pts) >= 4 and pts[0] == pts[-1]:
                poly = Polygon(pts).simplify(0.12, preserve_topology=True)
                if poly.is_empty or not poly.is_valid:
                    continue
                is_ruin = tags.get("historic") in ("ruins", "archaeological_site",
                                                   "citywalls", "yes")
                if (tags.get("building") or tags.get("amenity") == "place_of_worship"
                        or is_ruin):
                    layers.append((wid, "building", building_char(tags), poly, tags.get("name", ""), 30))
                elif tags.get("highway") and tags.get("area") == "yes":
                    ch, _ = highway_tile(tags) or ("e", 1.6)
                    layers.append((wid, "area", ch, poly, tags.get("name", ""), 10))
                elif tags.get("natural") == "beach":
                    layers.append((wid, "sand", "S", poly, tags.get("name", ""), 6))
                elif tags.get("natural") == "water" or tags.get("waterway"):
                    layers.append((wid, "water", "W", poly, tags.get("name", ""), 8))
                elif tags.get("landuse") in ("grass", "forest", "meadow", "vineyard", "orchard") or tags.get("leisure") in ("park", "garden"):
                    layers.append((wid, "green", ",", poly, tags.get("name", ""), 5))
            else:
                ht = highway_tile(tags)
                if ht:
                    ch, width = ht
                    line = LineString(pts).simplify(0.12, preserve_topology=False)
                    layers.append((wid, "road", ch, line.buffer(width / 2), tags.get("name", ""), 20))
        except Exception:
            continue
    return layers


def rasterize(map_id: str, config: dict, layers, tr: Transform):
    w, h = config["w"], config["h"]
    # PROTECT_TILES uses (tx,ty) pairs; the grid is indexed [ty][tx].
    protected = {(ty, tx) for tx, ty in PROTECT_TILES.get(map_id, [])}
    tiles = []
    seen = {}
    for wid, kind, ch, geom, name, prio in sorted(layers, key=lambda a: a[5]):
        minx, miny, maxx, maxy = geom.bounds
        for ty in range(max(0, int(miny) - 1), min(h, int(maxy) + 2)):
            for tx in range(max(0, int(minx) - 1), min(w, int(maxx) + 2)):
                key = (ty, tx)
                if key in protected or key in seen:
                    continue
                if not geom.covers(Point(tx + .5, ty + .5)):
                    continue
                seen[key] = ch
                tiles.append([tx, ty, ch])
    return tiles


def osm_props(nodes: dict, ways: dict, tr: Transform, w: int, h: int,
              origin: tuple[float, float], limit: int = 90):
    props = []
    for node in nodes.values():
        t = node.get("tags", {})
        kind = None
        if t.get("natural") == "tree":
            kind = "plant"
        elif t.get("amenity") == "bench":
            kind = "bench"
        elif t.get("amenity") in ("street_lamp", "lamp") or t.get("man_made") == "street_lamp":
            kind = "lamp"
        elif t.get("amenity") in ("cafe", "bar", "restaurant"):
            kind = "table_out"
        if not kind:
            continue
        x, y = tr(to_meters(node["lat"], node["lon"], origin))
        tx, ty = int(x), int(y)
        if 0 <= tx < w and 0 <= ty < h:
            props.append([tx, ty, kind, t.get("name", "")])
    # Nessun arredo "derivato": solo nodi OSM con tag esplicito. Questo evita
    # lampioni o panchine inventati lungo le strade.
    # De-duplica e limita.
    out, seen = [], set()
    for p in props:
        key = (p[0], p[1], p[2])
        if key in seen:
            continue
        seen.add(key)
        out.append(p)
        if len(out) >= limit:
            break
    return out


def build_map(map_id: str, cfg: dict):
    nodes, ways, origin = load(cfg)
    osm_pts = []
    anchors = []
    for spec, grid in cfg["anchors"]:
        p = feature_point(spec, nodes, ways, origin, 1 / TILE_M)
        if p:
            osm_pts.append(p)
            anchors.append({"spec": spec, "grid": list(grid),
                            "meters": [round(v, 2) for v in p]})
    if len(osm_pts) != len(cfg["anchors"]):
        print("WARN ancoraggi mancanti", map_id, cfg["anchors"], anchors)
        if not osm_pts:
            osm_pts = [(0.0, 0.0)]
    tr = Transform(osm_pts, [a[1] for a in cfg["anchors"][:len(osm_pts)] or cfg["anchors"][:1]])
    layers = layer_geoms(nodes, ways, tr, cfg["w"], cfg["h"], origin)
    tiles = rasterize(map_id, cfg, layers, tr)
    props = osm_props(nodes, ways, tr, cfg["w"], cfg["h"], origin)
    buildings = [{"way": wid, "name": name, "bbox": [round(v, 2) for v in geom.bounds]}
                 for wid, kind, ch, geom, name, prio in layers if kind == "building"]
    keep_chars = cfg.get("keepChars", "")
    if keep_chars:
        # Le facciate metriche e le targhe del borgo sono ancoraggi verificati:
        # l'overlay puo' aggiungere suolo e impronte OSM, ma non cancellarle.
        tiles = [t for t in tiles if t[2] in keep_chars]
    return {
        "source": cfg["files"], "note": cfg["note"], "base": cfg["base"],
        "anchors": anchors, "projection": tr.meta(),
        "protected": PROTECT_TILES.get(map_id, []),
        "tiles": tiles, "props": props, "buildings": buildings[:400],
        "stats": {"tiles": len(tiles), "props": len(props), "buildings": len(buildings)},
    }


if __name__ == "__main__":
    maps = {}
    for config_id, cfg in CONFIG.items():
        maps[config_id] = build_map(config_id, cfg)
        s = maps[config_id]["stats"]
        print(f"{config_id:14s} tiles={s['tiles']:5d} props={s['props']:3d} "
              f"buildings={s['buildings']:3d} compression={maps[config_id]['projection']['compression']:.2f}")
    out = {
        "version": 1,
        "attribution": ATTRIBUTION,
        "tileM": TILE_M,
        "licenseUrl": "https://opendatacommons.org/licenses/odbl/1-0/",
        "maps": maps,
    }
    OUT.write_text("window.CL_OSM = " + json.dumps(out, separators=(",", ":"), ensure_ascii=False) + ";\n")
    print("SCRITTO", OUT, OUT.stat().st_size, "byte")
