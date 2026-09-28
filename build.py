"""Build the dependency-free, offline-capable single HTML file."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent
html = (ROOT / "index.template.html").read_text(encoding="utf-8")
lab = (ROOT / "lab.template.html").read_text(encoding="utf-8")
match = re.search(r'<div class="app">(.*)</div>\s*<script>/\* DATA \*/', lab, re.S)
if not match:
    raise SystemExit("Could not extract the V2 Lab shell.")
lab_html = match.group(1)
lab_html = lab_html.replace('<main>', '<main>\n' + (ROOT / "lab-pages.html").read_text(encoding="utf-8"), 1)
lab_html = lab_html.replace('<nav class="tabs"', '<div id="lab-object-header" class="lab-object-header"></div><nav class="tabs"', 1)
replacements = {
    "/* STYLE */": (ROOT / "style.css").read_text(encoding="utf-8"),
    "/* V3_STYLE */": (ROOT / "style-v3.css").read_text(encoding="utf-8"),
    "/* LAB_HTML */": lab_html,
    "/* DATA */": "const CATALOGUE = " + (ROOT / "data/pulsars.json").read_text(encoding="utf-8") + ";\nconst POPULATION = " + (ROOT / "data/population.json").read_text(encoding="utf-8") + ";",
    "/* GLITCH_DATA */": "const GLITCHES = " + (ROOT / "data/glitches.json").read_text(encoding="utf-8") + ";",
    "/* PHYSICS */": (ROOT / "physics.js").read_text(encoding="utf-8"),
    "/* EXPORTS */": (ROOT / "exports.js").read_text(encoding="utf-8"),
    "/* STATE */": (ROOT / "state.js").read_text(encoding="utf-8"),
    "/* ROUTER */": (ROOT / "router.js").read_text(encoding="utf-8"),
    "/* APP */": (ROOT / "app.js").read_text(encoding="utf-8"),
    "/* LAB_PAGES_JS */": (ROOT / "v3-lab.js").read_text(encoding="utf-8"),
    "/* V3_APP */": (ROOT / "v3.js").read_text(encoding="utf-8"),
}
for marker, content in replacements.items():
    assert html.count(marker) == 1, marker
    html = html.replace(marker, content)
(ROOT / "dist").mkdir(exist_ok=True)
(ROOT / "dist/index.html").write_text(html, encoding="utf-8")
print(f"Built dist/index.html ({len(html.encode('utf-8')):,} bytes)")
