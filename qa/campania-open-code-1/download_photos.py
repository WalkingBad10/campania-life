#!/usr/bin/env python3
"""Scarica fotografie reali da Wikimedia Commons per il confronto visivo.

Le immaglie sono usate SOLO come riferimento locale per il QA: non vengono
copiate nei pixel del gioco. Ogni file conserva autore e licenza in refs.json.
"""
from __future__ import annotations

import io
import json
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent
OUT = HERE / "photo-refs"
OUT.mkdir(exist_ok=True)
API = "https://commons.wikimedia.org/w/api.php"
UA = {"User-Agent": "CampaniaLife-QA/1.0 (cartographic review; educational)"}

QUERIES = {
    "napoli": "Piazza del Gesù Nuovo Napoli",
    "fuorigrotta": "Fuorigrotta Viale Augusto Napoli",
    "bacoli": "Castello di Baia",
    "salerno": "Salerno lungomare centro storico",
    "avellino": "Avellino centro storico piazza",
    "caserta": "Reggia di Caserta facciata piazza",
    "pianura": "Pianura Napoli piazza San Giorgio",
    "pompei": "Pompei Scavi archeologici",
    "costiera": "Positano Costiera Amalfitana",
    "capri": "Capri Piazzetta Napoli",
    "vesuvio": "Vesuvio parco nazionale sentiero",
}


def api(params: dict) -> dict:
    url = API + "?" + urllib.parse.urlencode(params)
    for attempt in range(5):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
                return json.load(r)
        except urllib.error.HTTPError as exc:
            if exc.code != 429 or attempt == 4:
                raise
            time.sleep(4 * (attempt + 1))
    return {}


def clean(text: str) -> str:
    import re
    return re.sub("<[^>]+>", "", text or "").strip()


def fetch(query: str, limit: int = 2) -> list[dict]:
    data = api({
        "action": "query", "generator": "search", "gsrsearch": query,
        "gsrnamespace": 6, "gsrlimit": limit, "prop": "imageinfo",
        "iiprop": "url|extmetadata", "iiurlwidth": 900, "format": "json",
    })
    refs = []
    for page in data.get("query", {}).get("pages", {}).values():
        info = (page.get("imageinfo") or [{}])[0]
        url = info.get("thumburl") or info.get("url")
        if not url:
            continue
        meta = info.get("extmetadata") or {}
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
                raw = r.read()
            im = Image.open(io.BytesIO(raw)).convert("RGB")
            im.thumbnail((900, 700))
            name = query.split()[0].lower().replace("à", "a").replace("ù", "u") + "-" + str(len(refs) + 1) + ".jpg"
            path = OUT / name
            im.save(path, quality=82, optimize=True)
            refs.append({
                "file": path.name,
                "title": page.get("title"),
                "author": clean(meta.get("Artist", {}).get("value", "")),
                "license": clean(meta.get("LicenseShortName", {}).get("value", "")),
                "source": info.get("descriptionurl", url),
                "query": query,
            })
        except Exception as exc:
            print("ERR immagine", page.get("title"), exc)
    return refs


if __name__ == "__main__":
    ref_file = OUT / "refs.json"
    all_refs = json.loads(ref_file.read_text()) if ref_file.exists() else {}
    for key, query in QUERIES.items():
        if all_refs.get(key):
            print(key, "già presente:", ", ".join(r["file"] for r in all_refs[key]))
            continue
        refs = fetch(query)
        if refs:
            all_refs[key] = refs
        print(key, len(refs), ", ".join(r["file"] for r in refs))
        time.sleep(2)
    ref_file.write_text(json.dumps(all_refs, indent=2, ensure_ascii=False) + "\n")
