# USAFL Umpires — Nationals 2026 App

An all-in-one mobile web app for umpires at the USAFL National Championships
(Sarasota, FL · Oct 16–18, 2026). Pick your name once and the home screen shows
your next game, field and crew; see who's on every field hour by hour, ask the
tournament desk, and study for the rules quiz. Installable to the home screen
(PWA) and works offline.

Pure static HTML/CSS/JS — no build step, no dependencies. Fonts (Barlow
Condensed, SIL OFL) are bundled in `fonts/`.

**Preview game day:** add `?now=2026-10-17T09:40:00-04:00` to the URL to see the
app as if it were that moment (sticks for the browser tab's session).

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
sw.js                ← service worker (offline cache; data.js/live.json network-first)
admin.js             ← hidden admin area (#/admin), loaded on demand
live.json            ← announcement, event-detail edits, admin PIN hash (published from admin)
vendor/              ← SheetJS spreadsheet reader (Apache-2.0), used only by admin
icons/               ← app icons generated from the USAFLUA logo
tools/
  parse_schedule.py  ← regenerates data.js from the assignment spreadsheet
  serve.py           ← local dev server
fonts/               ← bundled Barlow Condensed (display face)
vercel.json          ← minimal static hosting config
```

## Admin page (update from a phone)

Open `<site>/#/admin` (not linked anywhere in the app) and enter the PIN
(default `2026` until changed in Admin → Settings). From there you can:

- **Upload new schedule** — pick Jeff's .xlsx on the phone; it's parsed in the
  browser, you see exactly who changed, then Publish.
- **Quick-edit assignments** — change a single slot without a spreadsheet.
- **Announcement** — a banner at the top of everyone's Home screen.
- **Event details** — fill in venues/times/notes for the Weekend guide.
- **Version history** — restore any earlier published schedule.

Publishing commits to this GitHub repo using a fine-grained token stored only on
the admin's phone (Admin → Settings has setup steps: repo-only access,
Contents: Read and write). Vercel redeploys and the admin page waits until the
change is live.

Schedule changes go to `data.js`; announcements, event edits and the PIN go to
`live.json`, which the app re-checks every few minutes.

## Updating the schedule from the command line

```bash
python3 tools/parse_schedule.py "path/to/USAFL Umpire Assignments.xlsx" > data.js
git commit -am "Update schedule" && git push
```

The spreadsheet layout is detected (header row by "F Name", time row above it,
day blocks where times restart). `admin.js` contains the same parser for the
in-browser upload — keep the two in step if the sheet format changes.

## Updating 2026 event details

Venue, hotel, dinner spots, and clinic times are marked TBD in `content.js`
(`window.TOURNAMENT` and `window.EVENTS`). Edit there as details are confirmed.

## Deploy (Vercel)

1. Push this repo to GitHub.
2. In Vercel → **Add New… → Project** → import the repo.
3. Framework Preset: **Other**. **Root Directory: leave as the default (`./`)** —
   the site is at the repo root, so no Root Directory override is needed.
4. Deploy. Every future `git push` redeploys automatically.
