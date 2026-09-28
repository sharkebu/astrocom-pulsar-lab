"""Build the dependency-free, offline-capable single HTML file."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent
html = (ROOT / "index.template.html").read_text(encoding="utf-8")
replacements = {
    "/* STYLE */": (ROOT / "style.css").read_text(encoding="utf-8"),
    "/* DATA */": "const CATALOGUE = " + (ROOT / "data/pulsars.json").read_text(encoding="utf-8") + ";\nconst POPULATION = " + (ROOT / "data/population.json").read_text(encoding="utf-8") + ";",
    "/* PHYSICS */": (ROOT / "physics.js").read_text(encoding="utf-8"),
    "/* STATE */": (ROOT / "state.js").read_text(encoding="utf-8"),
    "/* APP */": (ROOT / "app.js").read_text(encoding="utf-8"),
}
for marker, content in replacements.items():
    assert html.count(marker) == 1, marker
    html = html.replace(marker, content)
(ROOT / "dist").mkdir(exist_ok=True)
(ROOT / "dist/index.html").write_text(html, encoding="utf-8")
print(f"Built dist/index.html ({len(html.encode('utf-8')):,} bytes)")
