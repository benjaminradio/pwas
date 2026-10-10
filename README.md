# PWAs

Small installable web apps, one folder each.

| App | Folder |
| --- | --- |
| Workout Planner | [`workout-planner/`](workout-planner/) |

## Adding an app
Create a top-level folder with an `index.html` and a `manifest.webmanifest` (name, description and icons are used for the landing page). It appears on the site automatically after the next push to `main`. Keep asset paths relative so it works under `/<repo>/<folder>/`.

## GitHub Pages
One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**. The workflow in `.github/workflows/pages.yml` runs `scripts/build.py`, which generates the landing page at `https://<user>.github.io/<repo>/` linking every app.

Preview locally: `python3 scripts/build.py && python3 -m http.server -d _site`
