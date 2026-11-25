#!/usr/bin/env python3
"""Sostituisce i riferimenti fotografici non utili con foto reali verificate.

Le immagini restano SOLO riferimenti QA locali: non entrano nei pixel del gioco.
Ogni voce conserva titolo, autore, licenza e pagina Wikimedia Commons.
"""
from __future__ import annotations

import io
import json
import time
import urllib.error
import urllib.request
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent
OUT = HERE / "photo-refs"
UA = {"User-Agent": "CampaniaLife-QA/1.0 (cartographic review; educational)"}

REFRESH = {
    "avellino": [
        ("avellino-1.jpg", "File:Centro storico di Avellino.jpg", "Principe88", "Public domain",
         "https://commons.wikimedia.org/wiki/File:Centro_storico_di_Avellino.jpg",
         "https://upload.wikimedia.org/wikipedia/commons/8/8c/Centro_storico_di_Avellino.jpg"),
        ("avellino-2.jpg", "File:Avellino via Mancini.jpg", "Costangelopacilio", "CC BY-SA 4.0",
         "https://commons.wikimedia.org/wiki/File:Avellino_via_Mancini.jpg",
         "https://upload.wikimedia.org/wikipedia/commons/e/e1/Avellino_via_Mancini.jpg"),
    ],
    "caserta": [
        ("reggia-1.jpg", "File:Reggia di caserta, facciata.JPG", "Sailko", "CC BY 3.0",
         "https://commons.wikimedia.org/wiki/File:Reggia_di_caserta,_facciata.JPG",
         "https://upload.wikimedia.org/wikipedia/commons/2/2e/Reggia_di_caserta%2C_facciata.JPG"),
        ("reggia-2.jpg", "File:Piazza Dante in Caserta (1).jpg", "MOs810", "CC BY 4.0",
         "https://commons.wikimedia.org/wiki/File:Piazza_Dante_in_Caserta_(1).jpg",
         "https://upload.wikimedia.org/wikipedia/commons/9/9c/Piazza_Dante_in_Caserta_%281%29.jpg"),
    ],
    "pianura": [
        ("pianura-1.jpg", "File:Pianura.jpg", "Microinfo10", "CC BY-SA 4.0",
         "https://commons.wikimedia.org/wiki/File:Pianura.jpg",
         "https://upload.wikimedia.org/wikipedia/commons/1/1f/Pianura.jpg"),
        ("pianura-2.jpg", "File:Veduta Contrada Pisani (Napoli).jpg", "Aurelio96", "CC BY-SA 4.0",
         "https://commons.wikimedia.org/wiki/File:Veduta_Contrada_Pisani_(Napoli).jpg",
         "https://upload.wikimedia.org/wikipedia/commons/7/76/Veduta_Contrada_Pisani_%28Napoli%29.jpg"),
    ],
    "capri": [
        ("capri-1.jpg", "File:Marina Grande Capri.jpg", "Wolfgang Moroder", "CC BY-SA 3.0",
         "https://commons.wikimedia.org/wiki/File:Marina_Grande_Capri.jpg",
         "https://upload.wikimedia.org/wikipedia/commons/3/3a/Marina_Grande_Capri.jpg"),
        ("capri-2.jpg", "File:Capri island - Campania - Italy - July 12th 2013 - 16.jpg",
         "Norbert Nagel", "CC BY-SA 3.0",
         "https://commons.wikimedia.org/wiki/File:Capri_island_-_Campania_-_Italy_-_July_12th_2013_-_16.jpg",
         "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d8/Capri_island_-_Campania_-_Italy_-_July_12th_2013_-_16.jpg/960px-Capri_island_-_Campania_-_Italy_-_July_12th_2013_-_16.jpg"),
    ],
    "vesuvio": [
        ("vesuvio-1.jpg", "File:Vesuvio Cratere.jpg", "Photo2023", "CC BY 4.0",
         "https://commons.wikimedia.org/wiki/File:Vesuvio_Cratere.jpg",
         "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c3/Vesuvio_Cratere.jpg/960px-Vesuvio_Cratere.jpg"),
        ("vesuvio-2.jpg", "File:Cratere del Vesuvio (2018).jpg", "Horcrux", "CC BY-SA 4.0",
         "https://commons.wikimedia.org/wiki/File:Cratere_del_Vesuvio_(2018).jpg",
         "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/67/Cratere_del_Vesuvio_%282018%29.jpg/960px-Cratere_del_Vesuvio_%282018%29.jpg"),
    ],
}


def download(url: str, path: Path) -> None:
    raw = None
    for attempt in range(6):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=90) as r:
                raw = r.read()
            break
        except urllib.error.HTTPError as exc:
            if exc.code != 429 or attempt == 5:
                raise
            time.sleep(6 * (attempt + 1))
    if raw is None:
        raise RuntimeError("download failed: " + url)
    im = Image.open(io.BytesIO(raw)).convert("RGB")
    im.thumbnail((900, 700))
    im.save(path, quality=82, optimize=True)


def main() -> None:
    ref_file = OUT / "refs.json"
    refs = json.loads(ref_file.read_text())
    force = {"capri", "vesuvio", "salerno"}
    for key, entries in REFRESH.items():
        records = []
        for name, title, author, license_name, source, url in entries:
            path = OUT / name
            if key not in force and path.exists() and path.stat().st_size > 0:
                print(key, name, "già aggiornato")
            else:
                download(url, path)
            records.append({"file": name, "title": title, "author": author,
                            "license": license_name, "source": source, "query": key})
            print(key, name, path.stat().st_size, "byte")
        refs[key] = records
    salerno_extra = {
        "file": "salerno-2.jpg", "title": "File:Lungomare Salerno.jpg",
        "author": "Jack45", "license": "CC BY 3.0",
        "source": "https://commons.wikimedia.org/wiki/File:Lungomare_Salerno.jpg",
        "query": "Salerno lungomare centro storico",
    }
    salerno_path = OUT / salerno_extra["file"]
    if not (salerno_path.exists() and salerno_path.stat().st_size > 0):
        download("https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a9/Lungomare_Salerno.jpg/960px-Lungomare_Salerno.jpg",
                 salerno_path)
    if not any(r["file"] == salerno_extra["file"] for r in refs["salerno"]):
        refs["salerno"].append(salerno_extra)
    print("salerno salerno-2.jpg", (OUT / salerno_extra["file"]).stat().st_size, "byte")
    ref_file.write_text(json.dumps(refs, indent=2, ensure_ascii=False) + "\n")


if __name__ == "__main__":
    main()
