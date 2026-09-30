/* USAFL Umpires — Nationals 2026. Hash-routed single page app, no dependencies. */
(function () {
  "use strict";

  const $phone = document.getElementById("phone");
  const $app = document.getElementById("app");
  const $tabbar = document.getElementById("tabbar");
  const T = window.TOURNAMENT;
  const UMPIRES = window.UMPIRES || [];
  const SLOT_ORDER = window.SLOT_ORDER || [];
  const byId = Object.fromEntries(UMPIRES.map((u) => [u.id, u]));

  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
    del(k) { try { localStorage.removeItem(k); } catch {} },
  };

  // ---------- icons (single line set, 24px grid) ----------
  const ICONS = {
    home: '<path d="M3.5 10.5 12 3.5l8.5 7"/><path d="M5.5 9v10.5a1 1 0 0 0 1 1H10v-6h4v6h3.5a1 1 0 0 0 1-1V9"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    pitch: '<rect x="2.5" y="5.5" width="19" height="13" rx="6.5"/><path d="M12 5.5v13"/><circle cx="12" cy="12" r="2.4"/>',
    chat: '<path d="M20.5 12a8.5 8.5 0 0 1-12.2 7.65L3.5 20.5l.95-4.6A8.5 8.5 0 1 1 20.5 12Z"/>',
    more: '<circle cx="5.5" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="18.5" cy="12" r="1.4" fill="currentColor" stroke="none"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/>',
    chevR: '<path d="m9.5 6 6 6-6 6"/>',
    chevL: '<path d="m14.5 6-6 6 6 6"/>',
    chevD: '<path d="m6 9.5 6 6 6-6"/>',
    x: '<path d="M17.5 6.5l-11 11M6.5 6.5l11 11"/>',
    pin: '<path d="M12 21s-6.5-5.8-6.5-11A6.5 6.5 0 0 1 18.5 10c0 5.2-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.3"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    users: '<circle cx="9" cy="8.5" r="3.3"/><path d="M3 19.5a6 6 0 0 1 12 0"/><path d="M15.5 5.3a3.3 3.3 0 0 1 0 6.4M17.5 13.8a6 6 0 0 1 3.5 5.7"/>',
    book: '<path d="M4.5 5.5A2.5 2.5 0 0 1 7 3h12.5v14.5H7a2.5 2.5 0 0 0-2.5 2.5V5.5Z"/><path d="M4.5 20A2.5 2.5 0 0 1 7 17.5h12.5V21H7"/>',
    target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.8"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/>',
    award: '<circle cx="12" cy="9" r="5.5"/><path d="M8.8 13.5 7.5 21l4.5-2.6 4.5 2.6-1.3-7.5"/>',
    mail: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="m4 7.5 8 5.5 8-5.5"/>',
    ext: '<path d="M14 4h6v6M20 4l-8.5 8.5"/><path d="M18 13.5V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4.5"/>',
    calPlus: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4M12 13v5M9.5 15.5h5"/>',
    filter: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
    up: '<path d="M12 19V5.5M6 11.5 12 5.5l6 6"/>',
    shirt: '<path d="M8.5 3.5 3.5 6.5l2 4 2-1V20.5h9V9.5l2 1 2-4-5-3a3.5 3.5 0 0 1-7 0Z"/>',
    user: '<circle cx="12" cy="8.5" r="4"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/>',
    swap: '<path d="M4 8h13.5M14 4.5 17.5 8 14 11.5M20 16H6.5M10 12.5 6.5 16l3.5 3.5"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8v.2"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    download: '<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14"/>',
    cloudOff: '<path d="M3 3l18 18M8.5 6.5A6 6 0 0 1 17.6 10 4 4 0 0 1 20 17M17 19H7.5A4.5 4.5 0 0 1 5.6 10.4"/>',
    arrowR: '<path d="M5 12h14M13.5 6.5 19 12l-5.5 5.5"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>',
    moon: '<path d="M20 14.2A8.2 8.2 0 0 1 9.8 4 8.2 8.2 0 1 0 20 14.2Z"/>',
  };
  const icon = (n, cls = "") => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ""}</svg>`;
  const PITCH_ART = '<svg class="pitch" viewBox="0 0 300 230" fill="none" stroke="currentColor" stroke-width="3"><ellipse cx="150" cy="115" rx="140" ry="105"/><ellipse cx="150" cy="115" rx="34" ry="34"/><rect x="128" y="93" width="44" height="44"/><path d="M150 10v210"/><path d="M40 60a70 70 0 0 1 0 110M260 60a70 70 0 0 0 0 110"/></svg>';

  // ---------- time ----------
  // Sarasota is on EDT (UTC-4) during the tournament.
  const DAY_DATE = { sat: [2026, 9, 17], sun: [2026, 9, 18], finals: [2026, 9, 18] };
  const DAY_SHORT = { sat: "Sat", sun: "Sun", finals: "Finals" };
  const DAY_LONG = { sat: "Saturday", sun: "Sunday", finals: "Finals" };
  const MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
  const GAME_MIN = 55;

  const NOW_OVERRIDE = (() => {
    try {
      const p = new URLSearchParams(location.search).get("now");
      if (p) sessionStorage.setItem("usafl.now", p);
      return p || sessionStorage.getItem("usafl.now");
    } catch { return null; }
  })();
  const now = () => (NOW_OVERRIDE && !isNaN(new Date(NOW_OVERRIDE)) ? new Date(NOW_OVERRIDE) : new Date());

  function clockMins(str, fallbackAp) {
    const m = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i.exec(str || "");
    if (!m) return null;
    const ap = (m[3] || fallbackAp || "am").toLowerCase();
    let h = +m[1] % 12;
    if (ap === "pm") h += 12;
    return h * 60 + +(m[2] || 0);
  }
  const edt = (y, mo, d, mins) => new Date(Date.UTC(y, mo, d, 4, 0) + mins * 60000);
  const slotDate = (s) => edt(...DAY_DATE[s.day], clockMins(s.time));
  const hm = (mins) => { const h = Math.floor(mins / 60) % 24; return `${((h + 11) % 12) + 1}:${String(mins % 60).padStart(2, "0")}`; };
  const ap = (mins) => (Math.floor(mins / 60) % 24 >= 12 ? "PM" : "AM");
  const tShort = (t) => hm(clockMins(t));
  const tAp = (t) => ap(clockMins(t));
  const tFull = (t) => `${tShort(t)} ${tAp(t)}`;
  const isLive = (s, n) => { const a = slotDate(s); return n >= a && n < +a + GAME_MIN * 60000; };

  function relTime(ms) {
    const m = Math.round(ms / 60000);
    if (m < 1) return "now";
    if (m < 60) return `in ${m} min`;
    const h = Math.floor(m / 60), r = m % 60;
    if (h < 24) return r ? `in ${h} h ${r} min` : `in ${h} h`;
    const d = Math.round(h / 24);
    return `in ${d} day${d === 1 ? "" : "s"}`;
  }

  // Events like "Thursday, Oct 15" + "7–9 pm" / "8 am – 6 pm" / "1 pm onwards"
  function eventTimes(dayStr, timeStr) {
    const dm = /([A-Za-z]{3})[a-z]*\s+(\d{1,2})/.exec((dayStr.split(",")[1] || "").trim());
    if (!dm) return null;
    const mo = MONTHS[dm[1].toLowerCase()], d = +dm[2];
    const parts = timeStr.replace(/\s*onwards/i, "").split(/\s*[–-]\s*/);
    const endAp = ((/(am|pm)/i.exec(parts[parts.length - 1]) || [])[1]);
    const s = clockMins(parts[0], endAp), e = parts[1] ? clockMins(parts[1], endAp) : null;
    if (s == null) return null;
    return { start: edt(T.year, mo, d, s), end: e != null ? edt(T.year, mo, d, e) : null };
  }

  // ---------- schedule model ----------
  const ACTIVE = new Set(["field", "goal", "boundary", "ts", "coach", "duty"]);
  const ON_FIELD = new Set(["field", "goal", "boundary", "ts"]);
  const ROLE = { field: "Field umpire", goal: "Goal umpire", boundary: "Boundary umpire", ts: "Timer / scorer", coach: "Coaching", duty: "Duty" };
  const ROLE_SHORT = { field: "Field", goal: "Goal", boundary: "Boundary", ts: "T / S" };
  const PASSIVE = { playing: "With club", watch: "Watching", off: "Break", personal: "Personal time" };
  const edtDay = (d) => new Date(+d - 4 * 3600000); // shift so getUTC* reads Sarasota wall-clock

  const games = (u) => u.slots.filter((s) => ACTIVE.has(s.type));
  const gameCount = (u) => u.counts.field + u.counts.goal + u.counts.boundary + u.counts.ts;
  const initials = (u) => (u.firstName.replace(/[^A-Za-z]/g, "")[0] || "") + (u.lastName[0] || "");
  const levels = (u) => Object.values(u.accreditation).filter(Boolean);
  const going = (u) => Object.values(u.try).filter((t) => t && t !== "Ex" && t !== "-" && !levels(u).includes(t));
  const clubLabel = (u) => (u.isAussie ? "Australia" : u.club || "—");

  function findByRef(ref) {
    const r = (ref || "").toLowerCase().replace(/[\s.]/g, "");
    return UMPIRES.find((u) => u.lastName.toLowerCase().replace(/\s/g, "") === r)
      || UMPIRES.find((u) => (u.firstName[0] + u.lastName).toLowerCase().replace(/\s/g, "") === r) || null;
  }
  function crewAt(day, time, field) {
    const c = { field: [], goal: [], boundary: [], ts: [] };
    UMPIRES.forEach((u) => u.slots.forEach((s) => {
      if (s.day === day && s.time === time && s.field === field && ON_FIELD.has(s.type)) c[s.type].push({ u, tentative: s.tentative });
    }));
    return c;
  }
  function context(s) {
    if (s.field) return { field: s.field, crew: crewAt(s.day, s.time, s.field) };
    if (s.type === "coach" && s.label !== "Coaching") {
      const who = findByRef(s.label);
      const ws = who && who.slots.find((x) => x.day === s.day && x.time === s.time && x.field);
      return { who, field: ws ? ws.field : null, crew: ws ? crewAt(s.day, s.time, ws.field) : null };
    }
    return {};
  }
  function upcoming(u, n) {
    const list = games(u).map((s) => ({ s, at: slotDate(s) })).sort((a, b) => a.at - b.at);
    return { list, live: list.find((g) => isLive(g.s, n)), next: list.find((g) => g.at > n) };
  }

  // Remember what "my" schedule looked like, so a new data.js can flag changed slots.
  const sig = (s) => [s.day, s.time, s.type, s.label, s.field || ""].join("|");
  function changes(u) {
    const prev = store.get("usafl.snap." + u.id, null);
    const cur = games(u).map(sig);
    if (!prev) { store.set("usafl.snap." + u.id, cur); return { changed: new Set(), removed: 0 }; }
    const p = new Set(prev), c = new Set(cur);
    return { changed: new Set(cur.filter((x) => !p.has(x))), removed: prev.filter((x) => !c.has(x)).length };
  }
  const ackChanges = (u) => store.set("usafl.snap." + u.id, games(u).map(sig));

  const getMe = () => byId[store.get("usafl.me", null)] || null;

  // ---------- theme (index.html applies it before first paint) ----------
  const theme = () => document.documentElement.dataset.theme || "light";
  function applyTheme(t, animate) {
    const root = document.documentElement;
    if (animate) { root.classList.add("theming"); setTimeout(() => root.classList.remove("theming"), 400); }
    root.dataset.theme = t;
    const meta = document.getElementById("theme-color");
    if (meta) meta.content = t === "dark" ? "#0e0d0c" : "#f6f5f3";
  }
  function toggleTheme(btn) {
    const next = theme() === "dark" ? "light" : "dark";
    store.set("usafl.theme", next);
    applyTheme(next, true);
    if (btn) {
      btn.innerHTML = icon(next === "dark" ? "sun" : "moon", "sm anim");
      btn.setAttribute("aria-label", next === "dark" ? "Switch to light mode" : "Switch to dark mode");
    }
  }
  // Follow the phone's setting until the user picks one.
  const sysDark = window.matchMedia("(prefers-color-scheme: dark)");
  const onSys = () => { if (!store.get("usafl.theme", null)) applyTheme(sysDark.matches ? "dark" : "light", true); };
  if (sysDark.addEventListener) sysDark.addEventListener("change", onSys); else if (sysDark.addListener) sysDark.addListener(onSys);

  // ---------- routing ----------
  let tick = null;
  const TABS = [
    ["home", "home", "Home"],
    ["schedule", "calendar", "Schedule"],
    ["fields", "pitch", "Fields"],
    ["jeff", "chat", "Ask Jeff"],
    ["more", "more", "More"],
  ];
  const TAB_OF = { home: 0, "": 0, schedule: 1, umpires: 1, u: 1, fields: 2, jeff: 3, more: 4, guide: 4, quiz: 4 };

  function route() {
    const [page = "", arg] = location.hash.replace(/^#\/?/, "").split("/");
    clearInterval(tick);
    closeSheet(true);
    if ((page === "" || page === "home") && !getMe() && !store.get("usafl.skipWelcome", false)) { location.replace("#/welcome"); return; }
    const views = { "": home, home, schedule, umpires, u: umpire, fields, jeff, more, guide, quiz, welcome };
    $phone.classList.toggle("no-tabs", page === "welcome");
    (views[page] || home)(arg ? decodeURIComponent(arg) : undefined);
    $app.scrollTop = 0;
    animateIn();
    setTab(TAB_OF[page] ?? 0);
  }
  const go = (h) => { if (location.hash === h) route(); else location.hash = h; };
  window.addEventListener("hashchange", route);

  function render(html) { $app.innerHTML = `<div class="view">${html}</div>`; }
  // Number the children of every .stagger group so they cascade in (only animates inside .view-in).
  function staggerIn(root) {
    root.querySelectorAll(".stagger").forEach((g) => [...g.children].forEach((c, i) => c.style.setProperty("--i", Math.min(i, 14))));
  }
  function animateIn() {
    const v = $app.firstElementChild;
    if (!v) return;
    v.classList.remove("view-in"); void v.offsetWidth; v.classList.add("view-in");
    staggerIn($app);
  }

  function buildTabs() {
    $tabbar.innerHTML = `<span class="tab-ind"></span>` + TABS.map(([id, ic, label], i) =>
      `<button class="tab" data-i="${i}" aria-label="${label}">${icon(ic)}<span>${label}</span></button>`).join("");
    $tabbar.querySelectorAll(".tab").forEach((b) => b.addEventListener("click", () => {
      const id = TABS[+b.dataset.i][0];
      go("#/" + id);
    }));
    const size = () => { const ind = $tabbar.querySelector(".tab-ind"); ind.style.width = `calc((100% - 12px) / ${TABS.length})`; };
    size();
  }
  function setTab(i) {
    $tabbar.querySelectorAll(".tab").forEach((b, j) => { b.classList.toggle("on", i === j); b.setAttribute("aria-current", i === j ? "page" : "false"); });
    const ind = $tabbar.querySelector(".tab-ind");
    if (ind) ind.style.transform = `translateX(${i * 100}%)`;
  }

  // segmented control helper — returns html; wire with wireSeg
  function seg(name, opts, value) {
    const idx = Math.max(0, opts.findIndex((o) => o.v === value));
    return `<div class="seg" data-seg="${name}">
      <span class="thumb" style="width:calc((100% - 6px) / ${opts.length});transform:translateX(${idx * 100}%)"></span>
      ${opts.map((o) => `<button data-v="${esc(o.v)}" class="${o.v === value ? "on" : ""}">${esc(o.label)}${o.count != null ? `<span class="c">${o.count}</span>` : ""}</button>`).join("")}
    </div>`;
  }
  function wireSeg(name, onChange) {
    const el = $app.querySelector(`[data-seg="${name}"]`);
    if (!el) return;
    const btns = [...el.querySelectorAll("button")];
    btns.forEach((b, i) => b.addEventListener("click", () => {
      btns.forEach((x) => x.classList.toggle("on", x === b));
      el.querySelector(".thumb").style.transform = `translateX(${i * 100}%)`;
      onChange(b.dataset.v);
    }));
  }

  // ---------- sheet ----------
  let sheetEls = null;
  function openSheet(title, body, onMount) {
    closeSheet(true);
    const scrim = document.createElement("div");
    scrim.className = "scrim";
    const sh = document.createElement("div");
    sh.className = "sheet";
    sh.setAttribute("role", "dialog");
    sh.innerHTML = `<div class="drag-zone"><div class="grab-hit"><div class="grab"></div></div><div class="sh-head"><h3>${esc(title)}</h3><button class="icon-btn" data-close aria-label="Close">${icon("x", "sm")}</button></div></div><div class="sh-body">${body}</div>`;
    $phone.append(scrim, sh);
    sheetEls = { scrim, sh };
    requestAnimationFrame(() => { scrim.classList.add("on"); sh.classList.add("on"); });
    scrim.addEventListener("click", () => closeSheet());
    sh.querySelector("[data-close]").addEventListener("click", () => closeSheet());
    dragToClose(sh, scrim);
    if (onMount) onMount(sh);
  }
  // Pull the handle/title down to dismiss; follows the finger, closes past a threshold or on a quick flick.
  function dragToClose(sh, scrim) {
    const zone = sh.querySelector(".drag-zone");
    let startY = null, dy = 0, lastY = 0, lastT = 0, vel = 0;
    zone.addEventListener("pointerdown", (e) => {
      if (e.target.closest("[data-close]")) return;
      startY = lastY = e.clientY; lastT = e.timeStamp; dy = 0; vel = 0;
      sh.style.transition = "none"; scrim.style.transition = "none";
      zone.setPointerCapture(e.pointerId);
    });
    zone.addEventListener("pointermove", (e) => {
      if (startY == null) return;
      const raw = e.clientY - startY;
      dy = raw > 0 ? raw : raw / 6; // resist dragging upward
      vel = (e.clientY - lastY) / Math.max(1, e.timeStamp - lastT);
      lastY = e.clientY; lastT = e.timeStamp;
      sh.style.transform = `translateY(${dy}px)`;
      scrim.style.opacity = String(Math.max(0, 1 - Math.max(0, dy) / sh.offsetHeight));
    });
    const end = () => {
      if (startY == null) return;
      startY = null;
      sh.style.transition = ""; scrim.style.transition = "";
      if (dy > Math.min(120, sh.offsetHeight * 0.25) || (dy > 20 && vel > 0.5)) closeSheet();
      else { sh.style.transform = ""; scrim.style.opacity = ""; }
    };
    zone.addEventListener("pointerup", end);
    zone.addEventListener("pointercancel", end);
  }
  function closeSheet(instant) {
    if (!sheetEls) return;
    const { scrim, sh } = sheetEls;
    sheetEls = null;
    if (instant) { scrim.remove(); sh.remove(); return; }
    // clear any drag offset in the same frame so it animates from where the finger let go
    sh.style.transform = ""; scrim.style.opacity = "";
    scrim.classList.remove("on"); sh.classList.remove("on");
    setTimeout(() => { scrim.remove(); sh.remove(); }, 450);
  }
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeSheet(); });

  // ---------- shared bits ----------
  function avatar(u, cls = "") { return `<span class="avatar ${u.isAussie ? "oz" : ""} ${cls}">${esc(initials(u))}</span>`; }
  const CREW_LABEL = { field: "Field", goal: "Goal", boundary: "Boundary", ts: "Timer / scorer" };
  function crewHTML(crew, meId) {
    if (!crew) return "";
    const groups = ["field", "goal", "boundary", "ts"].filter((r) => crew[r].length).map((r) =>
      `<div class="grp"><div class="rl">${CREW_LABEL[r]}</div><div class="ppl">${crew[r].map(({ u, tentative }) =>
        `<a class="p ${u.id === meId ? "me" : ""}" href="#/u/${u.id}"><span class="av-xs ${u.isAussie ? "oz" : ""}">${esc(initials(u))}</span><span class="nm">${esc(u.id === meId ? "You" : u.name)}</span>${tentative ? '<span class="tbc">TBC</span>' : ""}</a>`).join("")}</div></div>`);
    return groups.length ? `<div class="crew">${groups.join("")}</div>` : "";
  }
  function roleTag(s) {
    if (s.type === "duty") return `<span class="tag duty">${esc(s.label)}</span>`;
    return `<span class="tag ${s.type === "field" ? "brand" : s.type}">${ROLE[s.type]}</span>`;
  }
  function empty(ic, title, text) { return `<div class="empty"><div class="e-i">${icon(ic)}</div><b>${esc(title)}</b>${esc(text)}</div>`; }

  // ======================================================================
  // WELCOME (first launch: pick your name)
  // ======================================================================
  function welcome() {
    render(`
      <div class="welcome">
        <div class="stagger">
          <img class="logo" src="icons/icon-192.png" alt="USAFL Umpires Association" />
          <h1 class="page-title">Nationals<br/><em>${T.year}</em></h1>
          <p class="lead">${esc(T.city)} · ${esc(T.dates.replace(`, ${T.year}`, ""))}. Find your name to see every game, field and crew for the weekend.</p>
          <label class="search">${icon("search", "sm")}<input id="wq" placeholder="Type your name" autocomplete="off" autocapitalize="words" /></label>
        </div>
        <div class="results list plain" id="wres" hidden></div>
        <button class="skip" id="wskip">Browse without choosing</button>
        <p class="small">No login. This just personalises the app on this phone.</p>
      </div>`);
    const $q = document.getElementById("wq"), $r = document.getElementById("wres");
    $q.addEventListener("input", () => {
      const q = $q.value.trim().toLowerCase();
      const hits = q ? UMPIRES.filter((u) => u.name.toLowerCase().includes(q)).slice(0, 6) : [];
      $r.hidden = !hits.length;
      $r.innerHTML = hits.map((u) => `<button class="row" data-id="${u.id}">${avatar(u)}<span class="main"><span class="t1">${esc(u.name)}</span><span class="t2">${esc(clubLabel(u))} · ${esc(levels(u).join(" / "))}</span></span><span class="trail">${icon("chevR", "sm")}</span></button>`).join("");
      $r.querySelectorAll("[data-id]").forEach((b) => b.addEventListener("click", () => {
        store.set("usafl.me", b.dataset.id);
        go("#/home");
      }));
    });
    document.getElementById("wskip").addEventListener("click", () => { store.set("usafl.skipWelcome", true); go("#/home"); });
  }

  // ======================================================================
  // HOME
  // ======================================================================
  function home() {
    const me = getMe(), n = now();
    const h = n.getHours();
    const greet = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
    const up = me ? upcoming(me, n) : null;
    const ch = me ? changes(me) : null;
    const hasChanges = ch && (ch.changed.size || ch.removed);

    // weekend strip
    const strip = me && up.list.length ? `
      <div class="section">
        <div class="section-head"><h2>Your weekend</h2><a href="#/schedule">All</a></div>
        <div class="strip">${up.list.map((g) => {
          const past = +g.at + GAME_MIN * 60000 < n;
          const isNext = up.next && g.s === up.next.s && !up.live;
          const c = context(g.s);
          const where = c.field ? `Field ${c.field}` : g.s.type === "duty" ? g.s.label : "Umpire Central";
          return `<a class="mini pressable ${past ? "past" : ""} ${isNext || (up.live && g.s === up.live.s) ? "next" : ""}" href="#/schedule">
            <div class="d">${DAY_SHORT[g.s.day]}</div>
            <div class="t">${tShort(g.s.time)}<small>${tAp(g.s.time)}</small></div>
            <div class="f">${esc(where)}</div>
            <div class="r">${esc(g.s.type === "coach" && c.who ? "Coaching " + c.who.firstName : ROLE[g.s.type] || g.s.label)}</div>
          </a>`;
        }).join("")}</div>
      </div>` : "";

    // live hour for the Fields tile
    const liveSlot = SLOT_ORDER.find((s) => isLive(s, n));
    const bestQuiz = store.get("usafl.quiz.best", null);
    const nextEvent = window.EVENTS.flatMap((d) => d.items.map((e) => ({ d, e, t: eventTimes(d.day, e.time) })))
      .find((x) => x.t && (x.t.end || new Date(+x.t.start + 2 * 3600000)) > n);

    render(`
      <div class="topbar">
        <div class="brand"><img src="icons/icon-192.png" alt="" /><div><div class="b1">USAFL Umpires</div><div class="b2">Nationals ${T.year} · ${esc(T.city)}</div></div></div>
        <div class="top-actions">
          <button class="me-btn theme-btn pressable" id="theme" aria-label="${theme() === "dark" ? "Switch to light mode" : "Switch to dark mode"}">${icon(theme() === "dark" ? "sun" : "moon", "sm")}</button>
          <a class="me-btn pressable" href="#/more" aria-label="Profile">${me ? esc(initials(me)) : icon("user", "sm")}</a>
        </div>
      </div>
      <div class="greet"><div class="g1">${greet}${me ? `, ${esc(me.firstName)}` : ""}</div></div>
      ${heroHTML(me, up, n)}
      ${hasChanges ? `<a class="notice pressable" href="#/schedule">${icon("info", "sm")}<span class="grow">Your schedule changed since you last checked.</span>${icon("chevR", "sm")}</a>` : ""}
      ${strip}
      <div class="section">
        <div class="section-head"><h2>Tournament</h2></div>
        <div class="grid2 stagger">
          <a class="tile pressable" href="#/fields"><span class="ti">${icon("pitch")}</span><span><span class="tt">Field board</span><span class="ts">${liveSlot ? `<i class="live-dot"></i>Live · ${tFull(liveSlot.time)}` : "Every crew, hour by hour"}</span></span></a>
          <a class="tile pressable" href="#/jeff"><span class="ti">${icon("chat")}</span><span><span class="tt">Ask Jeff</span><span class="ts">Rules, procedures, gear</span></span></a>
          <a class="tile pressable" href="#/guide"><span class="ti">${icon("book")}</span><span><span class="tt">Weekend guide</span><span class="ts">${nextEvent ? `Next: ${esc(nextEvent.e.title)}` : "Events & playbook"}</span></span></a>
          <a class="tile pressable" href="#/quiz"><span class="ti">${icon("target")}</span><span><span class="tt">Rules quiz</span><span class="ts">${bestQuiz != null ? `Best ${bestQuiz}/${window.QUIZ.length}` : `${window.QUIZ.length} questions`}</span></span></a>
        </div>
      </div>
      ${nextEvent ? `
      <div class="section">
        <div class="section-head"><h2>Coming up</h2><a href="#/guide">Guide</a></div>
        <a class="card event-card pressable" href="#/guide">
          <div class="when"><div class="dow">${esc(nextEvent.d.day.slice(0, 3))}</div><div class="dd">${edtDay(nextEvent.t.start).getUTCDate()}</div></div>
          <div class="what"><div class="tm">${esc(nextEvent.e.time)}</div><div class="tl">${esc(nextEvent.e.title)}</div><div class="wh">${esc(nextEvent.e.where)}</div></div>
        </a>
      </div>` : ""}
      <p class="foot-note">Preliminary draft schedule · always confirm at the Big Sheets.<br/>Questions? <a class="link-btn" href="mailto:${esc(T.directorEmail)}">Email Jeff</a></p>
    `);
    const tb = document.getElementById("theme");
    tb.addEventListener("click", () => toggleTheme(tb));
    const hc = $app.querySelector(".hcrew");
    if (hc) hc.querySelector(".hcrew-head").addEventListener("click", () => {
      const open = hc.classList.toggle("open");
      hc.querySelector(".hcrew-head").setAttribute("aria-expanded", String(open));
      store.set("usafl.heroCrewOpen", open);
    });
    tick = setInterval(() => { if (!sheetEls && $app.scrollTop < 40) home(); }, 60000);
  }

  function heroHTML(me, up, n) {
    const art = PITCH_ART + '<div class="glow"></div>';
    if (!me) {
      return `<section class="hero">${art}
        <div class="eyebrow">Nationals ${T.year}</div>
        <h3>Find your<br/>games</h3>
        <p>Pick your name once and the app shows your next game, field and crew.</p>
        <div class="hero-foot"><span class="meta">${UMPIRES.length} umpires on the draft</span><a class="hero-cta" href="#/welcome">Find my name ${icon("chevR", "xs")}</a></div>
      </section>`;
    }
    const first = new Date(T.firstDay);
    const startOfFirst = new Date(+first - 8 * 3600000); // midnight Sat, Sarasota
    if (!up.list.length) {
      return `<section class="hero">${art}
        <div class="eyebrow">${esc(me.name)}</div>
        <h3>No games<br/>on the draft</h3>
        <p>Nothing's assigned to you on this version of the schedule. Check with Jeff if that's unexpected.</p>
      </section>`;
    }
    const nextLine = (g, label) => {
      const c = context(g.s);
      return `<div class="eyebrow">${label}</div>
        <div class="hero-time">${DAY_SHORT[g.s.day]} ${tShort(g.s.time)}<small>${tAp(g.s.time)}</small></div>
        <div class="hero-where">${c.field ? `Field <span class="accent">${c.field}</span>` : esc(g.s.type === "duty" ? g.s.label : "Umpire Central")}</div>
        <div class="hero-role">${esc(g.s.type === "coach" && c.who ? `Coaching ${c.who.name}` : ROLE[g.s.type] || g.s.label)}${g.s.tentative ? " · TBC" : ""}</div>
        ${crewRows(c, me)}`;
    };
    if (n < startOfFirst) {
      const ms = first - n;
      const days = Math.max(1, Math.floor(ms / 86400000));
      const g = up.list[0];
      return `<section class="hero">${art}
        <div class="eyebrow">First bounce in</div>
        <div class="hero-count"><span class="big">${days}</span><span class="unit">day${days === 1 ? "" : "s"}</span></div>
        <div class="hero-rule"></div>
        ${nextLine(g, "Your first game")}
        <div class="hero-foot"><span class="meta">${gameCount(me)} games${me.counts.coach ? ` · ${me.counts.coach} coaching` : ""}</span><a class="hero-cta" href="#/schedule">My schedule ${icon("chevR", "xs")}</a></div>
      </section>`;
    }
    if (up.live) {
      return `<section class="hero">${art}
        ${nextLine(up.live, `<i class="live-dot"></i>On now`)}
        <div class="hero-foot"><span class="meta">${up.next ? `Then ${DAY_SHORT[up.next.s.day]} ${tFull(up.next.s.time)}` : "Last game of your weekend"}</span><a class="hero-cta" href="#/fields">Field board ${icon("chevR", "xs")}</a></div>
      </section>`;
    }
    if (up.next) {
      return `<section class="hero">${art}
        ${nextLine(up.next, `Up next · ${relTime(up.next.at - n)}`)}
        <div class="hero-foot"><span class="meta">${up.list.filter((g) => g.at < n).length} of ${up.list.length} done</span><a class="hero-cta" href="#/schedule">My schedule ${icon("chevR", "xs")}</a></div>
      </section>`;
    }
    return `<section class="hero">${art}
      <div class="eyebrow">That's a wrap</div>
      <h3>${up.list.length} games<br/>done</h3>
      <p>Thanks for a huge weekend. Record any changes on the Big Sheets and thank the Tent Queens.</p>
    </section>`;
  }
  // Collapsible crew on the home card: a one-line summary that expands to the full list.
  function crewRows(c, me) {
    if (!c.crew) return "";
    const others = {};
    ["field", "goal", "boundary", "ts"].forEach((r) => { others[r] = c.crew[r].filter((x) => x.u.id !== me.id); });
    const people = [].concat(others.field, others.goal, others.boundary, others.ts);
    if (!people.length) return "";
    const open = store.get("usafl.heroCrewOpen", false);
    const shown = people.slice(0, people.length > 4 ? 3 : 4);
    return `<div class="hero-rule"></div>
      <div class="hcrew ${open ? "open" : ""}">
        <button class="hcrew-head" aria-expanded="${open}">
          <span class="stack">${shown.map(({ u }) => `<span class="av-xs ${u.isAussie ? "oz" : ""}">${esc(initials(u))}</span>`).join("")}${people.length > shown.length ? `<span class="av-xs more">+${people.length - shown.length}</span>` : ""}</span>
          <span class="lbl">Your crew · ${people.length} other${people.length === 1 ? "" : "s"}</span>
          ${icon("chevD", "sm chev")}
        </button>
        <div class="acc-body"><div class="acc-inner">${crewHTML(others, me.id)}</div></div>
      </div>`;
  }

  // ======================================================================
  // SCHEDULE (mine) / UMPIRE PROFILE
  // ======================================================================
  function schedule() {
    const me = getMe();
    if (me) return umpire(me.id, true);
    umpires();
  }

  const dayPick = {};
  function umpire(id, asMine) {
    const u = byId[id];
    if (!u) return go("#/umpires");
    const me = getMe(), isMe = me && me.id === u.id, n = now();
    const days = ["sat", "sun", "finals"];
    const today = n >= new Date(Date.UTC(2026, 9, 18, 4)) ? "sun" : "sat";
    const day = dayPick[u.id] || today;
    const ch = isMe ? changes(u) : { changed: new Set() };
    const up = upcoming(u, n);
    const tags = [
      `<span class="tag ${u.isAussie ? "oz" : "brand"}">${esc(clubLabel(u))}</span>`,
      ...Object.entries(u.accreditation).map(([d, l]) => `<span class="tag">${d === "field" ? "Field" : d === "goal" ? "Goal" : "Boundary"} ${esc(l)}</span>`),
      ...going(u).map((t) => `<span class="tag solid">Going for ${esc(t)}</span>`),
    ].join("");

    render(`
      ${asMine ? `
        <div class="head"><div><h1 class="page-title">My games</h1><div class="sub">Draft v011 · subject to change</div></div>
          <div class="head-actions"><a class="icon-btn pressable" href="#/umpires" aria-label="All umpires">${icon("users", "sm")}</a></div></div>`
      : `<button class="back" onclick="history.length > 1 ? history.back() : location.hash='#/umpires'">${icon("chevL", "sm")}Back</button>`}
      <div class="profile">
        ${avatar(u, "lg")}
        <div><div class="pn">${esc(u.name)}</div><div class="tags">${tags}</div></div>
      </div>
      <div class="stats">
        ${[["field", "Field"], ["goal", "Goal"], ["boundary", "Bound."], ["coach", "Coach"]].map(([k, l]) => `<div><b class="${u.counts[k] ? "" : "zero"}">${u.counts[k]}</b><span>${l}</span></div>`).join("")}
      </div>
      ${!isMe ? `<div class="claim"><button class="btn ghost sm" id="claim">${icon("user", "sm")}This is me</button></div>` : ""}
      ${seg("day", days.map((d) => ({ v: d, label: DAY_SHORT[d], count: u.slots.filter((s) => s.day === d && ACTIVE.has(s.type)).length || null })), day)}
      <div id="tl">${timeline(u, day, n, up, ch.changed, me)}</div>
    `);
    wireSeg("day", (v) => {
      dayPick[u.id] = v;
      const tl = document.getElementById("tl");
      tl.innerHTML = timeline(u, v, now(), up, ch.changed, me);
      staggerIn(tl);
    });
    const claim = document.getElementById("claim");
    if (claim) claim.addEventListener("click", () => { store.set("usafl.me", u.id); store.del("usafl.skipWelcome"); go("#/schedule"); });
    if (isMe) ackChanges(u);
  }

  function timeline(u, day, n, up, changed, me) {
    const slots = u.slots.filter((s) => s.day === day);
    const active = slots.filter((s) => ACTIVE.has(s.type));
    if (day === "finals" && !active.length) {
      return `<div class="note-card">Finals crews are named on Saturday night based on the day's results — announced at the Umpire Fete, or posted at Umpire Central first thing Sunday.</div>`;
    }
    if (!slots.length) return empty("calendar", `Nothing on ${DAY_LONG[day]}`, "No assignments on the draft for this day.");
    // collapse consecutive non-game hours into one quiet line
    const blocks = [];
    slots.forEach((s) => {
      if (ACTIVE.has(s.type)) { blocks.push({ game: true, s }); return; }
      const label = s.type === "maybe" ? `Possibly ${s.label}` : PASSIVE[s.type] ?? s.label;
      const last = blocks[blocks.length - 1];
      if (last && !last.game && last.label === label && clockMins(s.time) - clockMins(last.end.time) === 60) last.end = s;
      else blocks.push({ game: false, label, start: s, end: s });
    });
    const meId = me && me.id;
    return `<div class="stagger">${blocks.map((b) => {
      if (!b.game) {
        const until = hm(clockMins(b.end.time) + 60) + " " + ap(clockMins(b.end.time) + 60);
        return `<div class="tl gap"><div class="tl-time"><b>${tShort(b.start.time)}</b></div><div class="tl-rail"><i></i></div>
          <div class="gap-l"><b>${esc(b.label || "Free")}</b> · until ${until}</div></div>`;
      }
      const s = b.s, c = context(s);
      const live = isLive(s, n), past = +slotDate(s) + GAME_MIN * 60000 < n;
      const nxt = !up.live && up.next && up.next.s === s;
      const title = c.field ? `Field ${c.field}` : s.type === "duty" ? s.label : "Umpire Central";
      const sub = s.type === "coach"
        ? (c.who ? `Observing <a class="link-btn" href="#/u/${c.who.id}">${esc(c.who.name)}</a>` : "Observation")
        : "";
      return `<div class="tl game ${live ? "live" : ""} ${past ? "past" : ""} ${nxt ? "next" : ""}">
        <div class="tl-time"><b>${tShort(s.time)}</b><span>${tAp(s.time)}</span></div>
        <div class="tl-rail"><i></i></div>
        <div class="tl-card">
          <div class="top">${live ? '<span class="tag live">Live</span>' : ""}${roleTag(s)}${s.tentative ? '<span class="tag">TBC</span>' : ""}${changed.has(sig(s)) ? '<span class="tag solid">Updated</span>' : ""}</div>
          <div class="fld">${esc(title)}</div>
          ${sub ? `<div class="sub">${sub}</div>` : ""}
          ${crewHTML(c.crew, meId)}
        </div>
      </div>`;
    }).join("")}</div>`;
  }

  // ======================================================================
  // DIRECTORY
  // ======================================================================
  const dir = { q: "", disc: "all", level: null, oz: false };
  function umpires() {
    const me = getMe();
    const nFilters = (dir.level ? 1 : 0) + (dir.oz ? 1 : 0);
    render(`
      <div class="head"><div><h1 class="page-title">Umpires</h1><div class="sub">${UMPIRES.length} on the Nationals draft</div></div>
        ${me ? `<div class="head-actions"><a class="icon-btn pressable" href="#/schedule" aria-label="My games">${icon("calendar", "sm")}</a></div>` : ""}</div>
      <div class="sticky-search"><label class="search">${icon("search", "sm")}<input id="q" placeholder="Search name or club" value="${esc(dir.q)}" autocomplete="off" />${dir.q ? `<button class="clear" id="qx" aria-label="Clear">${icon("x", "sm")}</button>` : ""}</label></div>
      <div class="filter-row">
        ${seg("disc", [{ v: "all", label: "All" }, { v: "field", label: "Field" }, { v: "goal", label: "Goal" }, { v: "boundary", label: "Bound." }], dir.disc)}
        <button class="icon-btn pressable" id="flt" aria-label="Filters">${icon("filter", "sm")}${nFilters ? `<span class="dot">${nFilters}</span>` : ""}</button>
      </div>
      <div id="dlist"></div>
    `);
    const $q = document.getElementById("q");
    $q.addEventListener("input", () => { dir.q = $q.value; listDir(); });
    const qx = document.getElementById("qx");
    if (qx) qx.addEventListener("click", () => { dir.q = ""; umpires(); animateIn(); });
    wireSeg("disc", (v) => { dir.disc = v; listDir(); });
    document.getElementById("flt").addEventListener("click", filterSheet);
    listDir();
  }
  function listDir() {
    const me = getMe();
    const q = dir.q.trim().toLowerCase();
    const list = UMPIRES.filter((u) => {
      if (q && !(u.name.toLowerCase().includes(q) || (u.club || "").toLowerCase().includes(q) || (u.isAussie && "australia".includes(q)))) return false;
      if (dir.disc !== "all" && !u.disciplines.includes(dir.disc)) return false;
      if (dir.oz && !u.isAussie) return false;
      if (dir.level && !levels(u).includes(dir.level)) return false;
      return true;
    });
    const row = (u) => `<a class="row" href="#/u/${u.id}">${avatar(u)}
      <span class="main"><span class="t1">${esc(u.name)}${me && u.id === me.id ? ' <span class="tag brand">You</span>' : ""}</span>
      <span class="t2">${esc(clubLabel(u))} · ${esc(levels(u).join(" / "))}${going(u).length ? ` → ${esc(going(u).join(" / "))}` : ""}</span></span>
      <span class="trail"><span><div class="count-num">${gameCount(u)}</div><div class="count-lbl">games</div></span>${icon("chevR", "sm")}</span></a>`;
    const groups = {};
    list.forEach((u) => { const L = u.lastName[0].toUpperCase(); (groups[L] = groups[L] || []).push(u); });
    const $l = document.getElementById("dlist");
    $l.innerHTML = list.length
      ? Object.keys(groups).sort().map((L) => `<div class="letter">${L}</div><div class="list">${groups[L].map(row).join("")}</div>`).join("")
      : empty("search", "No matches", "Try a different name or clear a filter.");
  }
  function filterSheet() {
    const lv = ["F2", "F1", "F0", "FC", "G2", "G1", "GC", "B2"];
    openSheet("Filters", `
      <div class="eyebrow" style="margin-bottom:10px">Accreditation</div>
      <div class="chips">${lv.map((l) => `<button class="chip ${dir.level === l ? "on" : ""}" data-l="${l}">${l}</button>`).join("")}</div>
      <div class="eyebrow" style="margin-bottom:10px">Home</div>
      <div class="chips"><button class="chip oz ${dir.oz ? "on" : ""}" data-oz>Australian guests only</button></div>
      <div style="display:flex;gap:10px;margin-top:6px"><button class="btn ghost" style="flex:1" data-reset>Reset</button><button class="btn dark" style="flex:2" data-done>Show umpires</button></div>
    `, (sh) => {
      sh.querySelectorAll("[data-l]").forEach((b) => b.addEventListener("click", () => {
        dir.level = dir.level === b.dataset.l ? null : b.dataset.l;
        sh.querySelectorAll("[data-l]").forEach((x) => x.classList.toggle("on", x.dataset.l === dir.level));
      }));
      const oz = sh.querySelector("[data-oz]");
      oz.addEventListener("click", () => { dir.oz = !dir.oz; oz.classList.toggle("on", dir.oz); });
      sh.querySelector("[data-reset]").addEventListener("click", () => { dir.level = null; dir.oz = false; closeSheet(); umpires(); });
      sh.querySelector("[data-done]").addEventListener("click", () => { closeSheet(); umpires(); });
    });
  }

  // ======================================================================
  // FIELD BOARD
  // ======================================================================
  const fb = { day: null, time: null };
  const FIELD_NUMS = [...new Set(UMPIRES.flatMap((u) => u.slots.filter((s) => s.field).map((s) => s.field)))].sort((a, b) => a - b);
  function fields() {
    const n = now(), me = getMe();
    if (!fb.day) {
      const live = SLOT_ORDER.find((s) => isLive(s, n));
      const myNext = me && upcoming(me, n).next;
      const firstBusy = SLOT_ORDER.find((s) => UMPIRES.some((u) => u.slots.some((x) => x.day === s.day && x.time === s.time && x.field)));
      const pick = live || (myNext && myNext.s) || firstBusy || SLOT_ORDER[0];
      fb.day = pick.day; fb.time = pick.time;
    }
    const times = SLOT_ORDER.filter((s) => s.day === fb.day).map((s) => s.time);
    if (!times.includes(fb.time)) fb.time = times[0];
    render(`
      <div class="head"><div><h1 class="page-title">Field board</h1><div class="sub">Who's on every field, each hour</div></div></div>
      ${seg("fday", ["sat", "sun", "finals"].map((d) => ({ v: d, label: DAY_LONG[d] })), fb.day)}
      <div class="hours" id="hours">${times.map((t) => {
        const live = isLive({ day: fb.day, time: t }, n);
        return `<button class="hour ${t === fb.time ? "on" : ""}" data-t="${t}"><b>${tShort(t)}</b><span>${live ? '<i class="live-dot"></i>LIVE' : tAp(t)}</span></button>`;
      }).join("")}</div>
      <div id="board"></div>
    `);
    wireSeg("fday", (v) => { fb.day = v; fb.time = null; fields(); animateIn(); });
    document.querySelectorAll("#hours .hour").forEach((b) => b.addEventListener("click", () => {
      fb.time = b.dataset.t;
      document.querySelectorAll("#hours .hour").forEach((x) => x.classList.toggle("on", x === b));
      drawBoard();
      b.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }));
    const on = document.querySelector("#hours .hour.on");
    if (on) on.scrollIntoView({ inline: "center", block: "nearest" });
    drawBoard();
  }
  function drawBoard() {
    const me = getMe(), meId = me && me.id;
    const crews = FIELD_NUMS.map((f) => ({ f, c: crewAt(fb.day, fb.time, f) }));
    const any = crews.some(({ c }) => c.field.length + c.goal.length + c.boundary.length + c.ts.length);
    const $b = document.getElementById("board");
    if (!any) {
      $b.innerHTML = fb.day === "finals"
        ? `<div class="note-card">Finals crews are named on Saturday night. Check back after the Umpire Fete.</div>`
        : empty("pitch", "No games this hour", "No umpires are assigned to a field at this time.");
      return;
    }
    $b.innerHTML = `<div class="board stagger">${crews.map(({ f, c }) => {
      const mine = meId && ["field", "goal", "boundary", "ts"].some((r) => c[r].some((x) => x.u.id === meId));
      const has = c.field.length + c.goal.length + c.boundary.length + c.ts.length;
      return `<div class="fcard ${mine ? "mine" : ""}">
        <div class="fh"><span class="fl">Field</span><b>${f}</b>${mine ? '<span class="tag brand">You</span>' : ""}</div>
        ${has ? crewHTML(c, meId) : '<div class="none">No crew assigned</div>'}
      </div>`;
    }).join("")}</div>`;
    staggerIn($b);
  }

  // ======================================================================
  // ASK JEFF
  // ======================================================================
  const TOPICS = [
    ["Game day", ["What do I do at the final siren?", "When is the team photo?", "How do BAF votes work?"]],
    ["Rules", ["What's holding the ball?", "When is it a 50 metre penalty?", "What if it goes out on the full?"]],
    ["Cards & observations", ["What happens if I give a red card?", "How do observations work?"]],
    ["Gear & pay", ["When do I pick up my gear?", "When do I get paid?"]],
  ];
  let chat = [];
  let typing = false;
  function jeff() {
    render(`<div class="jeff">
      ${chat.length ? `<div class="head"><div><h1 class="page-title">Ask Jeff</h1></div><div class="head-actions"><button class="icon-btn pressable" id="jclear" aria-label="New conversation">${icon("swap", "sm")}</button></div></div>` : `
      <div class="jeff-intro">
        <div class="eyebrow">Tournament & rules desk</div>
        <h1 class="page-title" style="margin-top:6px">Ask Jeff</h1>
        <p class="muted" style="margin-top:8px;max-width:34ch">Procedures, rules and interpretations, gear and pay — or ask when any umpire is on.</p>
      </div>
      <div class="stagger">${TOPICS.map(([t, qs]) => `<div class="topic"><div class="eyebrow">${esc(t)}</div><div class="list plain">${qs.map((q) =>
        `<button class="row" data-q="${esc(q)}"><span class="main"><span class="t1" style="font-weight:500;font-size:15.5px">${esc(q)}</span></span><span class="trail">${icon("arrowR", "sm")}</span></button>`).join("")}</div></div>`).join("")}</div>`}
      <div class="log" id="log">${chat.map((m, i) => `<div class="msg ${m.who} ${i === chat.length - 1 ? "new" : ""}">${m.who === "jeff" ? '<div class="who">Jeff</div>' : ""}${esc(m.text)}</div>`).join("")}${typing ? '<div class="msg jeff new"><div class="who">Jeff</div><span class="typing"><i></i><i></i><i></i></span></div>' : ""}</div>
      <div class="composer-wrap">
        <form class="composer" id="jf"><input id="jq" placeholder="Ask about rules, gear, schedule…" autocomplete="off" enterkeyhint="send" /><button class="send" id="js" type="submit" disabled aria-label="Send">${icon("up", "sm")}</button></form>
        <div class="disclaim">Answers come from the umpire guide. Confirm changes at Umpire Central.</div>
      </div>
    </div>`);
    const $q = document.getElementById("jq"), $s = document.getElementById("js");
    $q.addEventListener("input", () => { $s.disabled = !$q.value.trim(); });
    document.getElementById("jf").addEventListener("submit", (e) => { e.preventDefault(); ask($q.value); });
    $app.querySelectorAll("[data-q]").forEach((b) => b.addEventListener("click", () => ask(b.dataset.q)));
    const clr = document.getElementById("jclear");
    if (clr) clr.addEventListener("click", () => { chat = []; jeff(); animateIn(); });
    if (chat.length) requestAnimationFrame(() => { $app.scrollTop = $app.scrollHeight; });
  }
  function ask(text) {
    text = (text || "").trim();
    if (!text || typing) return;
    chat.push({ who: "me", text });
    typing = true;
    jeff();
    setTimeout(() => {
      typing = false;
      chat.push({ who: "jeff", text: answer(text) });
      if (location.hash.startsWith("#/jeff")) { jeff(); const q = document.getElementById("jq"); if (q) q.focus({ preventScroll: true }); }
    }, 550 + Math.random() * 350);
  }
  function answer(q) {
    const ql = q.toLowerCase();
    const named = UMPIRES.find((u) => ql.includes(u.name.toLowerCase()) || (u.lastName.length > 3 && ql.includes(u.lastName.toLowerCase())));
    if (named && /\b(when|schedule|game|games|umpir|assign|doing|working|on)\b/.test(ql)) {
      const act = games(named);
      const line = act.slice(0, 6).map((s) => { const c = context(s); return `${DAY_SHORT[s.day]} ${tFull(s.time)} — ${ROLE[s.type] || s.label}${c.field ? `, Field ${c.field}` : ""}`; }).join("; ");
      return act.length
        ? `${named.name} (${clubLabel(named)}, ${levels(named).join("/")}) has ${gameCount(named)} games${named.counts.coach ? ` and ${named.counts.coach} coaching slots` : ""}. ${line}${act.length > 6 ? "; …" : ""}. Their full weekend is on their profile under Schedule.`
        : `${named.name} has no on-field assignments on the current draft.`;
    }
    const stop = new Set(["what", "whats", "what's", "when", "where", "how", "the", "a", "an", "is", "are", "do", "does", "i", "my", "me", "to", "of", "in", "on", "for", "and", "or", "if", "it", "at", "can", "about", "with", "who", "why", "get", "goes", "go"]);
    const words = ql.replace(/[^a-z0-9\s'-]/g, "").split(/\s+/).filter((w) => w && !stop.has(w));
    let best = null, bestScore = 0;
    window.KB.forEach((entry) => {
      const keys = entry.k.split(/\s+/);
      let score = 0;
      words.forEach((w) => {
        if (keys.includes(w)) score += 2;
        else if (keys.some((k) => k.length > 3 && w.length > 3 && (k.startsWith(w) || w.startsWith(k)))) score += 1;
      });
      if (score > bestScore) { bestScore = score; best = entry; }
    });
    if (best && bestScore >= 2) return best.a;
    return `That one's not in my notes yet. Email the real Jeff at ${T.directorEmail}, or try asking about assignments, gear, BAF votes, BTS duties, cards, observations, accreditation, finals, or a rule like holding the ball.`;
  }

  // ======================================================================
  // MORE
  // ======================================================================
  function more() {
    const me = getMe();
    const best = store.get("usafl.quiz.best", null);
    const row = (href, ic, t1, t2, ext) => `<a class="row" href="${href}" ${ext ? 'target="_blank" rel="noopener"' : ""}><span class="ico">${icon(ic, "sm")}</span><span class="main"><span class="t1">${esc(t1)}</span>${t2 ? `<span class="t2">${esc(t2)}</span>` : ""}</span><span class="trail">${icon(ext ? "ext" : "chevR", "sm")}</span></a>`;
    const btnRow = (id, ic, t1, t2) => `<button class="row" id="${id}"><span class="ico">${icon(ic, "sm")}</span><span class="main"><span class="t1">${esc(t1)}</span>${t2 ? `<span class="t2">${esc(t2)}</span>` : ""}</span><span class="trail">${icon("chevR", "sm")}</span></button>`;
    render(`
      <div class="head"><div><h1 class="page-title">More</h1></div></div>
      ${me ? `<div class="card me-card">${avatar(me, "lg")}<div style="flex:1;min-width:0"><div class="n">${esc(me.name)}</div><div class="s">${esc(clubLabel(me))} · ${esc(levels(me).join(" / "))}</div></div><button class="btn ghost sm" id="switch">Change</button></div>`
        : `<a class="card me-card pressable" href="#/welcome"><span class="avatar lg">${icon("user")}</span><div style="flex:1"><div class="n">Choose your name</div><div class="s">Personalise your schedule and home screen</div></div>${icon("chevR", "sm")}</a>`}
      <div class="eyebrow group-label">Tournament</div>
      <div class="list">
        ${row("#/guide", "book", "Weekend guide", "Events, venues and the game-day playbook")}
        ${row("#/fields", "pitch", "Field board", "Crews on every field, hour by hour")}
        ${row("#/umpires", "users", "All umpires", `${UMPIRES.length} on the draft`)}
      </div>
      <div class="eyebrow group-label">Learn</div>
      <div class="list">
        ${row("#/quiz", "target", "Rules quiz", best != null ? `Best score ${best}/${window.QUIZ.length}` : `${window.QUIZ.length} questions`)}
        ${btnRow("acc", "award", "Accreditation pathway", "What F0, F1, F2 and the rest mean")}
        ${btnRow("gear", "shirt", "Gear checklist", "What to pack for the weekend")}
      </div>
      <div class="eyebrow group-label">Contact</div>
      <div class="list">
        ${row(`mailto:${T.directorEmail}`, "mail", `Email ${T.director}`, "Tournament Director")}
        ${row("https://aussierulesusa.com", "ext", "USAFL", "aussierulesusa.com", true)}
        ${row("https://usaflua.org.au", "ext", "USAFL Umpires Association", "usaflua.org.au", true)}
      </div>
      <p class="foot-note">Schedule: preliminary draft v011 · subject to change.<br/>Always confirm at the Big Sheets in Umpire Central.</p>
    `);
    const sw = document.getElementById("switch");
    if (sw) sw.addEventListener("click", () => { store.del("usafl.me"); store.del("usafl.skipWelcome"); go("#/welcome"); });
    document.getElementById("acc").addEventListener("click", () => openSheet("Accreditation", window.ACCREDITATION.map((a) =>
      `<div class="acc-row"><span class="code">${esc(a.code)}</span><div><h4>${esc(a.name)}</h4><p>${esc(a.desc)}</p></div></div>`).join("")));
    document.getElementById("gear").addEventListener("click", gearSheet);
  }
  const GEAR = [
    "Orange USAFL UA shirt (email Jeff your size if you need one)",
    "Acme Thunderer whistle (DA/AA field & boundary)",
    "Goal flags — USAFL flags at every post, or mark your personal set",
    "UA insoles (free pair at Friday gear pickup)",
    "Water bottle, sunscreen, hat — it's Florida",
    "Completed W-9 (or your pay gets held)",
  ];
  function gearSheet() {
    const done = store.get("usafl.gear", []);
    openSheet("Gear checklist", GEAR.map((g, i) =>
      `<button class="check-row ${done.includes(i) ? "done" : ""}" data-g="${i}"><span class="box">${icon("check", "xs")}</span><span>${esc(g)}</span></button>`).join(""), (sh) => {
      sh.querySelectorAll("[data-g]").forEach((b) => b.addEventListener("click", () => {
        const i = +b.dataset.g, cur = store.get("usafl.gear", []);
        const next = cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i];
        store.set("usafl.gear", next);
        b.classList.toggle("done", next.includes(i));
      }));
    });
  }

  // ======================================================================
  // WEEKEND GUIDE
  // ======================================================================
  let gday = null;
  function guide() {
    const n = now();
    const days = window.EVENTS.map((d) => d.day);
    if (!gday) {
      const todayIdx = window.EVENTS.findIndex((d) => {
        const t = eventTimes(d.day, d.items[0].time);
        return t && edtDay(t.start).toISOString().slice(0, 10) === edtDay(n).toISOString().slice(0, 10);
      });
      gday = days[todayIdx >= 0 ? todayIdx : 0];
    }
    const d = window.EVENTS.find((x) => x.day === gday);
    render(`
      <button class="back" onclick="location.hash='#/more'">${icon("chevL", "sm")}More</button>
      <div class="head" style="margin-top:0"><div><h1 class="page-title">Weekend guide</h1><div class="sub">${esc(T.city)} · ${esc(T.dates)}</div></div></div>
      <div class="tbd">${icon("info", "sm")}<span>Sarasota venues and times are still being confirmed. Anything marked TBD will update here.</span></div>
      ${seg("gday", days.map((x) => ({ v: x, label: x.slice(0, 3) })), gday)}
      <div id="evs">${eventsHTML(d)}</div>
      <div class="section">
        <div class="section-head"><h2>Game-day playbook</h2></div>
        <div class="list plain">${window.GUIDE_SECTIONS.map((s, i) => `
          <div class="acc" data-acc="${i}">
            <button class="acc-head" aria-expanded="false"><span>${esc(s.title)}</span>${icon("chevR", "sm chev")}</button>
            <div class="acc-body"><div class="acc-inner"><ul>${s.body.map((b) => `<li>${esc(b)}</li>`).join("")}</ul></div></div>
          </div>`).join("")}</div>
      </div>
    `);
    wireSeg("gday", (v) => {
      gday = v;
      const box = document.getElementById("evs");
      box.innerHTML = eventsHTML(window.EVENTS.find((x) => x.day === v));
      wireEvents();
      staggerIn(box);
    });
    wireEvents();
    $app.querySelectorAll("[data-acc]").forEach((a) => a.querySelector(".acc-head").addEventListener("click", () => {
      const open = a.classList.toggle("open");
      a.querySelector(".acc-head").setAttribute("aria-expanded", String(open));
    }));
  }
  function eventsHTML(d) {
    return `<div class="stagger">${d.items.map((e, i) => {
      const tbd = /tbd/i.test(e.where);
      return `<div class="ev">
        <div class="ev-t">${esc(e.time)}</div>
        <h3>${esc(e.title)}</h3>
        <div class="ev-w">${icon("pin", "xs")}${tbd ? `<span>${esc(e.where)}</span>` : `<a href="https://maps.apple.com/?q=${encodeURIComponent(e.where)}" target="_blank" rel="noopener">${esc(e.where)}</a>`}</div>
        <p>${esc(e.note)}</p>
        <div class="ev-a"><button class="btn ghost sm" data-ics="${esc(d.day)}|${i}">${icon("calPlus", "sm")}Add to calendar</button></div>
      </div>`;
    }).join("")}</div>`;
  }
  function wireEvents() {
    $app.querySelectorAll("[data-ics]").forEach((b) => b.addEventListener("click", () => {
      const [day, i] = b.dataset.ics.split("|");
      const d = window.EVENTS.find((x) => x.day === day), e = d.items[+i];
      const t = eventTimes(d.day, e.time);
      if (!t) return;
      const end = t.end || new Date(+t.start + 2 * 3600000);
      const f = (x) => x.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
      const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//USAFL Umpires//Nationals//EN", "BEGIN:VEVENT",
        `UID:${f(t.start)}-${i}@usafl-umpires`, `DTSTAMP:${f(new Date())}`, `DTSTART:${f(t.start)}`, `DTEND:${f(end)}`,
        `SUMMARY:${e.title} — USAFL Nationals`, `LOCATION:${e.where}`, `DESCRIPTION:${e.note.replace(/\n/g, " ")}`,
        "END:VEVENT", "END:VCALENDAR"].join("\r\n");
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
      a.download = e.title.replace(/[^A-Za-z0-9]+/g, "-") + ".ics";
      document.body.appendChild(a); a.click(); a.remove();
    }));
  }

  // ======================================================================
  // QUIZ
  // ======================================================================
  const qz = { stage: "intro", i: 0, picked: null, checked: false, score: 0, results: [] };
  function quiz() {
    const Q = window.QUIZ;
    const best = store.get("usafl.quiz.best", null);
    const back = `<button class="back" onclick="location.hash='#/more'">${icon("chevL", "sm")}More</button>`;
    if (qz.stage === "intro") {
      render(`${back}
        <section class="hero" style="margin-top:6px">${PITCH_ART}<div class="glow"></div>
          <div class="eyebrow">Rules quiz</div>
          <h3>Know your<br/>calls</h3>
          <p>${Q.length} questions on the rules and tournament procedure, each with an explanation.</p>
          <div class="hero-foot"><span class="meta">${best != null ? `Your best: ${best}/${Q.length}` : "Takes about 3 minutes"}</span><button class="hero-cta" id="qs">Start ${icon("chevR", "xs")}</button></div>
        </section>`);
      document.getElementById("qs").addEventListener("click", () => { Object.assign(qz, { stage: "q", i: 0, picked: null, checked: false, score: 0, results: [] }); quiz(); animateIn(); });
      return;
    }
    if (qz.stage === "done") {
      const s = qz.score;
      const msg = s === Q.length ? "Perfect round. See you in the grand final." : s >= Q.length * 0.75 ? "Sharp. Ready for Sarasota." : s >= Q.length * 0.5 ? "Solid base — skim the playbook before October." : "Worth a read of the playbook, then try again.";
      const missed = qz.results.map((r, i) => ({ ...r, q: Q[i] })).filter((r) => !r.ok);
      render(`${back}
        <section class="hero score-hero">${PITCH_ART}<div class="glow"></div>
          <div class="eyebrow" style="justify-content:center">Your score</div>
          <div class="big">${s}<small>/${Q.length}</small></div>
          <p style="margin:12px auto 0">${esc(msg)}</p>
        </section>
        ${missed.length ? `<div class="section"><div class="section-head"><h2>Review</h2></div><div class="list plain review">${missed.map((r) =>
          `<div class="row"><span class="mark">${icon("x", "xs")}</span><span class="main"><span class="t1">${esc(r.q.q)}</span><span class="t2"><b>${esc(r.q.opts[r.q.a])}</b> — ${esc(r.q.why)}</span></span></div>`).join("")}</div></div>` : ""}
        <div class="dock"><button class="btn block" id="qr">Try again</button></div>`);
      document.getElementById("qr").addEventListener("click", () => { Object.assign(qz, { stage: "q", i: 0, picked: null, checked: false, score: 0, results: [] }); quiz(); animateIn(); });
      return;
    }
    const q = Q[qz.i];
    const L = "ABCD";
    render(`
      <div class="q-top">
        <button class="icon-btn" id="qx" aria-label="Quit">${icon("x", "sm")}</button>
        <div class="q-bar">${Q.map((_, i) => `<i class="${i < qz.results.length ? (qz.results[i].ok ? "right" : "wrong") : i === qz.i ? "cur" : ""}"></i>`).join("")}</div>
        <span class="q-n">${qz.i + 1}/${Q.length}</span>
      </div>
      <div class="q-text">${esc(q.q)}</div>
      <div class="opts ${qz.checked ? "" : "stagger"}">${q.opts.map((o, i) => {
        let cls = "";
        if (qz.checked) { if (i === q.a) cls = "right"; else if (i === qz.picked) cls = "wrong"; }
        else if (i === qz.picked) cls = "sel";
        return `<button class="opt ${cls}" data-i="${i}" ${qz.checked ? "disabled" : ""}><span class="ab">${L[i]}</span><span>${esc(o)}</span></button>`;
      }).join("")}</div>
      ${qz.checked ? `<div class="why ${qz.picked === q.a ? "good" : "bad"}"><b>${qz.picked === q.a ? "Correct" : "Not quite"}</b>${esc(q.why)}</div>` : ""}
      <div class="dock"><button class="btn block ${qz.checked ? "dark" : ""}" id="qgo" ${qz.picked == null ? "disabled" : ""}>${qz.checked ? (qz.i + 1 === Q.length ? "See results" : "Continue") : "Check answer"}</button></div>
    `);
    document.getElementById("qx").addEventListener("click", () => { qz.stage = "intro"; quiz(); animateIn(); });
    if (qz.checked) requestAnimationFrame(() => $app.scrollTo({ top: $app.scrollHeight, behavior: "smooth" }));
    if (!qz.checked) {
      $app.querySelectorAll(".opt").forEach((b) => b.addEventListener("click", () => {
        qz.picked = +b.dataset.i;
        $app.querySelectorAll(".opt").forEach((x) => x.classList.toggle("sel", x === b));
        document.getElementById("qgo").disabled = false;
      }));
    }
    document.getElementById("qgo").addEventListener("click", () => {
      if (!qz.checked) {
        const ok = qz.picked === q.a;
        qz.checked = true;
        if (ok) qz.score++;
        qz.results.push({ ok });
        quiz();
        return;
      }
      qz.i++; qz.picked = null; qz.checked = false;
      if (qz.i >= Q.length) {
        qz.stage = "done";
        const prev = store.get("usafl.quiz.best", null);
        if (prev == null || qz.score > prev) store.set("usafl.quiz.best", qz.score);
      }
      quiz(); animateIn();
    });
  }

  // ======================================================================
  // OFFLINE PILL + INSTALL BANNER
  // ======================================================================
  function initOffline() {
    const pill = document.createElement("div");
    pill.className = "offline";
    pill.innerHTML = `${icon("cloudOff", "xs")}Offline · showing saved schedule`;
    $phone.appendChild(pill);
    const upd = () => pill.classList.toggle("on", !navigator.onLine);
    window.addEventListener("online", upd);
    window.addEventListener("offline", upd);
    upd();
  }

  function initA2HS() {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
    if (standalone || store.get("usafl.a2hs.dismissed", false)) return;
    const ua = navigator.userAgent || "";
    const isIOS = /iphone|ipad|ipod/i.test(ua);
    const isAndroid = /android/i.test(ua);
    if (!isIOS && !isAndroid && !("onbeforeinstallprompt" in window)) return;
    let deferred = null;
    const bar = document.createElement("div");
    bar.className = "a2hs";
    const show = (mode) => {
      bar.innerHTML = `<img src="icons/icon-192.png" alt="" />
        <div class="tx"><b>Add to your home screen</b>${mode === "android" ? "Full screen, works offline." : "Tap Share, then “Add to Home Screen.”"}</div>
        ${mode === "android" ? `<button class="btn sm" data-go>Install</button>` : ""}
        <button class="x" data-x aria-label="Dismiss">${icon("x", "sm")}</button>`;
      bar.querySelector("[data-x]").addEventListener("click", () => { store.set("usafl.a2hs.dismissed", true); bar.remove(); });
      const g = bar.querySelector("[data-go]");
      if (g) g.addEventListener("click", async () => {
        if (!deferred) return;
        deferred.prompt();
        const { outcome } = await deferred.userChoice;
        deferred = null;
        if (outcome === "accepted") bar.remove();
      });
      if (!bar.isConnected) $phone.appendChild(bar);
    };
    window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferred = e; show("android"); });
    if (isIOS) show("ios");
    window.addEventListener("appinstalled", () => { store.set("usafl.a2hs.dismissed", true); bar.remove(); });
  }

  buildTabs();
  route();
  initOffline();
  initA2HS();
})();
