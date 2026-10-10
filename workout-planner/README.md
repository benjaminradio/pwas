# Workout Planner (PWA)

A single `index.html` (HTML + CSS theme variables + ~100 lines of JS) plus a manifest, service worker and icons.

## Put it on your phone
Host the folder anywhere over HTTPS (e.g. GitHub Pages, Netlify), open the URL on your phone, then **Add to Home Screen**. It works offline after the first load. Locally: `python3 -m http.server` in this folder and open http://localhost:8000.

## Use
- **Today** – opens on today's workout, with the next one below. Tick off parts as you go. **Focus** opens a full-screen, large-text view (A−/A+ to resize, screen stays awake, current part highlighted).
- **Plan** – every week of the plan; tap a day to open it in focus view.
- **Edit** – the whole plan is plain text (format shown on that page): weekly pattern, per-week/per-date overrides, and workouts made of parts. Also a theme picker.

## Theming
All colors live in CSS variables at the top of `index.html`; add a `[data-theme=name]` block (and an `<option>`) for your own.

Data is stored in the browser's localStorage on that device.
