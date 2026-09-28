"""Embed app.js in dist/index.html so the deliverable opens as one offline file."""

from pathlib import Path
import re


ROOT = Path(__file__).resolve().parent
page = ROOT / "dist" / "index.html"
script = (ROOT / "app.js").read_text(encoding="utf-8")
html = page.read_text(encoding="utf-8")
updated, count = re.subn(r"(?s)<script>.*?</script>", lambda _: f"<script>\n{script}\n</script>", html, count=1)
if count != 1:
    raise SystemExit("Could not find the inline application script.")
page.write_text(updated, encoding="utf-8")
