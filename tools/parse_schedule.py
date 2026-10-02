#!/usr/bin/env python3
"""Parse a USAFL Nationals umpire assignment spreadsheet into data.js.

Usage: python3 tools/parse_schedule.py "<path to xlsx>" [--days sat,sun,finals] > data.js

The layout is detected rather than assumed, so new editions still parse:
  * header row = the row containing "F Name"; name/club/level columns found by their labels
  * time slots = the row above the header with the most time labels ("8am", "4:30pm", ...)
  * days = each run of increasing times is one day block (Sat, Sun, Finals by default)
  * discipline = first letter of the "Now" accreditation (F field, G goal, B boundary)

This mirrors the in-app admin parser (admin.js); keep the two in step.
"""
import json
import re
import sys
from datetime import datetime, timezone

from openpyxl import load_workbook

TIME_RE = re.compile(r"^\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)\s*$", re.I)
DISC = {"F": "field", "G": "goal", "B": "boundary"}
DEFAULT_DAYS = {1: ["sat"], 2: ["sat", "sun"], 3: ["sat", "sun", "finals"], 4: ["fri", "sat", "sun", "finals"]}
RANK = {"field": 5, "goal": 5, "boundary": 5, "ts": 5, "coach": 4, "duty": 4,
        "playing": 3, "watch": 2, "maybe": 1, "other": 2, "personal": 2, "off": 0}


def s(v):
    return "" if v is None else str(v).strip()


def norm(v):
    return s(v).lower()


def tmins(label):
    m = TIME_RE.match(label)
    h = int(m.group(1)) % 12 + (12 if m.group(3).lower() == "pm" else 0)
    return h * 60 + int(m.group(2) or 0)


def classify(raw, warn):
    """Turn a raw cell into a structured slot entry (or None for empty)."""
    v = s(raw)
    if not v:
        return None
    tentative = "?" in v
    clean = v.replace("?", "").strip().rstrip("/").strip()
    low = clean.lower()
    T = lambda **kw: {**kw, "tentative": tentative}

    if low in ("off", "no games"):
        return T(type="off", label="OFF")
    if low in ("personal", "mvl"):
        return T(type="personal", label="Personal")
    if low == "youth":
        return T(type="duty", label="Youth game")
    if clean.startswith("."):
        return T(type="coach", label=clean[1:].strip())
    if low.startswith("f marshall"):
        return T(type="duty", label="Field Marshall")
    for pat, typ in ((r"^field\s*(\d+)$", "field"), (r"^goal\s*(\d+)$", "goal"), (r"^bound\s*(\d+)$", "boundary"), (r"^ts\s*(\d+)$", "ts")):
        m = re.match(pat, low)
        if m:
            n = int(m.group(1))
            return T(type=typ, label=f"Field {n}", field=n)
    if re.search(r"\b(pre|play|post|loser|play in)\b", low):
        return T(type="playing", label="With club")
    if "watch" in low:
        return T(type="watch", label="Watching")
    if "coach" in low:
        return T(type="coach", label="Coaching")
    if low.startswith("[") or low == "tba":
        return {"type": "maybe", "label": clean.strip("[]"), "tentative": True}
    warn(f"Unrecognised entry '{v}'")
    return T(type="other", label=clean)


def parse(path, day_override=None):
    warnings = []
    warn = warnings.append
    ws = load_workbook(path, data_only=True).active
    maxr, maxc = ws.max_row, ws.max_column
    cell = lambda r, c: ws.cell(r, c).value

    # header row + labelled columns
    hdr = next((r for r in range(1, min(maxr, 60) + 1) for c in range(1, min(maxc, 40) + 1) if norm(cell(r, c)) == "f name"), None)
    if not hdr:
        raise SystemExit("Couldn't find the header row (a cell reading 'F Name').")

    def col(*labels, rows=(0,)):
        for dr in rows:
            for c in range(1, maxc + 1):
                if norm(cell(hdr + dr, c)) in labels:
                    return c
        return None

    C = {
        "first": col("f name"),
        "last": col("fi lname", "l name", "last name", "lname"),
        "men": col("men"),
        "women": col("women"),
        "now": col("now"),
        "try": col("try"),
        "commit": col("ft/pt", rows=(0, -1, -2)),
    }
    for k in ("first", "last", "now"):
        if not C[k]:
            raise SystemExit(f"Couldn't find the '{k}' column next to 'F Name'.")

    # time-slot row: the row above the header with the most time labels
    best = []
    for r in range(1, hdr):
        cols = [(c, s(cell(r, c))) for c in range(1, maxc + 1) if TIME_RE.match(s(cell(r, c)))]
        if len(cols) > len(best):
            best = cols
    if len(best) < 2:
        raise SystemExit("Couldn't find the row of game times (e.g. 8am, 9am …) above the header.")

    # split into day blocks wherever the time stops increasing
    blocks, prev = [], None
    for c, label in best:
        m = tmins(label)
        if prev is None or m <= prev:
            blocks.append([])
        blocks[-1].append((c, re.sub(r"\s+", "", label.lower())))
        prev = m
    days = day_override or DEFAULT_DAYS.get(len(blocks))
    if not days or len(days) != len(blocks):
        raise SystemExit(f"Found {len(blocks)} day blocks; pass --days to label them (e.g. --days sat,sun,finals).")
    slot_cols = [(c, d, t) for d, blk in zip(days, blocks) for c, t in blk]
    slot_order = [{"day": d, "time": t} for _, d, t in slot_cols]
    order_idx = {(d, t): i for i, (_, d, t) in enumerate(slot_cols)}

    title = next((s(cell(r, c)) for r in range(1, hdr) for c in range(1, maxc + 1) if re.search(r"version|assignments", s(cell(r, c)), re.I)), "")
    vm = re.search(r"version\s*0*(\d+)", title, re.I)

    people, last_section = {}, None
    for r in range(hdr + 1, maxr + 1):
        first, last = s(cell(r, C["first"])), s(cell(r, C["last"]))
        if not first or not last or first.upper() == "TBA":
            continue
        now = s(cell(r, C["now"]))
        section = DISC.get(now[:1].upper())
        if not section:
            if not last_section:
                warn(f"Row {r} ({first} {last}): no F/G/B level in 'Now'; skipped")
                continue
            section = last_section
            warn(f"Row {r} ({first} {last}): no F/G/B level in 'Now'; treated as {section}")
        last_section = section
        last_name = re.sub(r"^[A-Z] ", "", last)
        key = f"{first.lower()}|{last_name.lower()}"
        club_m = s(cell(r, C["men"])) if C["men"] else ""
        club_w = s(cell(r, C["women"])) if C["women"] else ""
        try_ = s(cell(r, C["try"])) if C["try"] else ""
        commit = s(cell(r, C["commit"])) if C["commit"] else ""
        slots = []
        for c, d, t in slot_cols:
            e = classify(cell(r, c), lambda m: warn(f"{first} {last_name}, {d} {t}: {m[0].lower() + m[1:]}"))
            if e:
                e["day"], e["time"] = d, t
                slots.append(e)

        if key in people:
            p = people[key]
            p["accreditation"][section] = now
            if try_ and try_ != "-":
                p["try"][section] = try_
            by = {(x["day"], x["time"]): x for x in p["slots"]}
            for e in slots:
                k2 = (e["day"], e["time"])
                if k2 not in by or RANK.get(e["type"], 0) > RANK.get(by[k2]["type"], 0):
                    by[k2] = e
            p["slots"] = sorted(by.values(), key=lambda x: order_idx[(x["day"], x["time"])])
            p["disciplines"].append(section)
        else:
            people[key] = {
                "id": re.sub(r"[^a-z0-9]+", "-", f"{first} {last_name}".lower()).strip("-"),
                "firstName": first,
                "lastName": last_name,
                "name": f"{first} {last_name}",
                "club": club_m if club_m and club_m != "N/A" else (club_w if club_w != "N/A" else ""),
                "isAussie": club_m.upper() == "OZ" or club_w.upper() == "OZ",
                "accreditation": {section: now},
                "try": ({section: try_} if try_ and try_ != "-" else {}),
                "commitment": commit,
                "counts": {},
                "disciplines": [section],
                "slots": slots,
            }

    if not people:
        raise SystemExit("No umpires found below the header row.")
    for p in people.values():
        cnt = {k: 0 for k in ("field", "goal", "boundary", "ts", "coach")}
        for e in p["slots"]:
            if e["type"] in cnt:
                cnt[e["type"]] += 1
        p["counts"] = cnt

    roster = sorted(people.values(), key=lambda p: (p["lastName"].lower(), p["firstName"].lower()))
    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    meta = {"title": title, "version": vm.group(1).zfill(3) if vm else "", "source": path.rsplit("/", 1)[-1],
            "publishedAt": now_iso, "publishId": now_iso, "days": days}
    return roster, slot_order, meta, warnings


def to_js(roster, slot_order, meta):
    return ("// Auto-generated schedule — published from the admin page or tools/parse_schedule.py. Do not hand-edit.\n"
            "window.UMPIRES = " + json.dumps(roster, indent=1) + ";\n"
            "window.SLOT_ORDER = " + json.dumps(slot_order) + ";\n"
            "window.SCHEDULE_META = " + json.dumps(meta) + ";\n")


if __name__ == "__main__":
    args = sys.argv[1:]
    days = None
    if "--days" in args:
        i = args.index("--days")
        days = args[i + 1].split(",")
        del args[i:i + 2]
    path = args[0] if args else "/Users/alison/Desktop/Claude/USAFL Umpire Assignments Prelim Oct 10.xlsx"
    roster, slot_order, meta, warnings = parse(path, days)
    sys.stdout.write(to_js(roster, slot_order, meta))
    print(f"Parsed {len(roster)} umpires · {len(slot_order)} time slots · days {meta['days']} · version {meta['version'] or '—'}", file=sys.stderr)
    for w in warnings:
        print("  warning:", w, file=sys.stderr)
