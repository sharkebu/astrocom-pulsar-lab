"""Refresh the explicitly curated Crab/Vela rows from the official Jodrell Bank table.

Review the diff before committing: upstream rows and references can change.
"""
from pathlib import Path
import json
import requests
from bs4 import BeautifulSoup

URL = "https://www.jb.man.ac.uk/pulsar/glitches/gTable.html"
DEST = Path(__file__).resolve().parents[1] / "data" / "glitches.json"
NAMES = {"0534+2200": "PSR J0534+2200", "0835-4510": "PSR J0835-4510"}

response = requests.get(URL, timeout=30)
response.raise_for_status()
soup = BeautifulSoup(response.content, "html.parser")


def number(value):
    return None if value in {"X", "", "-"} else float(value)


events = []
for row in soup.select("tr"):
    cells = [cell.get_text(" ", strip=True) for cell in row.find_all("td")]
    if len(cells) < 11 or cells[2] not in NAMES:
        continue
    events.append({
        "name": NAMES[cells[2]],
        "sequence": int(cells[3]),
        "mjd": number(cells[4]),
        "mjdUncertaintyDays": number(cells[5]),
        "deltaNuFractionNinth": number(cells[6]),
        "deltaNuFractionNinthUncertainty": number(cells[7]),
        "deltaNuDotFractionThousandth": number(cells[8]),
        "deltaNuDotFractionThousandthUncertainty": number(cells[9]),
        "reference": cells[10],
    })

assert sum(e["name"] == "PSR J0835-4510" for e in events) >= 26
assert sum(e["name"] == "PSR J0534+2200" for e in events) >= 10
record = {
    "source": "Jodrell Bank Pulsar Glitch Catalogue",
    "url": URL,
    "snapshot": "2026-09-28",
    "units": {"mjd": "day", "deltaNuFractionNinth": "10^-9", "deltaNuDotFractionThousandth": "10^-3"},
    "events": events,
}
DEST.write_text(json.dumps(record, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"Wrote {len(events)} verified Crab/Vela events to {DEST.name}")
