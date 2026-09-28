"""Snapshot selected ATNF records from NASA HEASARC's ATNF TAP mirror.

Run manually when reviewing a catalogue update. Requires requests and astropy.
No network requests happen in the browser application.
"""

from io import BytesIO
import json
from pathlib import Path

import requests
from astropy.io.votable import parse
import numpy as np


ROOT = Path(__file__).resolve().parents[1]
URL = "https://heasarc.gsfc.nasa.gov/xamin/vo/tap/sync"
NAMES = [
    "PSR J0056+4756", "PSR J0332+5434", "PSR J0437-4715",
    "PSR J0534+2200", "PSR J0835-4510", "PSR J1748-2446ad",
    "PSR J1809-1943",
]
FIELDS = "name,alt_name,ra,dec,period,period_dot,dm,rm,distance,pulse_width_50,pulse_width_10,flux_400_mhz,flux_1400_mhz,pulsar_type,binary_model,assoc_object"


def query(sql):
    response = requests.post(URL, data={"REQUEST": "doQuery", "LANG": "ADQL", "QUERY": sql}, timeout=120)
    response.raise_for_status()
    table = parse(BytesIO(response.content)).get_first_table().to_table()
    def clean(value):
        if value is np.ma.masked or np.ma.is_masked(value):
            return None
        if isinstance(value, np.generic):
            value = value.item()
        if isinstance(value, str):
            return value.strip() or None
        return value
    return [{name: clean(row[name]) for name in table.colnames} for row in table]


def main():
    clauses = ",".join(f"'{name}'" for name in NAMES)
    rows = query(f"SELECT {FIELDS} FROM atnfpulsar WHERE name IN ({clauses})")
    by_name = {row["name"]: row for row in rows}
    missing = set(NAMES) - set(by_name)
    if missing:
        raise RuntimeError(f"Missing catalogue records: {missing}")
    (ROOT / "data").mkdir(exist_ok=True)
    objects = []
    for name in NAMES:
        row = by_name[name]
        # The mirror reports 0 for an absent Pdot on J1748-2446ad.
        if not row["period_dot"] or row["period_dot"] <= 0:
            row["period_dot"] = None
        row.update({"distance_method": None, "observedProfiles": [], "source": "NASA HEASARC ATNF mirror", "retrieved": "2026-09-28"})
        objects.append(row)
    (ROOT / "data" / "pulsars.json").write_text(json.dumps(objects, ensure_ascii=False, indent=2), encoding="utf-8")

    population = query("SELECT name,period,period_dot,pulsar_type,binary_model FROM atnfpulsar WHERE period_dot > 0")
    points = [[r["name"], float(r["period"]), float(r["period_dot"]), r["pulsar_type"], bool(r["binary_model"])]
              for r in population if r["period"] and r["period_dot"] and float(r["period"]) > 0]
    (ROOT / "data" / "population.json").write_text(json.dumps(points, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"Saved {len(objects)} featured records and {len(points)} P–Pdot points")


if __name__ == "__main__":
    main()
