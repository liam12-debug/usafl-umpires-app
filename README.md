# USAFL Umpires — Nationals 2026 App

An all-in-one mobile web app for umpires at the USAFL National Championships
(Sarasota, FL · Oct 16–18, 2026). Search your name for your schedule, see who's
on each field hour by hour, ask the tournament assistant, shout out fellow
umpires, and study for the rules quiz.

Pure static HTML/CSS/JS — no build step, no dependencies.

## Run locally

```bash
python3 -m http.server 5173 --directory app
# open http://127.0.0.1:5173
```

## Project layout

```
app/                 ← the deployed site
  index.html         ← entry point
  styles.css         ← all styling (white/orange liquid-glass theme)
  app.js             ← views, routing, search, quiz, wall, Ask Jeff
  content.js         ← tournament events, knowledge base, quiz, seed data (EDIT THIS for 2026 details)
  data.js            ← GENERATED umpire roster + schedule (do not hand-edit)
tools/
  parse_schedule.py  ← regenerates app/data.js from the assignment spreadsheet
vercel.json          ← static hosting config
```

## Updating the umpire schedule

When a new assignment spreadsheet arrives:

```bash
python3 tools/parse_schedule.py "path/to/USAFL Umpire Assignments.xlsx" > app/data.js
git commit -am "Update schedule" && git push
```

Vercel redeploys automatically on push.

## Updating 2026 event details

Venue, hotel, dinner spots, and clinic times are marked TBD in
`app/content.js` (`window.TOURNAMENT` and `window.EVENTS`). Edit there as
details are confirmed.

## Deploy (Vercel)

1. Push this repo to GitHub.
2. In Vercel → **Add New… → Project** → import the repo.
3. Framework Preset: **Other**. **Root Directory: `app`**.
4. Deploy. Every future `git push` redeploys automatically.
