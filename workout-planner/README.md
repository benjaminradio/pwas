# Workout Planner (PWA)

Offline-capable app to schedule and track a training plan. No build step.

Run: `cd workout-planner && python3 -m http.server 8000`, open http://localhost:8000 (service workers need localhost or HTTPS), then "Install" / "Add to Home Screen".

- **Today**: opens on today's workout, plus the next one. *Focus* gives a large, phone-friendly view (step through parts, timers, A−/A+ text size, swipe, screen stays awake).
- **Plan**: week-by-week calendar; tap a day to add/remove/reorder/move workouts. Generate a plan from a weekly pattern (e.g. 12 weeks).
- **Workouts**: create/edit workouts made of multiple parts (details, notes, optional timer).
- **More**: rename plan, export/import JSON backup, reset to sample plan.

Data is stored in the browser's localStorage.
