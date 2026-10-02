/* USAFL Umpires — admin area (#/admin). Loaded on demand by app.js.
   Publishing writes files to the GitHub repo with the admin's own token (kept only on their phone);
   Vercel redeploys on every commit, and the page polls the live site until the change shows up. */
(function () {
  "use strict";
  const A = window.USAFL;
  const { icon, esc, store, render, animateIn, staggerIn, openSheet, closeSheet, go, seg, wireSeg, empty } = A;

  const REPO = { owner: "liam12-debug", repo: "usafl-umpires-app", branch: "main" };
  const DEFAULT_PIN = "2026";
  const ACTIVE = new Set(["field", "goal", "boundary", "ts", "coach", "duty"]);
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const newId = () => new Date().toISOString().replace(/\.\d+Z$/, "Z") + "-" + Math.random().toString(36).slice(2, 6);
  const fmtDate = (iso) => (iso ? new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "—");
  const dayShort = (d) => A.DAY_SHORT[d] || d;

  // ---------- working state ----------
  // Quick edits are kept as a draft on this phone until published (discarded if a newer schedule goes live).
  const S = { umpires: clone(A.UMPIRES), slotOrder: clone(A.SLOT_ORDER), edits: [] };
  const draft = store.get("usafl.admin.draft", null);
  if (draft && draft.base === A.META.publishId) { S.umpires = draft.umpires; S.edits = draft.edits; }
  const saveDraft = () => store.set("usafl.admin.draft", { base: A.META.publishId, umpires: S.umpires, edits: S.edits });
  const clearDraft = () => { S.umpires = clone(A.UMPIRES); S.edits = []; store.del("usafl.admin.draft"); };

  // ---------- PIN gate ----------
  async function sha256(s) {
    const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("usafl-admin:" + s));
    return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
  }
  const unlocked = () => { try { return sessionStorage.getItem("usafl.admin.ok") === "1"; } catch { return false; } };
  const usingDefaultPin = () => !A.getLive().pinHash;

  function gate(then) {
    render(`
      <button class="back" onclick="location.hash='#/more'">${icon("chevL", "sm")}Back to app</button>
      <div class="gate">
        <div class="gate-i">${icon("lock")}</div>
        <h1 class="page-title">Admin</h1>
        <p class="muted">Enter the admin PIN.</p>
        <form id="pinf" class="pin-row">
          <input id="pin" class="pin" type="password" inputmode="numeric" autocomplete="off" placeholder="••••" aria-label="Admin PIN" />
          <button class="btn" type="submit">Unlock</button>
        </form>
        <p class="pin-err" id="pinerr" hidden>That PIN isn't right.</p>
      </div>`);
    const $p = document.getElementById("pin");
    $p.focus();
    document.getElementById("pinf").addEventListener("submit", async (e) => {
      e.preventDefault();
      const expected = A.getLive().pinHash || (await sha256(DEFAULT_PIN));
      if ((await sha256($p.value.trim())) === expected) {
        try { sessionStorage.setItem("usafl.admin.ok", "1"); } catch {}
        then();
        animateIn();
      } else {
        const err = document.getElementById("pinerr");
        err.hidden = false;
        $p.value = "";
        $p.classList.remove("shake"); void $p.offsetWidth; $p.classList.add("shake");
      }
    });
  }

  // ---------- GitHub ----------
  const token = () => store.get("usafl.admin.token", null);
  async function gh(path, opts = {}) {
    const r = await fetch("https://api.github.com" + path, {
      ...opts,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token()}`,
        "X-GitHub-Api-Version": "2022-11-28",
        ...(opts.body ? { "Content-Type": "application/json" } : {}),
      },
    });
    if (!r.ok) {
      let msg = "";
      try { msg = (await r.json()).message || ""; } catch {}
      const e = new Error(ghMessage(r.status, msg));
      e.status = r.status;
      throw e;
    }
    return r.status === 204 ? null : r.json();
  }
  function ghMessage(status, msg) {
    if (status === 401) return "GitHub rejected the token — it may have expired or been pasted wrongly. Update it in Settings.";
    if (status === 403 || status === 404) return "This token can't access the project. Check it's for usafl-umpires-app with Contents: Read and write.";
    if (status === 409 || status === 422) return "The project changed while you were publishing. Try again.";
    return msg || `GitHub error (${status}).`;
  }
  const repoPath = (p) => `/repos/${REPO.owner}/${REPO.repo}${p}`;
  function b64(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = "";
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  }
  const unb64 = (b) => new TextDecoder().decode(Uint8Array.from(atob(b.replace(/\s/g, "")), (c) => c.charCodeAt(0)));
  async function getFile(path, ref) {
    return gh(repoPath(`/contents/${path}?ref=${encodeURIComponent(ref || REPO.branch)}`));
  }
  async function putFile(path, text, message) {
    let sha;
    try { sha = (await getFile(path)).sha; } catch (e) { if (e.status !== 404) throw e; }
    return gh(repoPath(`/contents/${path}`), { method: "PUT", body: JSON.stringify({ message, content: b64(text), branch: REPO.branch, sha }) });
  }
  async function testToken() {
    const repo = await gh(repoPath(""));
    if (!repo.permissions || !repo.permissions.push) throw new Error("This token can read the project but can't save to it. Give it Contents: Read and write.");
    return repo;
  }

  // ---------- publish (with live check) ----------
  // Every published file carries a unique publishId; we poll the live site until it shows up.
  function publish({ path, text, publishId, message, onLive }) {
    if (!token()) {
      openSheet("Connect GitHub first", `<p class="muted" style="margin-bottom:16px">Publishing needs your GitHub token. It takes two minutes to set up.</p><button class="btn block" data-set>Open Settings</button>`,
        (sh) => sh.querySelector("[data-set]").addEventListener("click", () => { closeSheet(); go("#/admin/settings"); }));
      return;
    }
    const steps = [["save", "Saving to GitHub"], ["deploy", "Vercel is deploying"], ["live", "Live in the app"]];
    openSheet("Publishing", `<div class="pub">${steps.map(([k, l]) => `<div class="pstep" data-s="${k}"><span class="pdot"></span><span>${l}</span></div>`).join("")}<p class="pmsg" id="pmsg"></p><div id="pact"></div></div>`, async (sh) => {
      const set = (k, state) => { const el = sh.querySelector(`[data-s="${k}"]`); el.classList.remove("on", "done", "fail"); if (state) el.classList.add(state); };
      const msg = (t, bad) => { const m = sh.querySelector("#pmsg"); m.textContent = t; m.classList.toggle("bad", !!bad); };
      const actions = (html, wire) => { const a = sh.querySelector("#pact"); a.innerHTML = html; if (wire) wire(a); };
      set("save", "on");
      try {
        await putFile(path, text, message);
      } catch (e) {
        set("save", "fail");
        msg(e.message, true);
        actions(`<button class="btn block" data-retry>Try again</button>`, (a) => a.querySelector("[data-retry]").addEventListener("click", () => publish({ path, text, publishId, message, onLive })));
        return;
      }
      set("save", "done"); set("deploy", "on");
      msg("Usually takes about a minute.");
      const started = Date.now();
      while (Date.now() - started < 4 * 60 * 1000) {
        await new Promise((r) => setTimeout(r, 5000));
        if (!document.body.contains(sh)) return; // sheet closed — stop polling
        try {
          const r = await fetch(`${path}?check=${Date.now()}`, { cache: "no-store" });
          if (r.ok && (await r.text()).includes(publishId)) {
            set("deploy", "done"); set("live", "done");
            msg("Done. Umpires will see it next time they open the app (or within a few minutes if it's open).");
            if (onLive) onLive();
            actions(`<button class="btn block dark" data-ok>Finish</button>`, (a) => a.querySelector("[data-ok]").addEventListener("click", () => { closeSheet(); if (path === "data.js") location.reload(); }));
            return;
          }
        } catch {}
      }
      msg("Saved to GitHub, but the site hasn't updated yet. Vercel may be slow — check again in a few minutes.");
      actions(`<button class="btn block ghost" data-ok>Close</button>`, (a) => a.querySelector("[data-ok]").addEventListener("click", () => closeSheet()));
    });
  }

  // data.js in the same shape as tools/parse_schedule.py
  function scheduleJS(umpires, slotOrder, meta) {
    return "// Auto-generated schedule — published from the admin page or tools/parse_schedule.py. Do not hand-edit.\n" +
      "window.UMPIRES = " + JSON.stringify(umpires, null, 1) + ";\n" +
      "window.SLOT_ORDER = " + JSON.stringify(slotOrder) + ";\n" +
      "window.SCHEDULE_META = " + JSON.stringify(meta) + ";\n";
  }
  // live.json: merge a change into the latest copy on GitHub (not this phone's cached copy,
  // which can lag a deploy behind and would drop a just-published announcement or event edit).
  async function publishLive(change, message, onLive) {
    if (!token()) return publish({});
    let cur;
    try {
      cur = JSON.parse(unb64((await getFile("live.json")).content));
    } catch (e) {
      cur = e.status === 404 ? {} : A.getLive();
    }
    const next = { announcement: cur.announcement || null, events: cur.events || null, pinHash: cur.pinHash || null, ...change, publishId: newId() };
    publish({ path: "live.json", text: JSON.stringify(next, null, 2) + "\n", publishId: next.publishId, message, onLive: () => { A.applyLive(next); if (onLive) onLive(); } });
  }

  // ======================================================================
  // ADMIN HOME
  // ======================================================================
  function home() {
    const L = A.getLive(), M = A.META;
    const ann = L.announcement && L.announcement.text;
    const row = (href, ic, t1, t2, extra = "") => `<a class="row" href="${href}"><span class="ico">${icon(ic, "sm")}</span><span class="main"><span class="t1">${esc(t1)}</span><span class="t2">${t2}</span></span><span class="trail">${extra}${icon("chevR", "sm")}</span></a>`;
    render(`
      <button class="back" onclick="location.hash='#/more'">${icon("chevL", "sm")}Exit admin</button>
      <div class="head" style="margin-top:0"><div><h1 class="page-title">Admin</h1><div class="sub">Changes publish to every umpire's app</div></div></div>
      ${usingDefaultPin() ? `<a class="notice pressable" href="#/admin/settings">${icon("key", "sm")}<span class="grow">You're using the default PIN. Set your own in Settings.</span>${icon("chevR", "sm")}</a>` : ""}
      ${!token() ? `<a class="notice pressable" href="#/admin/settings">${icon("gear", "sm")}<span class="grow">Connect GitHub so you can publish.</span>${icon("chevR", "sm")}</a>` : ""}
      <div class="card stat-card">
        <div><span class="eyebrow">Live schedule</span><b>${esc(M.version ? "v" + M.version : "—")}</b><span>${A.UMPIRES.length} umpires · ${esc(fmtDate(M.publishedAt))}</span></div>
        <div><span class="eyebrow">Unpublished edits</span><b class="${S.edits.length ? "accent" : ""}">${S.edits.length}</b><span>${S.edits.length ? `<a class="link-btn" href="#/admin/edit">Review</a>` : "None"}</span></div>
      </div>
      <div class="eyebrow group-label">Schedule</div>
      <div class="list stagger">
        ${row("#/admin/upload", "upload", "Upload new schedule", "Choose Jeff's Excel file, preview changes, publish")}
        ${row("#/admin/edit", "edit", "Quick-edit assignments", "Fix a single slot without a spreadsheet", S.edits.length ? `<span class="tag brand">${S.edits.length}</span>` : "")}
        ${row("#/admin/history", "history", "Version history", "Restore an earlier schedule")}
      </div>
      <div class="eyebrow group-label">Messages & info</div>
      <div class="list">
        ${row("#/admin/announce", "megaphone", "Announcement", ann ? `Live: “${esc(L.announcement.text.slice(0, 40))}${L.announcement.text.length > 40 ? "…" : ""}”` : "None showing")}
        ${row("#/admin/events", "calendar", "Event details", "Venues, times and notes for the weekend guide")}
      </div>
      <div class="eyebrow group-label">Setup</div>
      <div class="list">
        ${row("#/admin/settings", "gear", "Settings", token() ? "GitHub connected · PIN" : "Connect GitHub · PIN")}
      </div>
      <p class="foot-note">Publishing saves to GitHub (${esc(REPO.owner)}/${esc(REPO.repo)}); Vercel puts it live in about a minute.</p>
    `);
  }

  // ======================================================================
  // SETTINGS — token + PIN
  // ======================================================================
  function settings() {
    const t = token();
    render(`
      <button class="back" onclick="location.hash='#/admin'">${icon("chevL", "sm")}Admin</button>
      <div class="head" style="margin-top:0"><div><h1 class="page-title">Settings</h1></div></div>

      <div class="eyebrow group-label">GitHub connection</div>
      <div class="card form-card">
        <div class="conn ${t ? "ok" : ""}" id="conn">${t ? `${icon("check", "sm")}Token saved on this phone` : `${icon("info", "sm")}Not connected`}</div>
        <label class="fld"><span>Personal access token</span><input id="tok" type="password" autocomplete="off" placeholder="${t ? "•••••••• (saved)" : "github_pat_…"}" /></label>
        <div class="btn-row"><button class="btn" id="tsave">Save & test</button>${t ? `<button class="btn ghost" id="tforget">Forget</button>` : ""}</div>
        <p class="hint" id="tmsg"></p>
      </div>
      <details class="howto">
        <summary>How to create the token</summary>
        <ol>
          <li>Open <a class="link-btn" href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">github.com → New fine-grained token</a> (sign in as ${esc(REPO.owner)}).</li>
          <li>Name it “USAFL admin”. Set an expiry after the tournament (e.g. 90 days).</li>
          <li>Repository access → <b>Only select repositories</b> → <b>${esc(REPO.repo)}</b>.</li>
          <li>Permissions → Repository → <b>Contents: Read and write</b>. Nothing else.</li>
          <li>Generate, copy the token, and paste it above.</li>
        </ol>
        <p class="hint">The token is stored only on this phone and can only change files in this one project.</p>
      </details>

      <div class="eyebrow group-label">Admin PIN</div>
      <div class="card form-card">
        <p class="hint" style="margin:0 0 12px">${usingDefaultPin() ? "Currently the default PIN. Set your own — it applies on every phone." : "Applies on every phone. Share it only with other admins."}</p>
        <label class="fld"><span>New PIN</span><input id="p1" type="password" inputmode="numeric" autocomplete="off" placeholder="4–8 digits" /></label>
        <label class="fld"><span>Repeat new PIN</span><input id="p2" type="password" inputmode="numeric" autocomplete="off" /></label>
        <div class="btn-row"><button class="btn" id="psave">Publish new PIN</button></div>
        <p class="hint bad" id="pmsg2"></p>
      </div>
    `);
    const $msg = document.getElementById("tmsg");
    document.getElementById("tsave").addEventListener("click", async () => {
      const v = document.getElementById("tok").value.trim();
      if (!v && !token()) { $msg.textContent = "Paste a token first."; $msg.className = "hint bad"; return; }
      const prev = token();
      if (v) store.set("usafl.admin.token", v);
      $msg.textContent = "Testing…"; $msg.className = "hint";
      try {
        await testToken();
        $msg.textContent = "Connected. You can publish from this phone.";
        $msg.className = "hint good";
        document.getElementById("conn").outerHTML = `<div class="conn ok" id="conn">${icon("check", "sm")}Token saved on this phone</div>`;
        document.getElementById("tok").value = "";
      } catch (e) {
        if (v) { if (prev) store.set("usafl.admin.token", prev); else store.del("usafl.admin.token"); }
        $msg.textContent = e.message || "Couldn't reach GitHub. Check your connection.";
        $msg.className = "hint bad";
      }
    });
    const forget = document.getElementById("tforget");
    if (forget) forget.addEventListener("click", () => { store.del("usafl.admin.token"); settings(); });
    document.getElementById("psave").addEventListener("click", async () => {
      const p1 = document.getElementById("p1").value.trim(), p2 = document.getElementById("p2").value.trim();
      const m = document.getElementById("pmsg2");
      if (!/^\d{4,8}$/.test(p1)) { m.textContent = "Use 4 to 8 digits."; return; }
      if (p1 !== p2) { m.textContent = "The two PINs don't match."; return; }
      m.textContent = "";
      publishLive({ pinHash: await sha256(p1) }, "Admin: change admin PIN");
    });
  }

  // ======================================================================
  // SPREADSHEET PARSER — mirrors tools/parse_schedule.py
  // ======================================================================
  const TIME_RE = /^\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)\s*$/i;
  const DISC = { F: "field", G: "goal", B: "boundary" };
  const DEFAULT_DAYS = { 1: ["sat"], 2: ["sat", "sun"], 3: ["sat", "sun", "finals"], 4: ["fri", "sat", "sun", "finals"] };
  const RANK = { field: 5, goal: 5, boundary: 5, ts: 5, coach: 4, duty: 4, playing: 3, watch: 2, maybe: 1, other: 2, personal: 2, off: 0 };
  const sv = (v) => (v == null ? "" : String(v).trim());
  const tmins = (label) => { const m = TIME_RE.exec(label); return ((+m[1] % 12) + (m[3].toLowerCase() === "pm" ? 12 : 0)) * 60 + +(m[2] || 0); };

  function classify(raw, warn) {
    const v = sv(raw);
    if (!v) return null;
    const tentative = v.includes("?");
    const clean = v.replace(/\?/g, "").trim().replace(/\/+$/, "").trim();
    const low = clean.toLowerCase();
    if (low === "off" || low === "no games") return { type: "off", label: "OFF", tentative };
    if (low === "personal" || low === "mvl") return { type: "personal", label: "Personal", tentative };
    if (low === "youth") return { type: "duty", label: "Youth game", tentative };
    if (clean.startsWith(".")) return { type: "coach", label: clean.slice(1).trim(), tentative };
    if (low.startsWith("f marshall")) return { type: "duty", label: "Field Marshall", tentative };
    for (const [re, type] of [[/^field\s*(\d+)$/, "field"], [/^goal\s*(\d+)$/, "goal"], [/^bound\s*(\d+)$/, "boundary"], [/^ts\s*(\d+)$/, "ts"]]) {
      const m = re.exec(low);
      if (m) { const n = +m[1]; return { type, label: `Field ${n}`, field: n, tentative }; }
    }
    if (/\b(pre|play|post|loser|play in)\b/.test(low)) return { type: "playing", label: "With club", tentative };
    if (low.includes("watch")) return { type: "watch", label: "Watching", tentative };
    if (low.includes("coach")) return { type: "coach", label: "Coaching", tentative };
    if (low.startsWith("[") || low === "tba") return { type: "maybe", label: clean.replace(/^\[+|\]+$/g, ""), tentative: true };
    warn(`'${v}' isn't a code the app knows — shown as written`);
    return { type: "other", label: clean, tentative };
  }

  function parseSheet(buf, fileName) {
    const XLSX = window.XLSX;
    const wb = XLSX.read(buf, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    if (!ws || !ws["!ref"]) throw new Error("The spreadsheet's first sheet is empty.");
    const rng = XLSX.utils.decode_range(ws["!ref"]);
    const maxr = rng.e.r + 1, maxc = rng.e.c + 1;
    const cell = (r, c) => { const x = ws[XLSX.utils.encode_cell({ r: r - 1, c: c - 1 })]; return x ? x.v : null; };
    const norm = (v) => sv(v).toLowerCase();
    const warnings = [];

    let hdr = null;
    outer: for (let r = 1; r <= Math.min(maxr, 60); r++) for (let c = 1; c <= Math.min(maxc, 40); c++) if (norm(cell(r, c)) === "f name") { hdr = r; break outer; }
    if (!hdr) throw new Error("Couldn't find the header row — there should be a cell reading “F Name”.");
    const col = (labels, rows = [0]) => { for (const dr of rows) for (let c = 1; c <= maxc; c++) if (labels.includes(norm(cell(hdr + dr, c)))) return c; return null; };
    const C = {
      first: col(["f name"]), last: col(["fi lname", "l name", "last name", "lname"]), men: col(["men"]), women: col(["women"]),
      now: col(["now"]), try: col(["try"]), commit: col(["ft/pt"], [0, -1, -2]),
    };
    for (const k of ["first", "last", "now"]) if (!C[k]) throw new Error(`Couldn't find the “${k === "first" ? "F Name" : k === "last" ? "FI LName" : "Now"}” column.`);

    let best = [];
    for (let r = 1; r < hdr; r++) {
      const cols = [];
      for (let c = 1; c <= maxc; c++) { const t = sv(cell(r, c)); if (TIME_RE.test(t)) cols.push([c, t]); }
      if (cols.length > best.length) best = cols;
    }
    if (best.length < 2) throw new Error("Couldn't find the row of game times (8am, 9am …) above the header.");
    const blocks = [];
    let prev = null;
    for (const [c, label] of best) {
      const m = tmins(label);
      if (prev == null || m <= prev) blocks.push([]);
      blocks[blocks.length - 1].push([c, label.toLowerCase().replace(/\s+/g, "")]);
      prev = m;
    }
    const days = DEFAULT_DAYS[blocks.length];
    if (!days) throw new Error(`Found ${blocks.length} separate days of times — the app expects 1 to 4. This sheet's layout needs a code update.`);
    const slotCols = [];
    blocks.forEach((blk, i) => blk.forEach(([c, t]) => slotCols.push([c, days[i], t])));
    const slotOrder = slotCols.map(([, d, t]) => ({ day: d, time: t }));
    const orderIdx = new Map(slotCols.map(([, d, t], i) => [d + "|" + t, i]));

    let title = "";
    outerT: for (let r = 1; r < hdr; r++) for (let c = 1; c <= maxc; c++) if (/version|assignments/i.test(sv(cell(r, c)))) { title = sv(cell(r, c)); break outerT; }
    const vm = /version\s*0*(\d+)/i.exec(title);

    const people = new Map();
    let lastSection = null;
    for (let r = hdr + 1; r <= maxr; r++) {
      const first = sv(cell(r, C.first)), last = sv(cell(r, C.last));
      if (!first || !last || first.toUpperCase() === "TBA") continue;
      const now = sv(cell(r, C.now));
      let section = DISC[now.slice(0, 1).toUpperCase()];
      if (!section) {
        if (!lastSection) { warnings.push(`Row ${r} (${first} ${last}): no level in “Now”, skipped`); continue; }
        section = lastSection;
        warnings.push(`Row ${r} (${first} ${last}): no level in “Now”, treated as ${section}`);
      }
      lastSection = section;
      const lastName = last.replace(/^[A-Z] /, "");
      const key = `${first.toLowerCase()}|${lastName.toLowerCase()}`;
      const clubM = C.men ? sv(cell(r, C.men)) : "", clubW = C.women ? sv(cell(r, C.women)) : "";
      const tr = C.try ? sv(cell(r, C.try)) : "", commit = C.commit ? sv(cell(r, C.commit)) : "";
      const slots = [];
      for (const [c, d, t] of slotCols) {
        const e = classify(cell(r, c), (m) => warnings.push(`${first} ${lastName}, ${dayShort(d)} ${t}: ${m}`));
        if (e) { e.day = d; e.time = t; slots.push(e); }
      }
      if (people.has(key)) {
        const p = people.get(key);
        p.accreditation[section] = now;
        if (tr && tr !== "-") p.try[section] = tr;
        const by = new Map(p.slots.map((x) => [x.day + "|" + x.time, x]));
        for (const e of slots) {
          const k2 = e.day + "|" + e.time;
          if (!by.has(k2) || (RANK[e.type] || 0) > (RANK[by.get(k2).type] || 0)) by.set(k2, e);
        }
        p.slots = [...by.values()].sort((a, b) => orderIdx.get(a.day + "|" + a.time) - orderIdx.get(b.day + "|" + b.time));
        p.disciplines.push(section);
      } else {
        people.set(key, {
          id: `${first} ${lastName}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
          firstName: first, lastName, name: `${first} ${lastName}`,
          club: clubM && clubM !== "N/A" ? clubM : clubW !== "N/A" ? clubW : "",
          isAussie: clubM.toUpperCase() === "OZ" || clubW.toUpperCase() === "OZ",
          accreditation: { [section]: now },
          try: tr && tr !== "-" ? { [section]: tr } : {},
          commitment: commit, counts: {}, disciplines: [section], slots,
        });
      }
    }
    if (!people.size) throw new Error("No umpires found below the header row.");
    const roster = [...people.values()];
    roster.forEach(recount);
    const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
    roster.sort((a, b) => cmp(a.lastName.toLowerCase(), b.lastName.toLowerCase()) || cmp(a.firstName.toLowerCase(), b.firstName.toLowerCase()));
    const blocksDesc = blocks.map((blk, i) => ({ day: days[i], from: blk[0][1], to: blk[blk.length - 1][1], n: blk.length }));
    const meta = { title, version: vm ? vm[1].padStart(3, "0") : "", source: fileName || "", publishedAt: null, publishId: null, days };
    return { umpires: roster, slotOrder, meta, warnings, blocks: blocksDesc };
  }
  function recount(p) {
    const cnt = { field: 0, goal: 0, boundary: 0, ts: 0, coach: 0 };
    p.slots.forEach((e) => { if (e.type in cnt) cnt[e.type]++; });
    p.counts = cnt;
  }
  window.USAFL_ADMIN_TEST = { parseSheet, loadXLSX: () => loadXLSX() }; // used by the preview checks

  let xlsxLoading = null;
  function loadXLSX() {
    if (window.XLSX) return Promise.resolve();
    xlsxLoading = xlsxLoading || new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = "vendor/xlsx.full.min.js";
      s.onload = res; s.onerror = () => { xlsxLoading = null; rej(new Error("Couldn't load the spreadsheet reader. Check your connection.")); };
      document.body.appendChild(s);
    });
    return xlsxLoading;
  }

  // ---------- describing changes ----------
  const ROLE_TXT = { field: "Field", goal: "Goal", boundary: "Boundary", ts: "Timer/score", playing: "With club", watch: "Watching", off: "Off", personal: "Personal" };
  function slotTxt(s) {
    if (!s) return "—";
    let t;
    if (s.type === "coach") t = s.label === "Coaching" ? "Coaching" : `Coaching ${s.label}`;
    else if (s.type === "duty" || s.type === "other") t = s.label;
    else if (s.type === "maybe") t = `Maybe ${s.label}`;
    else t = ROLE_TXT[s.type] || s.type;
    if (s.field) t += ` · F${s.field}`;
    return t + (s.tentative ? " (TBC)" : "");
  }
  const slotSig = (s) => (s ? [s.type, s.label, s.field || "", s.tentative ? 1 : 0].join("|") : "");
  function diffRosters(oldU, newU, order) {
    const idx = new Map(order.map((s, i) => [s.day + "|" + s.time, i]));
    const om = new Map(oldU.map((u) => [u.id, u])), nm = new Map(newU.map((u) => [u.id, u]));
    const out = [];
    for (const u of newU) {
      const o = om.get(u.id);
      if (!o) { out.push({ name: u.name, kind: "added", lines: [`${u.counts.field + u.counts.goal + u.counts.boundary + u.counts.ts} games`] }); continue; }
      const lines = [];
      const lv = (x) => Object.entries(x.accreditation).map(([k, v]) => `${k} ${v}`).join(", ");
      if (lv(o) !== lv(u)) lines.push(`Level: ${lv(o)} → ${lv(u)}`);
      const keys = [...new Set([...o.slots, ...u.slots].map((s) => s.day + "|" + s.time))].sort((a, b) => (idx.get(a) ?? 999) - (idx.get(b) ?? 999));
      for (const k of keys) {
        const a = o.slots.find((s) => s.day + "|" + s.time === k), b = u.slots.find((s) => s.day + "|" + s.time === k);
        if (slotSig(a) === slotSig(b)) continue;
        if (!(a && ACTIVE.has(a.type)) && !(b && ACTIVE.has(b.type))) continue; // ignore off/with-club shuffles
        const [d, t] = k.split("|");
        lines.push(`${dayShort(d)} ${A.tFull(t)}: ${slotTxt(a)} → ${slotTxt(b)}`);
      }
      if (lines.length) out.push({ name: u.name, kind: "changed", lines });
    }
    for (const o of oldU) if (!nm.has(o.id)) out.push({ name: o.name, kind: "removed", lines: ["Not on the new schedule"] });
    return out;
  }
  function diffHTML(changes, limit) {
    if (!changes.length) return `<div class="note-card">No changes to anyone's assignments.</div>`;
    const shown = limit ? changes.slice(0, limit) : changes;
    return `<div class="diff">${shown.map((c) => `<div class="dcard"><div class="dh"><b>${esc(c.name)}</b>${c.kind !== "changed" ? `<span class="tag ${c.kind === "added" ? "oz" : "solid"}">${c.kind === "added" ? "New" : "Removed"}</span>` : ""}</div>${c.lines.map((l) => `<div class="dl">${esc(l)}</div>`).join("")}</div>`).join("")}</div>`;
  }

  // ======================================================================
  // UPLOAD NEW SCHEDULE
  // ======================================================================
  let upload = null; // { result, changes, fileName } or { error }
  function uploadView() {
    const M = A.META;
    let body;
    if (!upload) {
      body = `
        <label class="drop pressable">
          <input type="file" id="xf" accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" hidden />
          <span class="drop-i">${icon("upload")}</span>
          <b>Choose spreadsheet</b>
          <span>The Excel file from Jeff. Save it to Files first if it's an email attachment.</span>
        </label>
        <p class="hint" style="margin-top:12px">Nothing goes live until you check the changes and tap Publish.</p>`;
    } else if (upload.error) {
      body = `<div class="err-card">${icon("alert", "sm")}<div><b>This file can't be used</b><span>${esc(upload.error)}</span></div></div>
        <div class="btn-row"><button class="btn ghost" id="again">Choose another file</button></div>`;
    } else {
      const { result: R, changes } = upload;
      const older = M.version && R.meta.version && +R.meta.version < +M.version;
      const same = M.version && R.meta.version && +R.meta.version === +M.version;
      body = `
        <div class="card sum-card">
          <div class="eyebrow">New file</div>
          <b>${esc(R.meta.title || upload.fileName)}</b>
          <div class="sum-grid">
            <div><span>Version</span><b>${esc(R.meta.version ? "v" + R.meta.version : "—")}</b></div>
            <div><span>Umpires</span><b>${R.umpires.length}</b></div>
            <div><span>Changed</span><b>${changes.length}</b></div>
          </div>
          <div class="sum-days">${R.blocks.map((b) => `<span class="tag">${esc(A.DAY_LONG[b.day] || b.day)} ${esc(A.tFull(b.from))}–${esc(A.tFull(b.to))}</span>`).join("")}</div>
        </div>
        ${older ? `<div class="err-card warn">${icon("alert", "sm")}<div><b>Older than what's live</b><span>This is v${esc(R.meta.version)}; the app is showing v${esc(M.version)}.</span></div></div>` : ""}
        ${same ? `<div class="err-card warn">${icon("info", "sm")}<div><b>Same version number as what's live</b><span>v${esc(M.version)} — fine if Jeff updated it without changing the number.</span></div></div>` : ""}
        ${S.edits.length ? `<div class="err-card warn">${icon("info", "sm")}<div><b>Replaces your ${S.edits.length} unpublished quick edit${S.edits.length === 1 ? "" : "s"}</b><span>Make them again afterwards if they're not in Jeff's file.</span></div></div>` : ""}
        ${R.warnings.length ? `<details class="warns"><summary>${icon("info", "sm")}${R.warnings.length} thing${R.warnings.length === 1 ? "" : "s"} to check</summary><ul>${R.warnings.slice(0, 60).map((w) => `<li>${esc(w)}</li>`).join("")}</ul></details>` : ""}
        <div class="section-head" style="margin-top:22px"><h2>What changes</h2></div>
        <div id="dlist">${diffHTML(changes, 25)}</div>
        ${changes.length > 25 ? `<button class="link-btn" id="dall" style="margin:10px 2px">Show all ${changes.length}</button>` : ""}
        <div class="dock"><div class="btn-row"><button class="btn ghost" id="again">Change file</button><button class="btn" id="pub" style="flex:2">Publish${R.meta.version ? " v" + esc(R.meta.version) : ""}</button></div></div>`;
    }
    render(`
      <button class="back" onclick="location.hash='#/admin'">${icon("chevL", "sm")}Admin</button>
      <div class="head" style="margin-top:0"><div><h1 class="page-title">New schedule</h1><div class="sub">Live now: ${esc(M.version ? "v" + M.version : "—")} · ${A.UMPIRES.length} umpires</div></div></div>
      ${body}`);
    const xf = document.getElementById("xf");
    if (xf) xf.addEventListener("change", async () => {
      const f = xf.files && xf.files[0];
      if (!f) return;
      render(`<div class="empty"><div class="e-i">${icon("upload")}</div><b>Reading ${esc(f.name)}…</b></div>`);
      try {
        await loadXLSX();
        const result = parseSheet(new Uint8Array(await f.arrayBuffer()), f.name);
        upload = { result, fileName: f.name, changes: diffRosters(A.UMPIRES, result.umpires, [...A.SLOT_ORDER, ...result.slotOrder]) };
      } catch (e) {
        upload = { error: e.message || "Couldn't read that file." };
      }
      uploadView();
      animateIn();
    });
    const again = document.getElementById("again");
    if (again) again.addEventListener("click", () => { upload = null; uploadView(); animateIn(); });
    const all = document.getElementById("dall");
    if (all) all.addEventListener("click", () => { document.getElementById("dlist").innerHTML = diffHTML(upload.changes); all.remove(); });
    const pub = document.getElementById("pub");
    if (pub) pub.addEventListener("click", () => {
      const R = upload.result;
      const id = newId();
      const meta = { ...R.meta, publishedAt: new Date().toISOString(), publishId: id };
      publish({
        path: "data.js", text: scheduleJS(R.umpires, R.slotOrder, meta), publishId: id,
        message: `Admin: publish schedule ${meta.version ? "v" + meta.version : ""} from ${R.meta.source}`.trim(),
        onLive: () => { clearDraft(); upload = null; },
      });
    });
  }

  // ======================================================================
  // QUICK EDIT
  // ======================================================================
  const EDIT_TYPES = [
    ["none", "Nothing"], ["field", "Field umpire"], ["goal", "Goal umpire"], ["boundary", "Boundary"], ["ts", "Timer / score"],
    ["coach", "Coaching"], ["marshall", "Field Marshall"], ["playing", "With club"], ["watch", "Watching"], ["off", "Break"],
  ];
  const ON_FIELD = ["field", "goal", "boundary", "ts"];
  let qe = { q: "", id: null, day: null };
  function editView(id) {
    if (id) return editUmpire(id);
    const q = qe.q.trim().toLowerCase();
    const list = S.umpires.filter((u) => !q || u.name.toLowerCase().includes(q));
    render(`
      <button class="back" onclick="location.hash='#/admin'">${icon("chevL", "sm")}Admin</button>
      <div class="head" style="margin-top:0"><div><h1 class="page-title">Quick edit</h1><div class="sub">Pick an umpire, change a slot, then publish</div></div></div>
      ${S.edits.length ? pendingBar() : ""}
      <div class="sticky-search"><label class="search">${icon("search", "sm")}<input id="eq" placeholder="Search umpire" value="${esc(qe.q)}" autocomplete="off" /></label></div>
      <div class="list plain" id="elist">${list.map((u) => `<a class="row" href="#/admin/edit/${u.id}">${A.avatar(u)}<span class="main"><span class="t1">${esc(u.name)}</span><span class="t2">${esc(Object.values(u.accreditation).join(" / "))}</span></span><span class="trail">${icon("chevR", "sm")}</span></a>`).join("") || empty("search", "No matches", "")}</div>
      <p class="hint" style="margin-top:14px">Quick edits are replaced next time you upload a spreadsheet, so make the same fix in Jeff's file if it should stick.</p>
    `);
    const eq = document.getElementById("eq");
    eq.addEventListener("input", () => { qe.q = eq.value; const scroll = A.$app.scrollTop; editView(); A.$app.scrollTop = scroll; const n = document.getElementById("eq"); n.focus(); n.setSelectionRange(n.value.length, n.value.length); });
    wirePending();
  }
  function pendingBar() {
    return `<button class="notice pressable pend" id="pend">${icon("edit", "sm")}<span class="grow">${S.edits.length} unpublished edit${S.edits.length === 1 ? "" : "s"}</span><span class="tag solid">Review</span></button>`;
  }
  function wirePending() {
    const p = document.getElementById("pend");
    if (p) p.addEventListener("click", reviewEdits);
  }
  function editUmpire(id) {
    const u = S.umpires.find((x) => x.id === id);
    if (!u) return go("#/admin/edit");
    const days = [...new Set(S.slotOrder.map((s) => s.day))];
    if (!qe.day || !days.includes(qe.day)) qe.day = days[0];
    const hours = S.slotOrder.filter((s) => s.day === qe.day);
    render(`
      <button class="back" onclick="location.hash='#/admin/edit'">${icon("chevL", "sm")}All umpires</button>
      <div class="profile" style="margin-top:4px">${A.avatar(u, "lg")}<div><div class="pn">${esc(u.name)}</div><div class="tags"><span class="tag">${esc(Object.values(u.accreditation).join(" / "))}</span></div></div></div>
      ${S.edits.length ? pendingBar() : ""}
      ${seg("eday", days.map((d) => ({ v: d, label: A.DAY_LONG[d] || d })), qe.day)}
      <div class="list plain">${hours.map((h) => {
        const s = u.slots.find((x) => x.day === h.day && x.time === h.time);
        const edited = S.edits.some((e) => e.id === u.id && e.day === h.day && e.time === h.time);
        return `<button class="row slot-row" data-t="${esc(h.time)}"><span class="st">${esc(A.tFull(h.time))}</span><span class="main"><span class="t1 ${s && ACTIVE.has(s.type) ? "" : "dim"}">${esc(slotTxt(s))}</span></span>${edited ? '<span class="tag brand">Edited</span>' : ""}<span class="trail">${icon("chevR", "sm")}</span></button>`;
      }).join("")}</div>
    `);
    wireSeg("eday", (v) => { qe.day = v; editUmpire(id); });
    wirePending();
    A.$app.querySelectorAll("[data-t]").forEach((b) => b.addEventListener("click", () => slotSheet(u, qe.day, b.dataset.t)));
  }
  function slotSheet(u, day, time) {
    const cur = u.slots.find((x) => x.day === day && x.time === time);
    const curType = !cur ? "none" : cur.type === "duty" && cur.label === "Field Marshall" ? "marshall" : cur.type;
    const maxField = Math.max(5, ...S.umpires.flatMap((x) => x.slots.map((s) => s.field || 0)));
    const others = S.umpires.filter((x) => x.id !== u.id);
    const st = { type: EDIT_TYPES.some(([k]) => k === curType) ? curType : "none", field: cur && cur.field ? cur.field : 1, tentative: !!(cur && cur.tentative), coach: "" };
    if (cur && cur.type === "coach" && cur.label !== "Coaching") {
      const r = cur.label.toLowerCase().replace(/[\s.]/g, "");
      const hit = others.find((x) => (x.firstName[0] + x.lastName).toLowerCase().replace(/\s/g, "") === r) || others.find((x) => x.lastName.toLowerCase().replace(/\s/g, "") === r);
      st.coach = hit ? hit.id : "";
    }
    const draw = (sh) => {
      sh.querySelector(".sh-body").innerHTML = `
        <p class="muted" style="margin:-4px 0 16px">${esc(u.name)} · ${esc(dayShort(day))} ${esc(A.tFull(time))}${cur ? ` · now: ${esc(slotTxt(cur))}` : ""}</p>
        <div class="eyebrow" style="margin-bottom:8px">Assignment</div>
        <div class="chips">${EDIT_TYPES.map(([k, l]) => `<button class="chip ${st.type === k ? "on" : ""}" data-ty="${k}">${l}</button>`).join("")}</div>
        ${ON_FIELD.includes(st.type) ? `<div class="eyebrow" style="margin-bottom:8px">Field</div><div class="chips">${Array.from({ length: maxField }, (_, i) => i + 1).map((n) => `<button class="chip num ${st.field === n ? "on" : ""}" data-f="${n}">${n}</button>`).join("")}</div>` : ""}
        ${st.type === "coach" ? `<div class="eyebrow" style="margin-bottom:8px">Observing</div><select class="sel" id="co"><option value="">General coaching (no one specific)</option>${others.map((x) => `<option value="${x.id}" ${st.coach === x.id ? "selected" : ""}>${esc(x.name)}</option>`).join("")}</select>` : ""}
        ${st.type !== "none" ? `<button class="check-row ${st.tentative ? "done" : ""}" data-tbc style="border-top:none;margin-top:6px"><span class="box">${icon("check", "xs")}</span><span>Tentative (shows “TBC”)</span></button>` : ""}
        <div class="btn-row" style="margin-top:16px"><button class="btn block" data-save>Save edit</button></div>`;
      sh.querySelectorAll("[data-ty]").forEach((b) => b.addEventListener("click", () => { st.type = b.dataset.ty; draw(sh); }));
      sh.querySelectorAll("[data-f]").forEach((b) => b.addEventListener("click", () => { st.field = +b.dataset.f; draw(sh); }));
      const co = sh.querySelector("#co");
      if (co) co.addEventListener("change", () => { st.coach = co.value; });
      const tbc = sh.querySelector("[data-tbc]");
      if (tbc) tbc.addEventListener("click", () => { st.tentative = !st.tentative; tbc.classList.toggle("done", st.tentative); });
      sh.querySelector("[data-save]").addEventListener("click", () => { applyEdit(u, day, time, cur, st); closeSheet(); editUmpire(u.id); });
    };
    openSheet(`${dayShort(day)} ${A.tFull(time)}`, "", draw);
  }
  function applyEdit(u, day, time, before, st) {
    let next = null;
    const t = st.tentative;
    if (ON_FIELD.includes(st.type)) next = { type: st.type, label: `Field ${st.field}`, field: st.field, tentative: t };
    else if (st.type === "coach") {
      const who = S.umpires.find((x) => x.id === st.coach);
      next = { type: "coach", label: who ? who.firstName.replace(/[^A-Za-z]/g, "")[0] + who.lastName : "Coaching", tentative: t };
    } else if (st.type === "marshall") next = { type: "duty", label: "Field Marshall", tentative: t };
    else if (st.type === "playing") next = { type: "playing", label: "With club", tentative: t };
    else if (st.type === "watch") next = { type: "watch", label: "Watching", tentative: t };
    else if (st.type === "off") next = { type: "off", label: "OFF", tentative: t };
    if (slotSig(before) === slotSig(next)) return;
    const orderIdx = new Map(S.slotOrder.map((s, i) => [s.day + "|" + s.time, i]));
    u.slots = u.slots.filter((x) => !(x.day === day && x.time === time));
    if (next) { next.day = day; next.time = time; u.slots.push(next); }
    u.slots.sort((a, b) => orderIdx.get(a.day + "|" + a.time) - orderIdx.get(b.day + "|" + b.time));
    recount(u);
    // one entry per slot; keep the original "before" if the slot was already edited
    const prevEdit = S.edits.find((e) => e.id === u.id && e.day === day && e.time === time);
    const original = prevEdit ? prevEdit.before : before ? clone(before) : null;
    S.edits = S.edits.filter((e) => e !== prevEdit);
    if (slotSig(original) !== slotSig(next)) S.edits.push({ id: u.id, name: u.name, day, time, before: original, after: next ? clone(next) : null });
    saveDraft();
  }
  function reviewEdits() {
    openSheet("Unpublished edits", `
      <div class="diff">${S.edits.map((e) => `<div class="dcard"><div class="dh"><b>${esc(e.name)}</b></div><div class="dl">${esc(dayShort(e.day))} ${esc(A.tFull(e.time))}: ${esc(slotTxt(e.before))} → ${esc(slotTxt(e.after))}</div></div>`).join("")}</div>
      <div class="btn-row" style="margin-top:16px"><button class="btn ghost" data-discard>Discard all</button><button class="btn" style="flex:2" data-pub>Publish ${S.edits.length} edit${S.edits.length === 1 ? "" : "s"}</button></div>
    `, (sh) => {
      sh.querySelector("[data-discard]").addEventListener("click", () => { clearDraft(); closeSheet(); go("#/admin/edit"); });
      sh.querySelector("[data-pub]").addEventListener("click", () => {
        closeSheet(true);
        const id = newId();
        const meta = { ...A.META, source: (A.META.source || "").replace(/ \+ admin edits$/, "") + " + admin edits", publishedAt: new Date().toISOString(), publishId: id };
        publish({
          path: "data.js", text: scheduleJS(S.umpires, S.slotOrder, meta), publishId: id,
          message: `Admin: ${S.edits.length} quick edit${S.edits.length === 1 ? "" : "s"} — ` + S.edits.slice(0, 3).map((e) => `${e.name} ${dayShort(e.day)} ${e.time}`).join(", "),
          onLive: () => store.del("usafl.admin.draft"),
        });
      });
    });
  }

  // ======================================================================
  // ANNOUNCEMENT
  // ======================================================================
  function announceView() {
    const cur = A.getLive().announcement;
    render(`
      <button class="back" onclick="location.hash='#/admin'">${icon("chevL", "sm")}Admin</button>
      <div class="head" style="margin-top:0"><div><h1 class="page-title">Announcement</h1><div class="sub">Shows at the top of everyone's Home screen</div></div></div>
      ${cur && cur.text ? `
        <div class="eyebrow group-label" style="margin-top:0">Showing now</div>
        <div class="announce ${cur.urgent ? "urgent" : ""}" style="margin:0 0 10px">${icon(cur.urgent ? "alert" : "megaphone", "sm")}<div><b>${cur.urgent ? "Urgent" : "Announcement"} · ${esc(fmtDate(cur.postedAt))}</b><span>${esc(cur.text)}</span></div></div>
        <button class="btn ghost block" id="aclear">${icon("trash", "sm")}Remove announcement</button>` : `<div class="note-card">No announcement is showing.</div>`}
      <div class="eyebrow group-label">${cur && cur.text ? "Replace with" : "New announcement"}</div>
      <div class="card form-card">
        <label class="fld"><span>Message</span><textarea id="atext" rows="3" maxlength="200" placeholder="e.g. Field 3 is starting 15 minutes late"></textarea></label>
        <div class="count-row"><span id="acount">0/200</span></div>
        <button class="check-row" id="aurg" style="border-top:none"><span class="box">${icon("check", "xs")}</span><span>Urgent (shows in red)</span></button>
        <div class="btn-row" style="margin-top:12px"><button class="btn block" id="apub" disabled>Publish announcement</button></div>
      </div>
    `);
    const ta = document.getElementById("atext"), pub = document.getElementById("apub"), urg = document.getElementById("aurg");
    let urgent = false;
    ta.addEventListener("input", () => { document.getElementById("acount").textContent = `${ta.value.length}/200`; pub.disabled = !ta.value.trim(); });
    urg.addEventListener("click", () => { urgent = !urgent; urg.classList.toggle("done", urgent); });
    pub.addEventListener("click", () => publishLive({ announcement: { id: newId(), text: ta.value.trim(), urgent, postedAt: new Date().toISOString() } },
      `Admin: announcement — ${ta.value.trim().slice(0, 60)}`, () => announceView()));
    const clr = document.getElementById("aclear");
    if (clr) clr.addEventListener("click", () => publishLive({ announcement: null }, "Admin: remove announcement", () => announceView()));
  }

  // ======================================================================
  // EVENT DETAILS
  // ======================================================================
  let evDraft = null;
  function eventsView() {
    if (!evDraft) evDraft = clone(A.getLive().events || A.BASE_EVENTS);
    const dirty = JSON.stringify(evDraft) !== JSON.stringify(A.getLive().events || A.BASE_EVENTS);
    render(`
      <button class="back" onclick="location.hash='#/admin'">${icon("chevL", "sm")}Admin</button>
      <div class="head" style="margin-top:0"><div><h1 class="page-title">Event details</h1><div class="sub">What umpires see in the Weekend guide</div></div></div>
      ${evDraft.map((d, di) => `
        <div class="section-head" style="margin-top:18px"><h2>${esc(d.day)}</h2><button data-add="${di}">${icon("plus", "xs")} Add</button></div>
        <div class="list plain">${d.items.map((e, ei) => `<button class="row" data-ev="${di}|${ei}"><span class="main"><span class="t1">${esc(e.title)}</span><span class="t2">${esc(e.time)} · ${esc(e.where)}</span></span><span class="trail">${/tbd/i.test(e.where + e.time) ? '<span class="tag">TBD</span>' : ""}${icon("chevR", "sm")}</span></button>`).join("") || `<div class="row"><span class="muted">No events</span></div>`}</div>`).join("")}
      ${A.getLive().events ? `<button class="link-btn" id="evreset" style="margin:16px 2px">Reset to the original details</button>` : ""}
      <div class="dock"><button class="btn block" id="evpub" ${dirty ? "" : "disabled"}>${dirty ? "Publish changes" : "No changes to publish"}</button></div>
    `);
    A.$app.querySelectorAll("[data-ev]").forEach((b) => b.addEventListener("click", () => { const [di, ei] = b.dataset.ev.split("|").map(Number); eventSheet(di, ei); }));
    A.$app.querySelectorAll("[data-add]").forEach((b) => b.addEventListener("click", () => eventSheet(+b.dataset.add, null)));
    document.getElementById("evpub").addEventListener("click", () => publishLive({ events: evDraft }, "Admin: update event details", () => { evDraft = null; eventsView(); }));
    const rs = document.getElementById("evreset");
    if (rs) rs.addEventListener("click", () => publishLive({ events: null }, "Admin: reset event details", () => { evDraft = null; eventsView(); }));
  }
  function eventSheet(di, ei) {
    const isNew = ei == null;
    const e = isNew ? { time: "", title: "", where: "", note: "" } : evDraft[di].items[ei];
    openSheet(isNew ? "New event" : "Edit event", `
      <label class="fld"><span>Title</span><input id="et" value="${esc(e.title)}" /></label>
      <label class="fld"><span>Time</span><input id="em" value="${esc(e.time)}" placeholder="e.g. 7:00 pm or 2–5 pm" /></label>
      <label class="fld"><span>Location</span><input id="ew" value="${esc(e.where)}" /></label>
      <label class="fld"><span>Details</span><textarea id="en" rows="4">${esc(e.note)}</textarea></label>
      <p class="hint">Write times like “7:00 pm”, “2–5 pm” or “8 am – 6 pm” so Add to calendar works.</p>
      <div class="btn-row" style="margin-top:12px">${isNew ? "" : `<button class="btn ghost" data-del>${icon("trash", "sm")}Delete</button>`}<button class="btn" style="flex:2" data-ok>Done</button></div>
    `, (sh) => {
      sh.querySelector("[data-ok]").addEventListener("click", () => {
        const v = (id) => sh.querySelector(id).value.trim();
        if (!v("#et")) { sh.querySelector("#et").focus(); return; }
        const next = { ...e, title: v("#et"), time: v("#em"), where: v("#ew") || "Location TBD", note: v("#en") };
        if (isNew) evDraft[di].items.push(next); else evDraft[di].items[ei] = next;
        closeSheet(); eventsView();
      });
      const del = sh.querySelector("[data-del]");
      if (del) del.addEventListener("click", () => { evDraft[di].items.splice(ei, 1); closeSheet(); eventsView(); });
    });
  }

  // ======================================================================
  // VERSION HISTORY
  // ======================================================================
  async function historyView() {
    render(`
      <button class="back" onclick="location.hash='#/admin'">${icon("chevL", "sm")}Admin</button>
      <div class="head" style="margin-top:0"><div><h1 class="page-title">History</h1><div class="sub">Every published schedule, newest first</div></div></div>
      <div id="hist">${token() ? `<div class="empty"><b>Loading…</b></div>` : `<div class="note-card">Connect GitHub in <a class="link-btn" href="#/admin/settings">Settings</a> to see and restore earlier versions.</div>`}</div>`);
    if (!token()) return;
    const box = document.getElementById("hist");
    try {
      const commits = await gh(repoPath(`/commits?path=data.js&sha=${REPO.branch}&per_page=20`));
      box.innerHTML = `<div class="list plain">${commits.map((c, i) => `<div class="row hrow"><span class="main"><span class="t1">${esc(c.commit.message.split("\n")[0])}</span><span class="t2">${esc(fmtDate(c.commit.author.date))}${i === 0 ? " · live now" : ""}</span></span>${i === 0 ? '<span class="tag oz">Live</span>' : `<button class="btn ghost sm" data-sha="${c.sha}">Restore</button>`}</div>`).join("")}</div>`;
      box.querySelectorAll("[data-sha]").forEach((b) => b.addEventListener("click", () => restore(b.dataset.sha)));
    } catch (e) {
      box.innerHTML = `<div class="err-card">${icon("alert", "sm")}<div><b>Couldn't load history</b><span>${esc(e.message)}</span></div></div>`;
    }
  }
  function restore(sha) {
    openSheet("Restore this version?", `<p class="muted" style="margin-bottom:16px">The app will show this earlier schedule again. Nothing is lost — the current version stays in history.</p>
      <div class="btn-row"><button class="btn ghost" data-no>Cancel</button><button class="btn" style="flex:2" data-yes>Restore</button></div>`, (sh) => {
      sh.querySelector("[data-no]").addEventListener("click", () => closeSheet());
      sh.querySelector("[data-yes]").addEventListener("click", async () => {
        sh.querySelector("[data-yes]").disabled = true;
        try {
          const f = await getFile("data.js", sha);
          let text = unb64(f.content);
          if (!/window\.UMPIRES\s*=/.test(text)) throw new Error("That version doesn't look like a schedule file.");
          const id = newId();
          text = text.replace(/\n?\/\/ publish:[^\n]*\n?$/, "\n").replace(/\s*$/, "\n") + `// publish:${id}\n`;
          closeSheet(true);
          publish({ path: "data.js", text, publishId: id, message: `Admin: restore schedule from ${sha.slice(0, 7)}`, onLive: clearDraft });
        } catch (e) {
          sh.querySelector(".sh-body").insertAdjacentHTML("beforeend", `<p class="hint bad" style="margin-top:12px">${esc(e.message)}</p>`);
        }
      });
    });
  }

  // ======================================================================
  // ROUTER
  // ======================================================================
  window.USAFL_ADMIN = function (sub) {
    if (!unlocked()) return gate(() => window.USAFL_ADMIN(sub));
    const [page, arg] = (sub || "").split("/");
    switch (page) {
      case "settings": return settings();
      case "upload": return uploadView();
      case "edit": return editView(arg ? decodeURIComponent(arg) : null);
      case "announce": return announceView();
      case "events": return eventsView();
      case "history": return historyView();
      default: return home();
    }
  };
})();
