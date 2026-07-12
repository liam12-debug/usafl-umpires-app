// Tournament content: events, procedures, knowledge base, quiz, seed shoutouts.
// 2026 Sarasota details marked TBD — edit here as info is confirmed.

window.TOURNAMENT = {
  year: 2026,
  city: "Sarasota, FL",
  dates: "October 16–18, 2026",
  firstDay: "2026-10-17T08:00:00-04:00", // first game day (Saturday)
  venue: "Venue TBD — Sarasota, FL",
  hq: "Tournament hotel TBD",
  director: "Jeff Persson",
  directorEmail: "usaflua.tournamentdirector@gmail.com",
};

window.EVENTS = [
  {
    day: "Thursday, Oct 15",
    items: [
      { time: "7:00 pm", title: "Welcome Dinner", where: "Location TBD — Sarasota", note: "Official welcome for our visiting Aussies. Anyone in town is welcome — let Jeff know if you'd like to join.", icon: "🍽️" },
    ],
  },
  {
    day: "Friday, Oct 16",
    items: [
      { time: "2–5 pm", title: "Umpire Clinic", where: "Tournament grounds TBD", note: "On-field drills in teams of 4–5 led by senior umpires — field, goal, and boundary accreditation stations. Agenda and teams sent about two weeks out.", icon: "🏃" },
      { time: "7–9 pm", title: "Umpire Meeting & AGM", where: "Tournament hotel TBD", note: "Gather 7:00, start 7:30. Use the first 30 min to socialize and collect your gear (shirts, whistles, flags, insoles). AGM at 8:00, then the meeting resumes. Umpire coaches stay after for observation prep.", icon: "📋" },
    ],
  },
  {
    day: "Saturday, Oct 17",
    items: [
      { time: "7:45 am", title: "Umpire Team Picture", where: "In front of Umpire Central", note: "Working at 8am? Be on site by 7:15. Everyone else on site by 7:30 to be in the picture.", icon: "📸" },
      { time: "8 am – 6 pm", title: "Game Day 1", where: "Tournament grounds TBD", note: "Games on the hour — make every effort to start on time. Coaches meet at Umpire Central at 6 pm to review observations.", icon: "🏉" },
      { time: "8–10 pm", title: "Umpire Fete", where: "Tournament hotel TBD", note: "Pizza, salad, and drinks. Accreditation announcements and (hopefully) finals assignments. Be ready to work at 8 am Sunday.", icon: "🎉" },
    ],
  },
  {
    day: "Sunday, Oct 18",
    items: [
      { time: "8 am – 12 pm", title: "Game Day 2", where: "Tournament grounds TBD", note: "Same rules as Saturday. Record any assignment changes on the big sheets at the tent.", icon: "🏉" },
      { time: "1 pm onwards", title: "Finals", where: "Tournament grounds TBD", note: "Finals teams gather at Umpire Central for a team picture and go out as a group. Medals as you come off the field; field umpire medals at the closing ceremony.", icon: "🏆" },
      { time: "8 pm", title: "Thank You Dinner", where: "Location TBD — Sarasota", note: "For everyone still in town. Aussie guests and Tent Queens are our VIPs. Let Jeff know if you plan to attend.", icon: "🥂" },
    ],
  },
];

window.GUIDE_SECTIONS = [
  {
    title: "Game day basics",
    icon: "⏰",
    body: [
      "Working at 8 am: on site by 7:15 am and get your team together.",
      "Working later: on site by 7:30 am for the team picture (7:45 am at Umpire Central), otherwise by 8:15 am.",
      "Games run on the hour — make every effort to start on time.",
      "Go out as a team (field and goals) whenever possible.",
      "Any change to your assignment must be recorded on the big sheets taped to the tables in the tent — that's how payment is calculated.",
    ],
  },
  {
    title: "Field umpires",
    icon: "🟠",
    body: [
      "Back-to-back field assignments only go to those who requested it.",
      "Bring the correct game footy (men's / women's) with you.",
      "At half-time, grab the footy. At the final siren, grab the footy and return it to Umpire Central.",
    ],
  },
  {
    title: "Goal umpires",
    icon: "🚩",
    body: [
      "Back-to-back games are kept on the same field where possible — take goal cards with you and send the first game's cards back with the field umpires.",
      "Each field has three new USAFL game flags in holders at each goal post — leave them for the next game.",
      "Personal flags: mark them as yours and carry them to and from each field.",
      "BAF votes (3-2-1, team and number) go on the goal cards. Discuss at half time, finish quickly after the game. Both cards go to the table at Umpire Central.",
    ],
  },
  {
    title: "Boundary umpires",
    icon: "📏",
    body: [
      "Boundary umpires work Field 1, replacing team boundary volunteers.",
      "Accreditation requires at least two games plus an observation.",
      "Work two games and you can be assigned to a Division 1 grand final.",
      "Sunday finals boundary sign-up sheet is at Umpire Central — finals pay too.",
    ],
  },
  {
    title: "BTS duties (Boundary / Timer / Scorekeeper)",
    icon: "⏱️",
    body: [
      "Clubs must check in 15 minutes before their game at Umpire Central, collect whistles, and be at the field ready to start on time.",
      "Each field has its own stopwatch and air horn at the scoreboard.",
      "If teams are late or don't show (all 6 positions), report it on the goal cards.",
      "The UA does BTS for all Grand Finals.",
    ],
  },
  {
    title: "Cautions & ejections",
    icon: "🟨",
    body: [
      "Yellow (caution) or red (ejection): inform the player and coach immediately after the game, then complete the form right away.",
      "Forms live in a designated folder at Umpire Central and go to the league for processing.",
      "An ejection triggers a tribunal that must finish before the player's next game — if you're working the next hour you may be swapped out. Tell the Field Marshall if you need help.",
    ],
  },
  {
    title: "Observations & accreditation",
    icon: "🔎",
    body: [
      "Around 90 observations are planned across the weekend, most on Saturday.",
      "Being observed? Tell your observer 1–2 keys you want to work on that game.",
      "Half-time feedback is ~2 minutes; post-game about 5 (more if you're off next hour).",
      "Coaches: forms are pre-printed — write legibly, return to the folder at Umpire Central. All forms are PDF'd to umpires after the tournament.",
      "Coaches meet at Umpire Central at 6 pm Saturday to determine re-accreditations and level-ups. Results announced at the Fete.",
    ],
  },
  {
    title: "Stay cool",
    icon: "🧊",
    body: [
      "Water, snacks, and fruit at Umpire Central — stay hydrated, don't cramp.",
      "There is a dedicated umpire cooling room.",
      "Golf cart runs umpires to the far fields and helps with water at half time.",
    ],
  },
  {
    title: "Getting paid",
    icon: "💵",
    body: [
      "Payment info goes to the league the Tuesday after Nationals; checks/e-checks within ~2 weeks.",
      "No completed W-9 = held paycheck.",
      "Record every assignment change on the big sheets — even if you're a 'volunteer'.",
    ],
  },
];

window.ACCREDITATION = [
  { code: "FC / GC / BC", name: "Candidate", desc: "Working toward Introductory Certification in field, goal, or boundary." },
  { code: "F0 / G0 / B0", name: "Introductory Certification", desc: "Certified entry level — you know the basics and are match-ready with support." },
  { code: "F1 / G1 / B1", name: "Development Accreditation (DA)", desc: "Level 1 accreditation. DA field & boundary umpires receive an Acme Thunderer whistle; DA goal umpires receive USAFL goal flags. Green shirt is awarded at DA (Level 1)." },
  { code: "F2 / G2 / B2", name: "Advanced Accreditation (AA)", desc: "Level 2 — the top USAFL accreditation tier." },
  { code: "Ex", name: "Exempt / Experienced", desc: "Typically visiting Australian umpires — accredited at home and exempt from the USAFL pathway." },
];

// ---- Ask Jeff knowledge base ------------------------------------------------
window.KB = [
  { k: "schedule assignment when game time my games what am i doing", a: "Your assignments live in the Schedule tab — search your name and you'll get your full weekend hour by hour. The version in the app is the preliminary draft; things change on the fly, so always confirm against the Big Sheets taped to the tables at Umpire Central, and record any change you work there too." },
  { k: "footy ball grab half time siren return men women", a: "Field umpires: bring the correct game footy (men's or women's) to your game. At half-time, grab the footy! And the moment the final siren goes, grab the footy and return it to Umpire Central." },
  { k: "baf votes best and fairest 3 2 1 goal card", a: "BAF (Best & Fairest) votes go 3-2-1 and are recorded on the goal cards with team and player number. Discuss at half time, get the votes done quickly after the game, and goal umpires take both cards to the table in Umpire Central." },
  { k: "bts boundary timer scorekeeper club duty check in whistle horn", a: "BTS = Boundary, Timer, Scorekeeper — duties done by clubs. They check in 15 minutes before the game at Umpire Central, collect whistles, and head out. Each field has a stopwatch and air horn at the scoreboard. If a team is late or short (all 6 positions), report it on the goal cards. The UA does BTS for all Grand Finals." },
  { k: "yellow red card caution ejection report tribunal form", a: "If you issue a yellow (caution) or red (ejection) card: tell the player and their coach immediately after the game, then complete the Caution/Ejection form straight away — it's in the designated folder at Umpire Central and goes to the league rep at Tournament Central. Ejections trigger a tribunal that must finish before that player's next game, so you might be swapped out of your next game. Ask the Field Marshall for help if you need it." },
  { k: "observation observer accreditation feedback keys coach form", a: "If you're being observed, tell your observer 1–2 keys you want to work on that game. You'll get about 2 minutes of feedback at half time and about 5 after the game (longer if you're off the next hour). All observation forms are PDF'd to you after the tournament. Around 90 observations run across the weekend, most Saturday." },
  { k: "accreditation levels f0 f1 f2 g1 g2 da aa advance level up announced", a: "Levels run Candidate → Introductory (F0/G0/B0) → Development Accreditation (F1/G1/B1) → Advanced Accreditation (F2/G2/B2). Umpire coaches meet 6 pm Saturday to determine who re-accredits or moves up, and results are announced at the Umpire Fete on Saturday night. There's a full breakdown in Resources." },
  { k: "gear shirt whistle flags insoles bag orange green pick up", a: "Gear pickup is Friday night at the Umpire Meeting, ideally 7:00–7:30: UA gear bags, UA insoles (free pair for everyone), Acme Thunderer whistles (DA/AA field & boundary), USAFL goal flags (DA/AA goalies). Need an orange USAFL UA shirt, or owed a green shirt for reaching DA? Email Jeff your size before the tournament." },
  { k: "boundary finals sign up field 1 grand final two games", a: "Boundary umpires work Field 1 (replacing team volunteers). Boundary accreditation needs at least two games plus an observation. Work two boundary games and — if you want it — you're automatically assigned to a Division 1 grand final. Sunday finals boundary sign-up sheet is at Umpire Central, and finals pay as well." },
  { k: "pay payment check paid w9 w-9 money reimbursement volunteer", a: "Payment info goes to the league the Tuesday after Nationals; checks and e-checks land within about 2 weeks. If you're due a paycheck and haven't completed your W-9, your pay is held until you do. And record every assignment change on the big sheets — that's what payment is calculated from." },
  { k: "team picture photo saturday morning time", a: "The umpire team picture is 7:45 am Saturday in front of Umpire Central. On site by 7:15 if you're working at 8, otherwise by 7:30 to be in the shot. With your club and can't make it? Understood." },
  { k: "finals assignment sunday medal grand final announced", a: "Finals are assigned after Saturday's games — announced at the Umpire Fete Saturday night if possible, otherwise posted at Umpire Central first thing Sunday. Finals teams gather at Umpire Central for a team photo and go out as a full team. Medals are handed out as you come off; field umpire medals are part of the closing ceremony." },
  { k: "extra time draw drawn game overtime rules", a: "Extra Time applies when a game that affects advancement ends in a draw at the end of regulation. Field and goal umpires each have specific roles — the procedure is covered at the Friday night meeting and copies are kept at the tent. If a draw looks likely late, get to the huddle quickly and confirm the format before restarting." },
  { k: "welcome dinner thursday aussie", a: "The Welcome Dinner for our visiting Aussies is Thursday, Oct 15 at 7:00 pm (Sarasota location TBD). Anyone in town is welcome — just let Jeff know you're coming." },
  { k: "clinic friday drills stations agenda", a: "The Umpire Clinic is Friday, Oct 16, 2–5 pm at the grounds. On-field drills in teams of 4–5 led by two senior umpires, rotating through field, goal, and boundary stations. The agenda and teams go out about two weeks before." },
  { k: "meeting agm friday night vote election", a: "Friday night: gather 7:00 pm, meeting starts 7:30 at the tournament hotel. The AGM runs at 8:00 (reports, bylaw votes, board elections), then the umpire meeting resumes. Umpire coaches stay afterwards for observation prep. Use the first half hour to socialize and collect gear." },
  { k: "fete saturday night pizza party dinner announcement", a: "The Umpire Fete is Saturday 8–10 pm at the tournament hotel — pizza, salad, and drinks. Accreditations are announced and certificates handed out, and finals assignments are announced if they're ready. Heads up: non-alcoholic beverages until dinner Sunday!" },
  { k: "hotel stay room where tournament central", a: "Sarasota hotel details are TBD — room block info will be emailed to those in the USAFL/UA block. In past years the tournament hotel doubles as Tournament Central with a dedicated umpire room all weekend." },
  { k: "water food heat cooling hydrate cramp snacks", a: "Umpire Central has water, snacks, and fruit all weekend, there's a dedicated umpire cooling room, and the golf cart helps run water at half time. Florida in October is warm — hydrate early and often so you don't cramp." },
  { k: "holding the ball prior opportunity tackle rule interpretation", a: "Holding the ball: if a player had prior opportunity and is legally tackled without genuinely attempting to dispose of it (kick or handball), it's holding the ball. No prior opportunity? They must make a genuine attempt when tackled — knocked loose in the tackle or a genuine attempt means ball-up, not a free. Reward the tackler, but be certain about prior opportunity first." },
  { k: "mark distance 15 meters metres kick catch rule", a: "A mark is awarded when a player catches (controls) a ball kicked at least 15 metres, untouched in flight. If it's touched off the boot or hasn't travelled 15m, play on." },
  { k: "50 metre penalty fifty rule when", a: "Common 50-metre penalties: encroaching over the mark, time-wasting or not returning the ball on the full to a player awarded a free/mark, running through the protected area, abuse of umpires, and late contact after a mark. Signal clearly, jog the 50, and manage the players as you go — most 50s are preventable with a loud early warning." },
  { k: "out of bounds deliberate boundary throw in on the full", a: "Out of bounds: kicked out on the full is a free kick against the kicker. Deliberate/insufficient intent — if the player's clear intention is to put it out without a realistic attempt to keep it in — is a free to the opposition where it crossed. Otherwise it's a boundary throw-in (or in USAFL tournament play with no boundary umpires on most fields, follow the tournament's boundary procedure)." },
  { k: "advantage play on free kick call", a: "Advantage: when a free kick occurs but the offended team keeps or gains possession advantageously, call and signal 'play on — advantage'. Make it decisive and early; if the advantage isn't real, bring it back to the mark. Don't let advantage calls turn into chaos — voice and whistle loud." },
  { k: "ruck contest ball up bounce nomination third man", a: "At ball-ups and boundary throw-ins, one ruck per team contests; a third player entering the contest gives away a free. Have ruck nominations sorted quickly, keep the throw-up consistent, and protect the ruckmen's run and jump." },
  { k: "goal behind signal score point touched post review", a: "Goal: ball kicked by an attacker completely over the goal line without being touched or hitting a post — two-finger signal, then wave both flags. Behind: touched, hit a post, came off any body part other than a boot, or crossed the behind line — one finger, one flag. Not sure it cleared untouched? Confer with the field umpire before signalling. Wait for the field umpire's all-clear before waving." },
  { k: "who is jeff persson tournament director contact email question", a: "Jeff Persson is the USAFLUA Tournament Director (obo Toby Persson). Anything this app can't answer — travel, gear sizes, assignment concerns — email usaflua.tournamentdirector@gmail.com." },
  { k: "father son game sunday", a: "Keep an eye out Sunday — tradition holds a designated Father–Son game where our father-son umpire combos work together. Team photo mandatory! Send pics to our social media guru for posting." },
  { k: "tent queens who help golf cart merchandise", a: "The Tent Queens run Umpire Central all weekend: BTS check-in, UA merchandise, goal cards in/out, the golf cart to the far fields, plus a floater. They work their butts off — thank them!" },
  { k: "changes swap different work big sheet record volunteer", a: "If you work anything different from your printed assignment, record it on the Big Sheets taped to the tables in the tent — that's the master record for payment. Applies to volunteers too." },
  { k: "coach coaching dot name observing means schedule", a: "On the schedule, a coaching slot (shown with a name) means you're observing that umpire's game and completing their observation form — clipboard and pre-printed form from Umpire Central, back in the designated folder when done." },
];

window.JEFF_SUGGESTIONS = [
  "What do I do at the final siren?",
  "How do BAF votes work?",
  "What's holding the ball?",
  "When do I pick up my gear?",
  "What happens if I give a red card?",
  "How do accreditations work?",
];

// ---- Quiz -------------------------------------------------------------------
window.QUIZ = [
  { q: "A player with prior opportunity is legally tackled and makes no genuine attempt to dispose of the ball. Your call?", opts: ["Ball-up", "Holding the ball — free to the tackler", "Play on", "50m penalty"], a: 1, why: "Prior opportunity + no genuine attempt = holding the ball. Reward the tackler." },
  { q: "Minimum distance a kick must travel (untouched) for a mark?", opts: ["10 metres", "15 metres", "20 metres", "Any distance"], a: 1, why: "15 metres, untouched in flight, with control of the ball." },
  { q: "The ball is kicked out on the full. What's the call?", opts: ["Boundary throw-in", "Ball-up", "Free kick against the kicker", "Play on"], a: 2, why: "Out on the full is a free kick to the opposition where it crossed." },
  { q: "At the final siren of your game, the first thing you do is…", opts: ["Sign the goal cards", "Shake hands", "Grab the footy and return it to Umpire Central", "Confirm scores with the timekeeper"], a: 2, why: "Straight from the guide: siren goes — grab the footy, back to Umpire Central!" },
  { q: "BAF votes are recorded…", opts: ["On the scoreboard", "On the goal cards, 3-2-1 with team and number", "On the observation form", "Texted to Jeff"], a: 1, why: "3-2-1 on the goal cards; discuss at half time, finish quickly post-game, both cards to Umpire Central." },
  { q: "Clubs on BTS duty must check in at Umpire Central…", opts: ["At the first bounce", "15 minutes before the game", "30 minutes before the game", "Only for finals"], a: 1, why: "15 minutes prior — collect whistles and be at the field ready to start on time." },
  { q: "You issue a red card and you're assigned the next hour. What's true?", opts: ["Nothing changes", "You may be swapped out — the tribunal must finish before the player's next game", "The game is replayed", "The player sits 5 minutes"], a: 1, why: "Ejection paperwork and tribunal come first — notify the Field Marshall if you need help." },
  { q: "A defender under no real pressure knocks the ball over the boundary with no attempt to keep it in. Call?", opts: ["Throw-in", "Free kick — deliberate out of bounds", "Ball-up", "Play on"], a: 1, why: "Insufficient intent to keep the ball in play = free kick where it crossed." },
  { q: "The goal umpire should wave the flags…", opts: ["Immediately after the ball crosses", "Once the crowd confirms", "After the field umpire gives the all-clear", "Only for goals"], a: 2, why: "Always wait for the all-clear before signalling with the flags." },
  { q: "Boundary accreditation at Nationals requires…", opts: ["One game", "At least two games plus an observation", "Four games", "A written test only"], a: 1, why: "Two games minimum plus an observation — and two games can earn you a D1 grand final." },
  { q: "A free kick occurs but the offended team sweeps the ball forward in space. Best umpiring?", opts: ["Always bring it back", "Call and signal 'play on — advantage' early and decisively", "Wait and see, then decide at the next stoppage", "Ball it up"], a: 1, why: "Advantage must be immediate and clear — if it isn't real, bring it back to the mark." },
  { q: "How many ruckmen may contest a ball-up?", opts: ["As many as want to", "Two — one per team", "Three", "Two per team"], a: 1, why: "One per team; a third player in the contest concedes a free kick." },
];

// ---- Good Call! seed posts ----------------------------------------------------
window.SEED_SHOUTOUTS = [
  { from: "Tara M", to: "Henry Nelson", tag: "🚩", msg: "Flawless flag work on Field 2 all afternoon — didn't miss a touched ball all day.", ts: Date.now() - 1000 * 60 * 60 * 5 },
  { from: "Anon", to: "The Tent Queens", tag: "👑", msg: "Golf cart water runs in that heat saved at least three of us from cramping. Legends.", ts: Date.now() - 1000 * 60 * 60 * 9 },
  { from: "Brendan D", to: "Steve Arnott", tag: "🔥", msg: "Back-to-back on Fields 1 and 3 and still sprinting to the contest in the last quarter.", ts: Date.now() - 1000 * 60 * 60 * 22 },
  { from: "Jeff P", to: "Every first-timer", tag: "🏉", msg: "Huge weekend from the new crew — Nationals debuts everywhere. See you all in 2027.", ts: Date.now() - 1000 * 60 * 60 * 30 },
];
