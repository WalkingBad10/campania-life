#!/usr/bin/env python3
"""Scarica geometrie OSM reali (api.openstreetmap.org, ODbL) per le località del gioco.

Ogni file salvato conserva i tag originali di way/node/relation e l'attribuzione.
I bbox sono volutamente piccoli per rispettare i limiti dell'API e ottenere
geometrie utilizzabili alla scala della viewport (60x34 m).
"""
from __future__ import annotations

import json
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE / "osm-data"
OUT.mkdir(exist_ok=True)

# bbox = (minlon, minlat, maxlon, maxlat)
BBOXES = {
    "napoli_gesu": (14.2500, 40.8460, 14.2530, 40.8485),
    "piazza_gesu": (14.2508, 40.8464, 14.2526, 40.8476),
    "fuorigrotta": (14.1860, 40.8220, 14.1970, 40.8310),
    "bacoli": (14.0800, 40.7950, 14.1050, 40.8150),
    "salerno": (14.7500, 40.6700, 14.7800, 40.6900),
    "avellino": (14.7800, 40.9150, 14.8100, 40.9350),
    "caserta": (14.3250, 41.0600, 14.3400, 41.0750),
    "pianura": (14.1730, 40.8600, 14.1800, 40.8660),
    "pompei": (14.4850, 40.7450, 14.5050, 40.7650),
    "costiera": (14.4750, 40.6200, 14.4900, 40.6350),  # Positano
    "capri": (14.2350, 40.5450, 14.2550, 40.5600),
    "vesuvio": (14.4100, 40.8150, 14.4500, 40.8400),
}


def fetch(name: str, bbox: tuple[float, float, float, float]) -> None:
    url = "https://api.openstreetmap.org/api/0.6/map.json?bbox=" + ",".join(str(v) for v in bbox)
    req = urllib.request.Request(url, headers={"User-Agent": "CampaniaLife-QA/1.0 (cartographic review)"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = json.load(resp)
    out = OUT / (name.replace(" ", "_").lower() + ".json")
    out.write_text(json.dumps(data, separators=(",", ":")) + "\n")
    ways = sum(1 for e in data.get("elements", []) if e.get("type") == "way")
    nodes = sum(1 for e in data.get("elements", []) if e.get("type") == "node")
    print(f"{out.name}: {nodes} nodi, {ways} way, {out.stat().st_size} byte")


if __name__ == "__main__":
    for name, bbox in BBOXES.items():
        try:
            fetch(name, bbox)
        except Exception as exc:
            print(f"ERR {name}: {exc}")
