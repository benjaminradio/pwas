#!/usr/bin/env python3
"""Build the GitHub Pages site: copy every app folder to OUT and generate OUT/index.html.

An "app" is any top-level folder containing index.html and manifest.webmanifest.
Its name, description and icon come from the manifest.
Usage: python3 scripts/build.py [OUT=_site]
"""
import html, json, shutil, sys
from pathlib import Path

root = Path(__file__).resolve().parent.parent
out = root / (sys.argv[1] if len(sys.argv) > 1 else "_site")
shutil.rmtree(out, ignore_errors=True)
out.mkdir(parents=True)

cards = []
for d in sorted(p for p in root.iterdir() if p.is_dir() and not p.name.startswith((".", "_")) and p.name != "scripts"):
    mf = d / "manifest.webmanifest"
    if not (d / "index.html").exists() or not mf.exists():
        continue
    shutil.copytree(d, out / d.name)
    m = json.loads(mf.read_text())
    icons = sorted(m.get("icons", []), key=lambda i: int(i.get("sizes", "0x0").split("x")[0]))
    icon = f'<img src="{d.name}/{html.escape(icons[0]["src"])}" alt="" width="56" height="56">' if icons else ""
    cards.append(f'<a class="card" href="{d.name}/">{icon}<span><strong>{html.escape(m.get("name", d.name))}</strong>'
                 f'<small>{html.escape(m.get("description", ""))}</small></span></a>')

(out / ".nojekyll").write_text("")
(out / "index.html").write_text(f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>My Apps</title>
<style>
:root{{--bg:#f1f5f9;--card:#fff;--fg:#0f172a;--mute:#64748b;--acc:#0284c7;--line:#cbd5e1}}
@media (prefers-color-scheme:dark){{:root{{--bg:#0f172a;--card:#1e293b;--fg:#f1f5f9;--mute:#94a3b8;--acc:#38bdf8;--line:#334155}}}}
body{{margin:0;background:var(--bg);color:var(--fg);font:16px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}}
main{{max-width:720px;margin:0 auto;padding:24px 16px}}
h1{{margin:0 0 4px}}p{{color:var(--mute);margin:0 0 20px}}
.card{{display:flex;gap:16px;align-items:center;padding:14px;margin-bottom:12px;background:var(--card);border:1px solid var(--line);border-radius:14px;color:inherit;text-decoration:none}}
.card:hover,.card:focus-visible{{border-color:var(--acc)}}
.card img{{border-radius:12px;flex:none}}
.card strong{{display:block;font-size:1.1rem}}.card small{{color:var(--mute);font-size:.9rem}}
</style></head><body><main>
<h1>My Apps</h1><p>Open an app, then use your browser's &ldquo;Add to Home Screen&rdquo; to install it.</p>
{chr(10).join(cards) or "<p>No apps yet.</p>"}
</main></body></html>
""")
print(f"Built {len(cards)} app(s) into {out}")
