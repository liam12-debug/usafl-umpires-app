/* USAFL Umpires — Nationals 2026. Hash-routed single page app, no dependencies. */
(function () {
  const $app = document.getElementById("app");
  const $tabbar = document.getElementById("tabbar");
  const UMPIRES = window.UMPIRES || [];
  const byId = Object.fromEntries(UMPIRES.map((u) => [u.id, u]));
  const byLastName = {};
  UMPIRES.forEach((u) => { (byLastName[u.lastName.toLowerCase()] = byLastName[u.lastName.toLowerCase()] || []).push(u); });

  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
    set(k, v) { localStorage.setItem(k, JSON.stringify(v)); },
  };

  const DAY_LABEL = { sat: "Saturday, Oct 17", sun: "Sunday, Oct 18", finals: "Sunday Finals" };
  const TYPE_LABEL = { field: "Field", goal: "Goal", boundary: "Boundary", ts: "Timer/Score", coach: "Coach", duty: "Duty", playing: "Playing", watch: "Watch", off: "Off", personal: "Personal", maybe: "Maybe", other: "Note" };
  const ACTIVE_TYPES = ["field", "goal", "boundary", "ts", "coach", "duty"];

  // ---------- routing ----------
  function route() {
    const h = location.hash.replace(/^#\/?/, "");
    const [page, arg] = h.split("/");
    $app.scrollTo(0, 0); // #app is the scroll container now, not the window
    const views = { "": home, home, umpires, umpire, board, wall, jeff, resources, guide, quiz };
    (views[page] || home)(arg);
    renderTabs(page || "home");
  }
  const go = (h) => { location.hash = h; };
  window.addEventListener("hashchange", route);

  function renderTabs(page) {
    const tabs = [
      ["home", "🏠", "Home"],
      ["umpires", "📅", "Schedule"],
      ["jeff", "🧢", "Ask Jeff"],
      ["wall", "📣", "Good Call!"],
      ["resources", "📚", "Resources"],
    ];
    const active = { umpire: "umpires", board: "umpires", guide: "resources", quiz: "resources" }[page] || page;
    $tabbar.innerHTML = tabs.map(([id, icon, label]) =>
      `<button class="tab ${active === id ? "on" : ""}" onclick="location.hash='#/${id}'"><span class="t-i">${icon}</span>${label}</button>`).join("");
  }

  function topbar(title, sub, backTo) {
    return `<div class="topbar">
      ${backTo != null ? `<button class="back" onclick="${backTo === "" ? "history.back()" : `location.hash='#/${backTo}'`}">←</button>` : ""}
      <div><div class="title">${esc(title)}</div>${sub ? `<div class="sub">${esc(sub)}</div>` : ""}</div>
    </div>`;
  }

  // ---------- home ----------
  function home() {
    const t = window.TOURNAMENT;
    const days = Math.max(0, Math.ceil((new Date(t.firstDay) - Date.now()) / 86400000));
    const me = store.get("usafl.me", null);
    const meUmp = me && byId[me];
    $app.innerHTML = `
      <div class="topbar" style="justify-content:space-between">
        <span class="brandmark"><span class="dot">🏉</span> USAFL Umpires</span>
        <span class="chip club">Nationals ${t.year}</span>
      </div>
      <div class="hero">
        <div class="kicker">${esc(t.city)} · ${esc(t.dates)}</div>
        <h1>G'day${meUmp ? ", " + esc(meUmp.firstName) : ", Ump"}.</h1>
        <div class="meta">Everything you need for the weekend, in one pocket.</div>
        <div class="countdown">⏳ ${days} days to first bounce</div>
      </div>
      <div class="glass searchbox" onclick="location.hash='#/umpires'">
        <span class="icon">🔍</span>
        <input placeholder="Search your name for your schedule…" readonly />
      </div>
      <div class="bento">
        <div class="tile feature wide" onclick="location.hash='${meUmp ? "#/umpire/" + meUmp.id : "#/umpires"}'">
          <span class="arrow">→</span>
          <div class="t-icon">📅</div>
          <h3>${meUmp ? "My schedule" : "Find your schedule"}</h3>
          <p>${meUmp ? esc(summarizeCounts(meUmp)) + " this weekend" : "Search " + UMPIRES.length + " umpires · filter by discipline, day & level"}</p>
        </div>
        <div class="tile glass" onclick="location.hash='#/jeff'">
          <span class="arrow">→</span>
          <div class="t-icon ic-orange">🧢</div>
          <h3>Ask Jeff</h3><p>Tournament & rules questions, answered instantly</p>
        </div>
        <div class="tile glass" onclick="location.hash='#/wall'">
          <span class="arrow">→</span>
          <div class="t-icon ic-green">📣</div>
          <h3>Good Call!</h3><p>Shout out an umpire who nailed it</p>
        </div>
        <div class="tile glass" onclick="location.hash='#/board'">
          <span class="arrow">→</span>
          <div class="t-icon ic-blue">🗺️</div>
          <h3>Field board</h3><p>Who's on which field, hour by hour</p>
        </div>
        <div class="tile glass" onclick="location.hash='#/quiz'">
          <span class="arrow">→</span>
          <div class="t-icon ic-purple">🧠</div>
          <h3>Rules quiz</h3><p>12 questions — test yourself before Sarasota</p>
        </div>
        <div class="tile glass wide" onclick="location.hash='#/guide'">
          <span class="arrow">→</span>
          <div class="t-icon ic-teal">🗓️</div>
          <h3>Weekend guide</h3><p>Welcome dinner · clinic · meeting & AGM · game days · fete · finals</p>
        </div>
      </div>
      <div class="homefoot">Schedule shown is the preliminary draft — always confirm at the Big Sheets.<br/>
      Questions? <a href="mailto:${esc(t.directorEmail)}">Email Jeff</a></div>`;
  }

  function summarizeCounts(u) {
    const c = u.counts, parts = [];
    if (c.field) parts.push(c.field + " field");
    if (c.goal) parts.push(c.goal + " goal");
    if (c.boundary) parts.push(c.boundary + " boundary");
    if (c.coach) parts.push(c.coach + " coaching");
    return parts.join(" · ") || "No games assigned";
  }

  // ---------- umpire list ----------
  const filt = { q: "", disc: null, oz: false, level: null, commit: null };
  function umpires() {
    $app.innerHTML = `
      ${topbar("Schedule", "Preliminary draft · v011 · subject to change")}
      <div class="glass searchbox"><span class="icon">🔍</span>
        <input id="q" placeholder="Search name or club…" value="${esc(filt.q)}" autocomplete="off" />
      </div>
      <div class="filterbar">
        ${["field", "goal", "boundary"].map((d) => `<button class="fbtn ${filt.disc === d ? "on" : ""}" data-f="disc" data-v="${d}">${TYPE_LABEL[d]}</button>`).join("")}
        <button class="fbtn ${filt.oz ? "on oz" : ""}" data-f="oz">🇦🇺 Aussies</button>
        ${["F2", "F1", "F0", "G2", "G1"].map((l) => `<button class="fbtn ${filt.level === l ? "on" : ""}" data-f="level" data-v="${l}">${l}</button>`).join("")}
        ${["FT", "PT", "OC"].map((c) => `<button class="fbtn ${filt.commit === c ? "on" : ""}" data-f="commit" data-v="${c}">${c}</button>`).join("")}
      </div>
      <div class="resultmeta" id="meta"></div>
      <div id="list"></div>`;
    const $q = document.getElementById("q");
    $q.addEventListener("input", () => { filt.q = $q.value; renderList(); });
    $app.querySelectorAll(".fbtn").forEach((b) => b.addEventListener("click", () => {
      const f = b.dataset.f, v = b.dataset.v;
      if (f === "oz") filt.oz = !filt.oz; else filt[f] = filt[f] === v ? null : v;
      umpires();
    }));
    renderList();
    if (filt.q) { $q.focus(); $q.setSelectionRange($q.value.length, $q.value.length); }
  }

  function renderList() {
    const q = filt.q.trim().toLowerCase();
    let list = UMPIRES.filter((u) => {
      if (q && !(u.name.toLowerCase().includes(q) || (u.club || "").toLowerCase().includes(q))) return false;
      if (filt.disc && !u.disciplines.includes(filt.disc)) return false;
      if (filt.oz && !u.isAussie) return false;
      if (filt.level && !Object.values(u.accreditation).includes(filt.level)) return false;
      if (filt.commit && !(u.commitment || "").startsWith(filt.commit)) return false;
      return true;
    });
    const totalGames = (u) => u.counts.field + u.counts.goal + u.counts.boundary + u.counts.ts;
    document.getElementById("meta").textContent = `${list.length} umpire${list.length === 1 ? "" : "s"}`;
    document.getElementById("list").innerHTML = list.map((u) => {
      const initials = (u.firstName[0] || "") + (u.lastName[0] || "");
      const accr = Object.values(u.accreditation).join(" · ");
      const tries = Object.values(u.try).filter((t) => t && t !== "Ex").join(" · ");
      return `<div class="glass ump-row" onclick="location.hash='#/umpire/${u.id}'">
        <div class="avatar ${u.isAussie ? "oz" : ""}">${esc(initials)}</div>
        <div class="who">
          <div class="nm">${esc(u.name)}</div>
          <div class="tags">
            ${u.club ? `<span class="chip ${u.isAussie ? "oz" : "club"}">${u.isAussie ? "🇦🇺 OZ" : esc(u.club)}</span>` : ""}
            ${accr ? `<span class="chip accr">${esc(accr)}</span>` : ""}
            ${tries ? `<span class="chip try">→ ${esc(tries)}</span>` : ""}
            ${u.commitment && u.commitment !== "N/A" ? `<span class="chip commit">${esc(u.commitment)}</span>` : ""}
          </div>
        </div>
        <div class="cnt"><b>${totalGames(u)}</b><br/>games${u.counts.coach ? `<br/>+${u.counts.coach} coach` : ""}</div>
      </div>`;
    }).join("") || `<div class="empty"><span class="e-emoji">🤷</span>No umpires match — try clearing a filter.</div>`;
  }

  // ---------- umpire detail ----------
  function umpire(id) {
    const u = byId[id];
    if (!u) return go("umpires");
    const me = store.get("usafl.me", null);
    const isMe = me === u.id;
    const initials = (u.firstName[0] || "") + (u.lastName[0] || "");
    const accrChips = Object.entries(u.accreditation).map(([d, l]) => `<span class="chip accr">${TYPE_LABEL[d]}: ${esc(l)}</span>`).join("");
    const tryChips = Object.entries(u.try).filter(([, t]) => t && t !== "Ex").map(([d, t]) => `<span class="chip try">Going for ${esc(t)}</span>`).join("");

    const days = ["sat", "sun", "finals"];
    const timeline = days.map((day) => {
      const slots = u.slots.filter((s) => s.day === day);
      if (!slots.length) return "";
      if (day === "finals") {
        const real = slots.filter((s) => s.type !== "off");
        return `<div class="dayhdr"><h2>Finals</h2><span>from 1 pm</span></div>` + (real.length
          ? real.map(slotRow).join("")
          : `<div class="finalnote">🏆 Finals crews are assigned Saturday night based on the day's results — announced at the Umpire Fete or posted at Umpire Central Sunday morning.</div>`);
      }
      return `<div class="dayhdr"><h2>${DAY_LABEL[day].split(",")[0]}</h2><span>${DAY_LABEL[day].split(", ")[1]}</span></div>` + slots.map(slotRow).join("");
    }).join("");

    $app.innerHTML = `
      ${topbar(u.name, null, "umpires")}
      <div class="glass profile">
        <div class="avatar ${u.isAussie ? "oz" : ""}">${esc(initials)}</div>
        <h2>${esc(u.name)}</h2>
        <div class="tags">
          ${u.club ? `<span class="chip ${u.isAussie ? "oz" : "club"}">${u.isAussie ? "🇦🇺 Australia" : esc(u.club)}</span>` : ""}
          ${accrChips}${tryChips}
          ${u.commitment && u.commitment !== "N/A" ? `<span class="chip commit">${esc(u.commitment)}</span>` : ""}
        </div>
        <div class="statrow">
          <div class="stat"><b>${u.counts.field}</b><span>Field</span></div>
          <div class="stat"><b>${u.counts.goal}</b><span>Goal</span></div>
          <div class="stat"><b>${u.counts.boundary}</b><span>Bound</span></div>
          <div class="stat"><b>${u.counts.coach}</b><span>Coach</span></div>
        </div>
        <button class="mebtn ${isMe ? "set" : ""}" id="mebtn">${isMe ? "✓ This is you — shown on your home screen" : "This is me"}</button>
      </div>
      ${timeline || `<div class="empty"><span class="e-emoji">🌴</span>No assignments on the sheet — enjoy the weekend!</div>`}`;
    document.getElementById("mebtn").addEventListener("click", () => {
      store.set("usafl.me", isMe ? null : u.id);
      umpire(id);
    });
  }

  function slotRow(s) {
    const muted = !ACTIVE_TYPES.includes(s.type);
    let label = esc(s.label), sub = "";
    if (s.type === "coach") {
      if (s.label === "Coaching") { label = "Coaching"; }
      else {
        const m = findByCoachRef(s.label);
        label = m ? `Coaching ${esc(m.name)}` : `Coaching ${esc(s.label)}`;
        if (m) sub = `<a href="#/umpire/${m.id}" onclick="event.stopPropagation()" style="color:var(--purple);font-weight:650;text-decoration:none">View ${esc(m.firstName)}'s schedule →</a>`;
      }
    }
    if (s.type === "maybe") label = `Possible: ${esc(s.label)}`;
    return `<div class="glass slot ${muted ? "muted" : ""} ${s.tentative ? "tentative" : ""}">
      <div class="time">${esc(s.time)}</div>
      <div class="what"><div class="lbl">${label}</div>${sub ? `<div class="sub">${sub}</div>` : ""}</div>
      <span class="pill ${s.type}">${TYPE_LABEL[s.type] || s.type}</span>
    </div>`;
  }

  function findByCoachRef(ref) {
    // refs look like "Barrett", "ANelson", "O'Dell", "Hnelson"
    const r = ref.toLowerCase().replace(/\s/g, "");
    let m = UMPIRES.find((u) => u.lastName.toLowerCase().replace(/\s/g, "") === r);
    if (m) return m;
    return UMPIRES.find((u) => (u.firstName[0] + u.lastName).toLowerCase().replace(/\s/g, "") === r) || null;
  }

  // ---------- field board ----------
  const board_state = { day: "sat", time: "10am" };
  function board() {
    const times = [...new Set(window.SLOT_ORDER.filter((s) => s.day === board_state.day).map((s) => s.time))];
    if (!times.includes(board_state.time)) board_state.time = times[0];
    const crews = {};
    UMPIRES.forEach((u) => u.slots.forEach((s) => {
      if (s.day !== board_state.day || s.time !== board_state.time || !s.field) return;
      (crews[s.field] = crews[s.field] || { field: [], goal: [], boundary: [], ts: [] })[s.type]?.push({ u, tentative: s.tentative });
    }));
    const fields = Object.keys(crews).sort();
    $app.innerHTML = `
      ${topbar("Field board", "Who's where, hour by hour", "umpires")}
      <div class="seg">
        <button class="${board_state.day === "sat" ? "on" : ""}" data-d="sat">Saturday</button>
        <button class="${board_state.day === "sun" ? "on" : ""}" data-d="sun">Sunday</button>
        <button class="${board_state.day === "finals" ? "on" : ""}" data-d="finals">Finals</button>
      </div>
      <div class="timescroll">${times.map((t) => `<button class="fbtn ${board_state.time === t ? "on" : ""}" data-t="${t}">${t}</button>`).join("")}</div>
      ${fields.length ? fields.map((f) => {
        const c = crews[f];
        const line = (role, arr) => arr.length ? `<div class="crewline"><span class="role">${role}</span><span>${arr.map(({ u, tentative }) =>
          `<a href="#/umpire/${u.id}">${esc(u.name)}${tentative ? " ?" : ""}${u.isAussie ? '<span class="oz-dot"></span>' : ""}</a>`).join(", &nbsp;")}</span></div>` : "";
        return `<div class="glass fieldcard">
          <div class="fh"><span class="fnum">${f}</span><h3>Field ${f}</h3></div>
          ${line("Field", c.field)}${line("Goal", c.goal)}${line("Boundary", c.boundary)}${line("Timer/Sc", c.ts)}
        </div>`;
      }).join("") : `<div class="glass emptyboard">${board_state.day === "finals" ? "🏆 Finals crews are assigned Saturday night — check back after the Fete." : "No field assignments this hour."}</div>`}`;
    $app.querySelectorAll("[data-d]").forEach((b) => b.addEventListener("click", () => { board_state.day = b.dataset.d; board(); }));
    $app.querySelectorAll("[data-t]").forEach((b) => b.addEventListener("click", () => { board_state.time = b.dataset.t; board(); }));
  }

  // ---------- Good Call! wall ----------
  function wall() {
    const posts = store.get("usafl.shoutouts", null) || window.SEED_SHOUTOUTS.slice();
    const claps = store.get("usafl.claps", {});
    const tags = ["🔥", "🏉", "🚩", "👏", "💪", "👑"];
    const selTag = store.get("usafl.tag", "🔥");
    const ago = (ts) => {
      const m = Math.round((Date.now() - ts) / 60000);
      if (m < 60) return m + "m ago";
      if (m < 1440) return Math.round(m / 60) + "h ago";
      return Math.round(m / 1440) + "d ago";
    };
    $app.innerHTML = `
      ${topbar("Good Call! 📣", "Shout out an ump who nailed it — visible to everyone")}
      <div class="glass composer">
        <input id="w-from" placeholder="From (your name, or leave blank for Anon)" maxlength="40" />
        <input id="w-to" placeholder="To (umpire or crew)" maxlength="60" />
        <textarea id="w-msg" rows="2" placeholder="What was the good call?" maxlength="240"></textarea>
        <div class="tagpick">${tags.map((t) => `<button class="${t === selTag ? "on" : ""}" data-tag="${t}">${t}</button>`).join("")}</div>
        <button class="postbtn" id="w-post">Post it 📣</button>
      </div>
      <div id="wallfeed">${posts.map((p, i) => shoutHTML(p, i, claps, ago)).join("")}</div>`;
    $app.querySelectorAll("[data-tag]").forEach((b) => b.addEventListener("click", () => { store.set("usafl.tag", b.dataset.tag); wall(); }));
    document.getElementById("w-post").addEventListener("click", () => {
      const to = document.getElementById("w-to").value.trim();
      const msg = document.getElementById("w-msg").value.trim();
      if (!to || !msg) { alert("Add who it's for and what the good call was!"); return; }
      const from = document.getElementById("w-from").value.trim() || "Anon";
      posts.unshift({ from, to, msg, tag: store.get("usafl.tag", "🔥"), ts: Date.now() });
      store.set("usafl.shoutouts", posts);
      wall();
    });
    $app.querySelectorAll("[data-clap]").forEach((b) => b.addEventListener("click", () => {
      const i = b.dataset.clap;
      claps[i] = (claps[i] || 0) + 1;
      store.set("usafl.claps", claps);
      b.textContent = `👏 ${claps[i]}`;
      b.classList.add("done");
    }));
  }

  function shoutHTML(p, i, claps, ago) {
    return `<div class="glass shout">
      <div class="sh">
        <span class="tag">${esc(p.tag)}</span>
        <div><div class="to">${esc(p.to)}</div><div class="fromts">from ${esc(p.from)} · ${ago(p.ts)}</div></div>
      </div>
      <div class="msg">${esc(p.msg)}</div>
      <button class="clap ${claps[i] ? "done" : ""}" data-clap="${i}">👏 ${claps[i] || "Clap"}</button>
    </div>`;
  }

  // ---------- Ask Jeff ----------
  let jeffLog = null;
  function jeff() {
    if (!jeffLog) jeffLog = [{ who: "jeff", text: "G'day! I'm Ask Jeff 🧢 — your pocket tournament director. Ask me anything about the Nationals weekend, game-day procedures, or rules and interpretations. What can I help with?" }];
    $app.innerHTML = `
      ${topbar("Ask Jeff", "Tournament & rules knowledge base")}
      <div class="jeffwrap">
        <div class="jefflog" id="jlog">${jeffLog.map((m) =>
          `<div class="msg ${m.who}">${m.who === "jeff" ? '<div class="jname">Ask Jeff</div>' : ""}${esc(m.text)}</div>`).join("")}</div>
        <div class="sugg">${window.JEFF_SUGGESTIONS.map((s) => `<button data-s="${esc(s)}">${esc(s)}</button>`).join("")}</div>
        <div class="glass jeffinput">
          <input id="jq" placeholder="Ask about rules, schedule, gear…" autocomplete="off" />
          <button id="jsend">↑</button>
        </div>
      </div>`;
    const $log = document.getElementById("jlog");
    $log.scrollTop = $log.scrollHeight;
    const send = (text) => {
      text = text.trim();
      if (!text) return;
      jeffLog.push({ who: "me", text });
      jeffLog.push({ who: "jeff", text: answer(text) });
      jeff();
    };
    document.getElementById("jsend").addEventListener("click", () => send(document.getElementById("jq").value));
    document.getElementById("jq").addEventListener("keydown", (e) => { if (e.key === "Enter") send(e.target.value); });
    $app.querySelectorAll("[data-s]").forEach((b) => b.addEventListener("click", () => send(b.dataset.s)));
  }

  function answer(q) {
    const ql = q.toLowerCase();
    // name lookup: "when is steve arnott umpiring"
    const named = UMPIRES.find((u) => ql.includes(u.name.toLowerCase()) || (u.lastName.length > 3 && ql.includes(u.lastName.toLowerCase())));
    if (named && /\b(when|schedule|game|umpir|assign|doing|working)\b/.test(ql)) {
      const active = named.slots.filter((s) => ACTIVE_TYPES.includes(s.type));
      const line = active.slice(0, 6).map((s) => `${DAY_LABEL[s.day].split(",")[0]} ${s.time}: ${TYPE_LABEL[s.type]} — ${s.label}`).join("; ");
      return active.length
        ? `${named.name} (${named.isAussie ? "🇦🇺" : named.club}, ${Object.values(named.accreditation).join("/")}) has ${summarizeCounts(named)}. First up — ${line}${active.length > 6 ? "; …" : ""}. Full timeline is in the Schedule tab.`
        : `${named.name} has no on-field assignments on the current draft — check the Schedule tab for their full weekend.`;
    }
    const stop = new Set(["what", "when", "where", "how", "the", "a", "an", "is", "are", "do", "does", "i", "my", "me", "to", "of", "in", "on", "for", "and", "or", "if", "it", "at", "can", "about", "with", "who", "why"]);
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
    return `Good question — that one's not in my knowledge base yet. For anything tournament-specific, email the real Jeff at ${window.TOURNAMENT.directorEmail}, or try asking about: assignments, gear pickup, BAF votes, BTS duties, cards, observations, accreditation, finals, or a rule like holding the ball.`;
  }

  // ---------- guide ----------
  function guide() {
    const t = window.TOURNAMENT;
    $app.innerHTML = `
      ${topbar("Weekend guide", `${t.city} · ${t.dates}`, "resources")}
      <div class="tbdbanner">📍 Sarasota venues and times are still being finalized — items marked TBD will update as details land. Structure follows the standard Nationals format.</div>
      ${window.EVENTS.map((d) => `<div class="eventday"><h2>${esc(d.day)}</h2>${d.items.map((e) => `
        <div class="glass event">
          <span class="e-icon">${e.icon}</span>
          <div class="eb">
            <div class="et">${esc(e.time)}</div>
            <h3>${esc(e.title)}</h3>
            <div class="ew">${esc(e.where)}</div>
            <p>${esc(e.note)}</p>
          </div>
        </div>`).join("")}</div>`).join("")}
      <div class="section-label">Game-day playbook</div>
      ${window.GUIDE_SECTIONS.map((s) => `
        <details class="glass acc">
          <summary><span class="a-icon">${s.icon}</span>${esc(s.title)}<span class="caret">›</span></summary>
          <ul class="a-body">${s.body.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>
        </details>`).join("")}`;
  }

  // ---------- resources ----------
  function resources() {
    const t = window.TOURNAMENT;
    $app.innerHTML = `
      ${topbar("Resources", "Guides, rules, and the good stuff")}
      <div class="rescard glass" onclick="location.hash='#/guide'">
        <span class="r-icon ic-teal">🗓️</span>
        <div class="rb"><h3>Weekend guide</h3><p>Events, game-day playbook, and procedures</p></div><span class="arrow">→</span>
      </div>
      <div class="rescard glass" onclick="location.hash='#/quiz'">
        <span class="r-icon ic-purple">🧠</span>
        <div class="rb"><h3>Rules quiz</h3><p>12 questions on rules & tournament procedure</p></div><span class="arrow">→</span>
      </div>
      <div class="rescard glass" onclick="location.hash='#/board'">
        <span class="r-icon ic-blue">🗺️</span>
        <div class="rb"><h3>Field board</h3><p>Crew lists by field, hour by hour</p></div><span class="arrow">→</span>
      </div>
      <div class="section-label">Accreditation pathway</div>
      <div class="glass acctable">
        ${window.ACCREDITATION.map((a) => `<div class="accrow"><span class="code">${esc(a.code)}</span><div class="nb"><h4>${esc(a.name)}</h4><p>${esc(a.desc)}</p></div></div>`).join("")}
      </div>
      <div class="section-label">Links & contacts</div>
      <a class="rescard glass" href="mailto:${esc(t.directorEmail)}">
        <span class="r-icon ic-orange">✉️</span>
        <div class="rb"><h3>Email Jeff (the real one)</h3><p>${esc(t.directorEmail)}</p></div><span class="arrow">→</span>
      </a>
      <a class="rescard glass" href="https://aussierulesusa.com" target="_blank" rel="noopener">
        <span class="r-icon ic-orange">🏉</span>
        <div class="rb"><h3>USAFL</h3><p>aussierulesusa.com — league site, clubs & Nationals info</p></div><span class="arrow">→</span>
      </a>
      <a class="rescard glass" href="https://usaflua.org.au" target="_blank" rel="noopener">
        <span class="r-icon ic-green">🇦🇺</span>
        <div class="rb"><h3>USAFL Umpires Association</h3><p>usaflua.org.au — accreditation & umpiring resources</p></div><span class="arrow">→</span>
      </a>
      <div class="section-label">Gear checklist</div>
      <div class="glass acctable">
        ${["Orange USAFL UA shirt (email Jeff your size if you need one)", "Acme Thunderer whistle (DA/AA field & boundary)", "Goal flags — USAFL flags at every post, or mark your personal set", "UA insoles (free pair at Friday gear pickup)", "Water bottle, sunscreen, hat — it's Florida", "Completed W-9 (or your pay gets held!)"].map((g) => `<div class="accrow"><span class="code">☐</span><div class="nb"><p style="color:var(--ink)">${esc(g)}</p></div></div>`).join("")}
      </div>`;
  }

  // ---------- quiz ----------
  const quiz_state = { i: 0, score: 0, picked: null, done: false };
  function quiz() {
    const Q = window.QUIZ;
    if (quiz_state.done) {
      const s = quiz_state.score, n = Q.length;
      const grade = s === n ? "Perfect — see you in the grand final! 🏆" : s >= n * 0.75 ? "Sharp. Ready for Sarasota. 🔥" : s >= n * 0.5 ? "Solid base — skim the Weekend Guide before October." : "Time for a chat with Ask Jeff 🧢";
      $app.innerHTML = `${topbar("Rules quiz", null, "resources")}
        <div class="glass scorecard">
          <div class="big">${s}/${n}</div>
          <p>${esc(grade)}</p>
          <button class="postbtn" id="again">Take it again</button>
        </div>`;
      document.getElementById("again").addEventListener("click", () => { Object.assign(quiz_state, { i: 0, score: 0, picked: null, done: false }); quiz(); });
      return;
    }
    const q = Q[quiz_state.i];
    const picked = quiz_state.picked;
    $app.innerHTML = `${topbar("Rules quiz", `Score: ${quiz_state.score}`, "resources")}
      <div class="quizprog"><div style="width:${(quiz_state.i / Q.length) * 100}%"></div></div>
      <div class="glass quizq">
        <div class="qn">Question ${quiz_state.i + 1} of ${Q.length}</div>
        <h2>${esc(q.q)}</h2>
      </div>
      ${q.opts.map((o, i) => {
        let cls = "";
        if (picked != null) { if (i === q.a) cls = "correct"; else if (i === picked) cls = "wrong"; }
        return `<button class="opt ${cls}" data-i="${i}" ${picked != null ? "disabled" : ""}>${esc(o)}</button>`;
      }).join("")}
      ${picked != null ? `<div class="why">${picked === q.a ? "✅ " : "❌ "}${esc(q.why)}</div>
      <button class="nextbtn" id="next">${quiz_state.i + 1 === Q.length ? "See my score" : "Next question →"}</button>` : ""}`;
    if (picked == null) {
      $app.querySelectorAll(".opt").forEach((b) => b.addEventListener("click", () => {
        quiz_state.picked = +b.dataset.i;
        if (quiz_state.picked === q.a) quiz_state.score++;
        quiz();
      }));
    } else {
      document.getElementById("next").addEventListener("click", () => {
        quiz_state.i++;
        quiz_state.picked = null;
        if (quiz_state.i >= Q.length) quiz_state.done = true;
        quiz();
      });
    }
  }

  // ---------- Add to Home Screen banner ----------
  function initA2HS() {
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
    if (isStandalone) return; // already installed — nothing to prompt
    if (store.get("usafl.a2hs.dismissed", false)) return;

    const ua = navigator.userAgent || "";
    const isIOS = /iphone|ipad|ipod/i.test(ua);
    const isAndroid = /android/i.test(ua);
    // On desktop with no install support and not iOS, don't nag.
    if (!isIOS && !isAndroid && !("onbeforeinstallprompt" in window)) return;

    let deferredPrompt = null;
    const bar = document.createElement("div");
    bar.className = "a2hs glass";
    const render = (mode) => {
      bar.innerHTML = `
        <img class="a2hs-icon" src="icons/icon-192.png" alt="" />
        <div class="a2hs-txt">
          <b>Get the app</b>
          <span>${mode === "android"
            ? "Install USAFL Umps for a fullscreen, offline-ready home-screen app."
            : "Tap the Share button, then <b>“Add to Home Screen.”</b>"}</span>
        </div>
        ${mode === "android" ? `<button class="a2hs-go">Install</button>` : `<span class="a2hs-share">⬆︎</span>`}
        <button class="a2hs-x" aria-label="Dismiss">✕</button>`;
      bar.querySelector(".a2hs-x").addEventListener("click", () => {
        store.set("usafl.a2hs.dismissed", true);
        bar.remove();
      });
      const go = bar.querySelector(".a2hs-go");
      if (go) go.addEventListener("click", async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        deferredPrompt = null;
        if (outcome === "accepted") bar.remove();
      });
      document.getElementById("phone").appendChild(bar);
    };

    if (isAndroid || "onbeforeinstallprompt" in window) {
      window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault();
        deferredPrompt = e;
        if (!bar.isConnected) render("android");
      });
      // iOS-style fallback if the event never fires but we're clearly on mobile
      if (isIOS) render("ios");
    } else if (isIOS) {
      render("ios");
    }

    window.addEventListener("appinstalled", () => { store.set("usafl.a2hs.dismissed", true); bar.remove(); });
  }

  route();
  initA2HS();
})();
