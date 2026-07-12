# USAFL Umpires — Nationals 2026 App

An all-in-one mobile web app for umpires at the USAFL National Championships
(Sarasota, FL · Oct 16–18, 2026). Search your name for your schedule, see who's
on each field hour by hour, ask the tournament assistant, shout out fellow
umpires, and study for the rules quiz. Installable to the home screen (PWA) and
works offline.

Pure static HTML/CSS/JS — no build step, no dependencies.

## Run locally

```bash
python3 tools/serve.py
# open http://127.0.0.1:5173
```

## Project layout

The site lives at the repo root so it deploys on Vercel with no configuration.

```
index.html           ← entry point
styles.css           ← all styling (white/orange liquid-glass theme)
app.js               ← views, routing, search, quiz, wall, Ask Jeff, install banner
content.js           ← tournament events, knowledge base, quiz, seed data (EDIT THIS for 2026 details)
data.js              ← GENERATED umpire roster + schedule (do not hand-edit)
manifest.webmanifest ← PWA manifest (installable app)
sw.js                ← service worker (offline cache; bump CACHE to force update)
icons/               ← app icons generated from the USAFLUA logo
tools/
  parse_schedule.py  ← regenerates data.js from the assignment spreadsheet
  serve.py           ← local dev server
vercel.json          ← minimal static hosting config
```

## Updating the umpire schedule

When a new assignment spreadsheet arrives:

```bash
python3 tools/parse_schedule.py "path/to/USAFL Umpire Assignments.xlsx" > data.js
git commit -am "Update schedule" && git push
```

Vercel redeploys automatically on push. Installed users pick up changes on next
open; to force it, bump `CACHE` in `sw.js`.

## Updating 2026 event details

Venue, hotel, dinner spots, and clinic times are marked TBD in `content.js`
(`window.TOURNAMENT` and `window.EVENTS`). Edit there as details are confirmed.

## Deploy (Vercel)

1. Push this repo to GitHub.
2. In Vercel → **Add New… → Project** → import the repo.
3. Framework Preset: **Other**. **Root Directory: leave as the default (`./`)** —
   the site is at the repo root, so no Root Directory override is needed.
4. Deploy. Every future `git push` redeploys automatically.
