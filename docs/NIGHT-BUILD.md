# Night build: status and resume notes

Shared by MKT101 (`abdullamuizfuad/mkt101-cases`) and MKT301 (`abdullamuizfuad/mkt301`). Work happens on branch `night` in each repo; a phase goes to `main` only when both sites' full suites pass.

## Phase status

| Phase | What | Status |
|---|---|---|
| 0 | One shared engine (`engine/`, identical in both repos) | **live** (main: MKT301 `d244165`, MKT101 `7e9b233`) |
| 1 | CI, XP audit, error reports, streak freeze, at-risk, problem reports, announcements, privacy page, wording fixes, backup export | **live** (main: MKT301 `cb6aa81`, MKT101 `ee22bf0`); site and cloud suites green on the combined rules and on the published rules |
| 2 | Home dashboard, avatar builder, streak blocks, countdown grid, spaced review, readiness, flashcards, item analysis, name policy | **live** (main: MKT301 `b21a490`, MKT101 `11b0c18`) |
| 3 | Practice paper (unlocks 22 Nov 2026 00:00 GMT+5) | **live** (main: MKT301 `c2593f1`, MKT101 `de16579`) |
| 4 | Class directory, challenges, weekend teams, notifications, push, quiz battle | **live** (main: MKT301 `2fca700`, MKT101 `bfa3fbd`); switches on when the combined rules are published |
| 5 | Question generation and editor, weekly report, backups, attendance, hints, a11y and performance, new-term rollover | **live** (see Phase 5 notes) |
| Release | Version 2.1: one-time sign-out, What's new popup, name confirmation | **live** (`engine/release.js`) |
| Simple home | Today home, My progress, tab bar, View as student, lecturer home and blocks | see "Simple home" below |
| Weekly challenge | 6th-spot challenge, paragraph builder, Refer to notes, MKT301 notes | **live**; needs the new FINAL rules published before Mon 2 Nov, 16:00 |

## Engine layout (Phase 0)

Load order in `index.html`:

1. `course-config.js`: the `CRS` object (course id, code, name, localStorage prefix, colours, course-only fields, concept-check extras).
2. `roster.js`, `leaderboard.js` and the course data files.
3. `engine/concepts.js`, then `cloud-config.js` (Firebase config and `CLOUD_ON`), then the Firebase SDK (only when the cloud is on or `?emu=1`).
4. `engine/cloud.js`, `engine/install.js`, `engine/coverage.js`, `engine/presence.js`, `engine/core.js`.
5. `course.js`: course pages and data, plus the hooks the engine calls (`CASE_ALL`, `caseName`, `isB`, `bArea`, `ROUTES.*`, `onHook(...)`).
6. `engine/boot.js`: starts the app.

Styles: `engine/engine.css` (shared), then `course.css` (colours and course-only rules).

The engine must be byte-identical in both repos. Edit it in one repo, then run `node tools/sync-engine.mjs` to copy it across and refresh `engine/MANIFEST`. The `engine` test group (and CI) fails if the files drift.

Extension points: `ROUTES[name]=h=>…` adds a page at `#/name/...`; `onHook('beforeMe'|'afterLoad'|'leave', fn)` runs code at start-up or on every route change.

## Lecturer decisions recorded

- The exam date of 14 Dec 2026 9:00 am GMT+5 is shown on home with a countdown (date, time and countdown only).
- The practice paper unlocks 22 Nov 2026 00:00 GMT+5; S000001 can preview it. All times are GMT+5.
- Streak freeze: you earn 1 for every 4 streak days, and can bank up to 2. Earn-back: a 20-minute active focus block within 24 h of the missed day, at most once a week.
- Name policy:
  - No hidden players.
  - The display name is the official name from `directory/{SID}.n`.
  - The username is `@` + one word of that name + the last 3 digits of the SID.
  - Students confirm their name once.
  - The lecturer can override any name.
  - Sections are stored in `directory/{SID}.g`.
- Version 2.1 release:
  - Everyone is signed out once (progress kept), then sees the What's new popup and then the name confirmation.
- Back up Firestore before every push to main:
  - Run `tools/backup/export.mjs` and check the student count.
  - MKT101 uses `MKT101_LECTURER_PIN` and falls back to `MKT301_LECTURER_PIN`.
- All data changes are additive, and migrations are idempotent.
- One combined rules file per project, delivered at the end.

## Phase 1 notes

- New engine files: `engine/feat.js` (lecturer-card plumbing, error reports, Report a problem, announcements, streak freeze, XP audit, at-risk, class backup, privacy page), `engine/names.js` (official names and usernames), `engine/avatar.js` (avatar codes, used from Phase 2).
- Features that need the combined rules carry `data-need="rules"` and stay hidden until `meta/` is readable (`rulesOK()`), so the site keeps working on the old rules.
- CI: `.github/workflows/tests.yml` runs the site suite, the engine check and the cloud suite on a made-up class list (the test IDs only).
- `tools/sync-engine.mjs` also reads `$ENGINE_OTHER` (the night working copies live in `n101`/`n301`).
- Board writes under the combined rules: `n` must equal the directory name (or `''` before names are added), so old clients' nickname rows are refused until they update. Publish the rules together with Version 2.1.

## Next

- Everything in the brief is live. The lecturer still has to:
  1. Publish the combined rules for each project (`<scratchpad>/rules/mkt301-FINAL.rules`, `mkt101-FINAL.rules`, or regenerate them with `python3 tools/build-rules.py <ids csv>`).
  2. Paste each Moodle participants CSV into Lecturer → Class names.
  3. Optionally, set up phone notifications (`docs/PUSH.md`).
- Open question: practice paper section times.

## Release 2.1 notes

- `engine/release.js`. `APP_VERSION='2.1'`. A device that was already signed in when the update loads does this once:
  1. It copies its progress to `localStorage` (`u_bak21_<SID>`).
  2. It waits until the cloud copy is saved (if it can't be saved, it tries again on the next visit).
  3. It signs out and shows a banner: "Version 2.1 is here. Please sign in again. Your progress is safe."
- Signing in fresh doesn't trigger a sign-out. What's new shows once (`U.seen21`) after the progress loads (after the cloud pull for PIN accounts), with Read more → `#/whatsnew` (also in the footer next to "? How it works"). The name confirmation (names.js) waits until What's new has been seen. Brand-new students get the tour instead.
- Tests set `window.__noWhatsNew` and a `ver` key; the `release` (site) and `release21` (cloud) tests cover the real flow.

## Phase 5 notes

- `engine/qbank.js`: the question overlay `qbank/{id}` (draft/live/hidden) and the Lecturer → Question editor card. Course hooks `qbankKinds()`, `qbankApply()`. Claude drafts with `tools/qgen/upload.mjs` (`docs/QGEN.md`); the lecturer publishes them.
- `engine/reports.js`: Weekly report (8 weeks; per-student CSV; weekly XP from the new `U.xpd`) and Attendance CSV (all ended live sessions).
- Hints (`hintHTML()` in dash.js): 💡 shows the start of an unpicked key idea; stored as `st.hints` and `U.hints`; no XP change.
- Accessibility: skip link, focus ring, focus moves to the new page's content, nav label.
- New term: `docs/NEW-TERM.md`; `CRS.termStart` hides old leaderboard rows. Class backup button: Phase 1 (`bkc`).

## Phase 4 notes

- `engine/social.js`. Course hooks `quizItems(rng, n)` and `quizItem(id)`: MKT101 uses the MCQ bank; MKT301 makes "which of these is NOT right?" items from each plan's decoys.
- New collections (combined rules): `notifs`, `studying`, `challenges` (+ `r/{SID}`), `weekend`, `battles` (+ `a/{SID}`), `push`. The weekend rule uses `(request.time + 5h).dayOfWeek() in [5, 6]` (Mon = 1, checked in the emulator).
- Queries avoid composite indexes: notifications and challenges are sorted on the device.
- XP keys: `ch:<id>` (at most 5 challenge rewards a day), `wk:<Friday>`, `wkteam:<Friday>`, `bt:<id>`, `btp:<id>`.
- Phone notifications are off (`PUSH_ON=false` in cloud-config.js). The lecturer sets them up from `docs/PUSH.md`.

## Phase 1 fixes found by the cloud suite

- The first save after sign-in waits for the rules probe (`C.probed`), so a row is never written in the old format to the combined rules.
- Board XP climbs at most ~2 XP a second (rules `xpRate()`); the site retries when the allowance covers the gap (3–20 s), and after a refusal re-reads the row (another device may have written it). It gives up after 5 refusals until the next save.
- The rules no longer use string slices (`u[1:…]`, `sid[4:7]`), which the rules engine rejected; the username checks use `replace()` and `matches()` instead.

## Phase 2 notes

- Dashboard hooks in `course.js`: `readyAreas(u)`, `qArea(id)`, `revItem(id)`, `flashDecks()`, `dashStats()` (MKT101 adds topics mastered).
- The countdown card shows only the date, time and countdown (no other wording), per the lecturer's exception.
- Avatar codes gained an optional 11th character (expression 0–3); 10-character codes still read as before. The board field `a` already allows it.
- New progress fields (additive): `U.srs`, `U.conf`, `U.fc`, `U.mi`, `U.av`. Review XP keys `rev:<id>:<due>`, flashcards `fc:<id>:<day>`, avatar `avatar:made`.

## Open questions

- Practice paper section times (MKT301 70/50/60, MKT101 30/75/75) and sizes are placeholders; the lecturer may want them changed in `paperSpec()`.

## Phase 3 notes (practice paper)

- `#/paper`, `engine/paper.js`. Course hook `paperSpec(rng)` builds the sections from the practice banks (never from past papers):
  - MKT301: one case (one question per slot, 70 min), four short answers from different weeks (50 min), one strategy essay (60 min).
  - MKT101: 25 MCQs across Topics 8–14 (30 min), three short answers and one long answer (75 min), three case questions (75 min).
- The questions come from a seed (course, student, paper number), so they match on every device; only answers and times are stored (`U.pp`).
- The clock is wall-clock time: it keeps running if the page is closed. Leftover time carries to the next section; a section that runs out is submitted as it stands (buzzer, vibration, a modal). 5-minute warning toast. "End the paper now" submits everything left.
- Typed answers use the same typing box as practice (paste blocked, voice typing allowed, integrity notes kept in the answer).
- Self-check after the paper (not timed): tick the key ideas covered. XP `pp:<paper>:<question>` (2 + up to 8 for ideas, max 10) and `pp:<paper>:mcq` (half the MCQs right, max 15), only for the first 3 papers. Report: key ideas covered, MCQ %, time per section, carried minutes.
- Section times are my choice (no lecturer decision yet): see Open questions.

## Simple home (after Version 2.1)

Status: **live** (main: MKT301 `32b2cb5`, MKT101 `62625c1`). Site suites MKT301 32/32, MKT101 40/40; cloud suites 28/28 each on the FINAL rules. Backed up first (MKT101 40 students, MKT301 0).

- **Home ("Today")**, `engine/simple.js` `home()` replaces the course `home()` functions:
  - a header strip: avatar, name and @username, ✏️ Edit profile (→ `#/avatar`), level bar, 7 streak blocks, freezes
  - a small countdown: days left, "Mon 14 Dec 2026 · 9:00 am" and a mini grid; it links to `#/progress/cd`
  - NEXT UP
  - a Today row: screen-time ring, missions x/3 (tap to open), number to review
  - announcements, lecturer notes, the streak rescue and unread notifications, only when there is something to show
  - practice tiles from the course hook `homeTiles()`, plus the 📝 Practice paper tile (locked for students until 22 Nov; "Preview" for the lecturer)
  - Phone height: MKT301 ~5,990 px before → ~1,190 px after (about 880 px of content plus the footer); MKT101 ~6,900 → ~1,190.
- **My progress** (`#/progress`, `#/progress/<section>` opens one section). It is built by `profSections(u, ctx)`, the same sections as the lecturer's student profile:
  - countdown, readiness, weak spots, the course's sections (hook `profCourse`), activity, screen time, badges, cases
  - each section folds to a one-line summary (`<details>`)
  - the summary row (`profSumHTML`) is shared with the lecturer profile, which adds the at-risk flag, last active, integrity, typed answers and messages
- **Practice** (`#/practice`), **Save my progress** (`#/backup`), and the **More** menu (`[data-more]`: My profile, My progress, Badges, Notes, Flashcards, Review, Practice paper, Save, How it works, What's new, Install, Privacy, Sign out).
- **Phone tab bar** (≤700 px): Home · Practice · Progress (Lecturer for the lecturer) · Leaderboard · More.
  - It is one block in `simple.js` (`tabbarHTML`) plus one CSS block in `engine.css`; `CRS.tabbar=false` removes it.
  - The footer, with Sign out, is unchanged.
- **My profile** (`#/avatar`): name, @username with 🪪 Change my @username, and the avatar builder.
- **The lecturer is never a player** (recorded in CLAUDE.md):
  - `award()` and `checkBadges()` do nothing for S000001, and the lecturer has no board or studying row.
  - Challenges, the weekend challenge and notifications show a "for students" card (`notPlayer`), and the lecturer is excluded from pickers.
  - The top bar shows the lecturer's avatar and a Lecturer tag.
  - The lecturer home holds:
    - Class today: active today, to mark, open reports, at risk; each one opens its block on the Lecturer tab (`data-lgo`)
    - buttons: View as student, Marking, Post announcement, Start live session, Leaderboard, Lecturer tools
    - at-risk and recently active lists, top 3 each
    - previews: the paper and practice tiles, with no XP
  - Every lecturer-only element has `data-lect`; the `lectonly` test renders every route as a student and finds none.
- **Lecturer avatar**:
  - saved in U.av and published to `meta/lecturer` `{a, n, t}` (the published rules already allow this)
  - students see it via `lectAvHTML()` on announcements, lecturer messages, marked answers, the live-session bar and the quiz battle host line
  - default avatar: `LECT_AV_DEFAULT`
- **View as student** (lecturer only, read-only):
  - picker: search by name, ID or @username; on the lecturer home, the Lecturer tab (first block), My progress, and each profile (👁 button)
  - `vaEnter()` swaps ME/U for the student's cloud progress in memory
  - while `VIEWAS` is set: save, award, countOnce, LS.set/del, every CLOUD write, screen time and freezes are no-ops, and answer controls show "Read-only: you're viewing as a student."
  - Exit restores the lecturer's own state; tests check that localStorage and the student's cloud documents are unchanged
- **Lecturer tab blocks** (`lfBlock`/`lfBind` in `engine/feat.js`):
  - every card folds to its title plus a summary; data loads the first time a block opens
  - open blocks are remembered per device (LS `lfold`); Marking, Reports and At risk open by themselves when something is waiting
  - Expand all / Collapse all
  - tables and lists show their top 3 rows with "Show all N ▾"
- **Sections**: `secLabel(g)` shows "MKT301_H01 course" as "H01" (stored values unchanged). With no sections (MKT101), the weekend challenge has one "Whole class" team and no team bonus.
- What's new: "A simpler home" is the first entry. Service worker caches: mkt301-v12, mkt101-arena-v10.
- Tests: `simplehome`, `progress`, `tabbar`, `lecthome`, `lectonly`, `viewas`, `lfold`, `sections` (site); `viewAs`, `lectAvatar` (cloud). Screenshots: `scratchpad/night/simple/`, made with `scratchpad/sh/shots.js`.

## Weekly challenge (6th spot), paragraph builder, notes

- `engine/wild.js`: the weekly 6th-spot challenge (docs/WILD.md). The window is `CRS.wild` (class start, GMT+5) minus 24 hours. The top 5 come from XP earned that week (`U.xph`, added here: XP per hour, GMT+5, kept 21 days; `U.xpd` before it existed). One 20-minute attempt, notes locked during it (`wildBusy()`, `body.wlock`). Includes the lecturer's live screen `#/wild/live`, the Lecturer tab card `wildc` and the home cards (`#twild`). XP keys: `wild:<id>` (+20) and `wildwin:<id>` (+30).
- `engine/chips.js`: the paragraph builder (kind `chips`): `chipsScore`, `chipsUI`, practice `#/chips/<topic>` (XP `chip:<id>:<day>`, 2 per point).
- `engine/notes.js`: the notes renderer, moved out of MKT101's course.js and now shared. Course hook `notesCfg()`; `fold:true` (MKT301) gives the short folded week page with a sticky "Jump to" row and week picker; `#/notes/<key>/<section>` opens a section. `notesBtn(q, o)` is the "📖 Refer to notes" button (course hook `notesFor`). Lecturer card `nrevc` lists `notesCfg().review`.
- Data: `bank-chips.js` in each repo (CHIPS plus `wildPick`, loadable in Node); `notes301.js` (MKT301, from branch `notes`).
- Tools: `tools/wild/open.mjs`, `close.mjs` and `core.mjs`, plus `commitDocs` and `getDoc` added to `tools/marking/lib.mjs`.
- Rules: the `wild` blocks in `tools/build-rules.py`. The lecturer must publish the new FINAL rules before the first window opens (MKT301: Mon 2 Nov, 16:00).
- Tests: site groups in `tools/tests/wild-site.js` (wildwin, wildtop5, wildxph, chipscore, wilditems, wildlock, notesref, notesfold, wildpage); cloud groups `wild` and `wildTools`.
- MKT301's first week, w2026-11-03, uses weeks 10 and 11 (the lecturer's choice, `CRS.wildPlan`).

## Session activity

XP and activity per live tutorial session, in `engine/presence.js`. No rules change: the `rep` map's values are not schema-checked.

- **`U.al` and `U.alSince`.** `U.al` logs every award from this version on as `[seconds, key, xp]`, plus the daily check-in. It keeps 45 days and at most 2,500 entries. `U.alSince` is when logging started on that student's device. The hooks are registered from `presOn()`, because presence.js loads before core.js. `award()` now runs the `award` hook before `save()`, so the log is saved with the award.
- **`sessXP(u, S, join, rep)`.** Covers the window from the session start (or the student's join time, if later) to the end, or to now while the session is live.
  - When the log covers the window, the result is exact: XP plus activity counts by category (`SX_MAP`, from the real award key prefixes in both courses), plus the session's focus bonus found by key.
  - Otherwise it uses the row saved at the end of the session.
  - Otherwise it gives an hourly estimate from `U.xph`, marked "≈", with no breakdown.
- **`liveFinish`** saves `xp`, `fx`, `acts` and `j` in each report row (`sxRepAdd`).
- **Report (`#/session/<id>`):**
  - New columns: XP in session, focus bonus, activity, plus a timeline under each student (`data-lect`).
  - New class totals: XP earned and XP per student.
  - The CSV has the new columns.
  - XP comes from users docs, redrawn at most once a minute while live, plus a Refresh button.
- **Profile sessions table and My progress:** a new "XP in session" column.
- **Joined student's bar:** shows "+N XP this session".
- **Tests:**
  - Site (`tools/tests/sessxp-site.js`, shared by both repos): `sxlog`, `sxwin`, `sxcats`, `sxhourly`, `sxbar`, `sxreport`.
  - Cloud (`firebase.js`): `sessxp`.
### Session analytics (live feedback, reflections, attendance)

- **`U.qa` and `U.qaSince`.** (`U.ans` already holds submitted typed answers, so the log has its own name.) `U.qa` logs every practice answer as `[seconds, question id, ok (1/0 or a 0–1 score), pick]`, using `ansLog()` in engine/presence.js. It keeps 45 days and at most 3,000 entries. Logged answers:
  - MCQs (MKT101)
  - quick rounds, challenges and battles (`quizRun`)
  - review and flashcards
  - paragraph builders and the weekly challenge
  - plan checks (score), typed answers (auto-check band / 6) and self-checks (ticks / checks)
  - case verdicts
- **Live feedback panel (`#/live`).** Shows the average score, the most missed questions (top 5 and Show all, with the correct answer and the most common wrong pick), the questions mostly answered right (80%+), the topics practised, and a Score column. The projector view hides names.
  - The lecturer can send messages, stored in `sessions/{id}.fb`; students see them as a toast and in the live bar.
- **End session on the newest rules ("r3").**
  - The per-student rows go to `sessions/{id}/lect/rep` (lecturer only).
  - Each student's own figures go to `sessions/{id}/me/{SID}`.
  - The session doc keeps `nj` and `refl`: covered topics, average score and XP, strengths, areas to reflect on with notes links, and an editable note.
  - Older sessions' `rep` is copied to `lect/rep`, checked, and then removed from the session doc (`sxMigrate`).
- **Students: Past tutorial sessions** (`#/sessions`, `#/sessions/<id>`), linked from More and My progress. Shows the reflection plus their own figures only.
- **Report (`#/session/<id>`).**
  - The answers panel.
  - Attendance for the whole class list (Present / Late / Partial / Absent), with lecturer overrides saved in `lect/att`, filter and sort, Copy names and a CSV.
  - The reflection editor, or "Build and publish" for sessions that ended before this release.
- **Rules.** Session doc keys gain `nj` / `fb` / `refl`, plus the `lect/{doc}` and `me/{sid}` subcollections. On the older rules everything that writes stays hidden (`sessR3()` probes `sessions/_probe/me/<own ID>`).

## Top students (Expert sets, levels, review XP, weekly board)

- **Expert sets** (`engine/expert.js`, content in MKT101 `bank-expert.js`, switched on by `CRS.expert`). One set per topic: 10 case MCQs (+4 XP, `xmcq:<id>:<day>`), 2 paragraph builders (up to +10, `xchip:<id>:<day>`) and 1 short essay (the written-answer card; it joins the marking queue, marks give up to +30; `xessay:<id>` counts it).
  - Every student sees every set on Practice, #/expert and each topic's notes page. States (`data-st`): `soon` (not approved: lock and progress still shown), `locked` (🔒, progress towards 80%+ on 15 MCQs), `open`, `done`; the lecturer sees `preview` (no XP).
  - Unlock = the MCQ part of topic mastery (`expertProg` → `mastery(u,t).mcq`), as the lecturer chose (option A). A toast celebrates it once (`U.exu`).
  - Approval: Lecturer tab card "🎓 Expert sets to approve" writes `meta/expert` `{t8:true,…}` (no rules change); students cache it in localStorage.
  - Progress: `U.exs[topic]={m:{id:1|0 first try},c:{id:best share}}`. Badges "Expert: Topic N" (finished at 70%+) and "Grand Expert".
  - Essays join `qIndex()` through the course hook `qIndexMore`, and `tools/marking/lib.mjs` loads them for Claude marking.
  - Tutorial sessions: a joined student who has mastered the session's topic is offered "🎓 Try the Expert set instead" (`exTutHTML`, `exTutAllowed`).
- **Levels (MKT101):** ⭐ Senior Consultant 7,000 · ⭐⭐ Principal Consultant 9,000 · ⭐⭐⭐ Marketing Partner 12,000 (Marketing Director and CMO already existed lower down, so the new names differ). Level badges follow automatically.
- **Review XP:** +4 when a due question is remembered (`rev:<id>:<due>`), nothing when forgotten, at most 25 a day (`U.revx`). The Today row shows "+4 XP each".
- **Leaderboard:** "This week" first (XP since the last class start, `wildWin().from`), "All time" second. The board row carries `w`/`wk` only once the newest rules are published (`PR.r3`, probed on the `cloud` hook); the rules allow `w` (int, 0…x) and `wk`.
- Tests: `tools/tests/expert-site.js` (excards, exunlock, exxp, exessay, exlevels, exrev, exweek, extut, exlect).
## Fun and tutors

Items 1–14 of the lecturer's list, in `engine/fun.js` (with `engine/agg.js`), MKT101 first. Everything takes 5–15 minutes.
Settings: `CRS.fun` (MKT101 `{boss, story, tutorLvl:9, tutorEx:3, goal:3000}`, MKT301 `{tutorLvl:4, tutorEx:0, goal:1500}`).

- **Boss rounds** (`#/boss`, content `bank-boss.js`, MKT101): a 10-minute mini-case at the end of each topic's Expert set: 3 decisions and a
  paragraph builder, marked at once. Every student sees them, locked until they finish the topic's Expert set; "Coming soon" until the
  lecturer approves (`meta/expert` `b<topic>`, Lecturer tab "Boss rounds and story"). The first try counts (+5 a right decision, up to +10
  for the paragraph, +20 for passing at 70%); later tries are practice. Badges `boss<t>` and "Boss of bosses". Also a live-session activity
  (`act.k='boss'`): joined students can play the round even if it is still locked for them.
- **Story mode** (`#/story`, `story.js`, MKT101): Raalhu Juice, one chapter per topic, open after 10 MCQs in the topic; released by the
  lecturer (`meta/expert.story`). +5 per right decision, once.
- **Speed runs** (`#/speed`): 20 mixed questions (`quizItems`), 5 minutes (4 in hard mode). Score = right × 10 + seconds left × accuracy.
  XP: right answers on the first run of the day (`speed:<day>`), +5 for a new best (`spb:<day>`).
- **Hard mode** (`U.hard`, switch on Practice): body.hard hides hints and "Refer to notes"; the `award` hook adds the same XP again for
  correct answers (`hard:<key>`), at most +60 a day (`U.hardd`).
- **Term cards** (`#/collection`): a flashcard known on two reviews (`U.fc[...].s >= 2`) is a card; a full deck gives a rare card.
- **Monday recap**: a home card on Monday and Tuesday until dismissed (`U.recap[week]`).
- **Class figures** (`meta/agg`, see docs/AGG.md): class goal, most improved, territories. Written by the lecturer (Lecturer tab card or
  `tools/agg/run.mjs`); rewards `goal:<week>` and `imp:<week>` (+20 each) are credited by `funCredit()` on the student's device.
- **Streak duels** (`#/duels`): `challenges` with `mode:'streak'`, 2 players, 7 days (+1 day to claim). Each player writes their best run of
  days in a row to `r/<SID>` after day 7; win +30, tie +15, loss +5 (`duel:<id>`); at most 2 at a time.
- **Mentors**: on the live board, 🤝 Mentors (`#/mentors/<session>`): tick mentors, pair classmates (`sessions/{id}.ment`), and give mentor
  bonuses. A bonus is a mark with key `bonus_ment_<session>` in `reviews/<SID>`: `applyMarks` pays it once (`bonus:<key>`, up to 30 XP) and
  shows the message. Joined students see their mentor or mentees on the tutorial page.
- **Teach-back** (`#/teach`) and **Question writer** (`#/write`): for topics where the student has the Expert badge (or, without Expert
  sets, from `tutorLvl`). Drafts in `subs/<SID>_<tb|qw>_<1-9>`; the lecturer approves on the Lecturer tab ("Teach-backs and questions").
  Approved teach-backs show on the topic's notes page ("Explained by …"); approved questions are written to `qbank` as live MCQs.
  +15 / +20 XP (`tb:<id>`, `qw:<id>`).
- **Tutor badge and Ask a tutor** (`#/help`): a tutor reaches `tutorLvl` with `tutorEx` Expert badges (topics = those badges). The board row
  carries `tu` (topics) and `hp` (classmates helped); the leaderboard shows 🎓 Tutor. Questions `help/<SID>_<day number>_<1-3>`, answers
  `help/<id>/r/<SID>_<1-3>`; "This helped me" sets `ok` and notifies the tutor (`ref help:<id>/<rid>`), whose device credits +10
  (`helped:<id>/<rid>`, at most 50 a day). Reports go to the Reports card; the lecturer hides or deletes from the thread page or the
  "Ask a tutor" card.
- **Rules** (one update): board `tu`/`hp`; sessions `ment`; challenges `mode:'streak'`; new `help` (+ `r`) and `subs` blocks. The site
  probes `help/_probe` (`funOK()`); on older rules the writing parts stay hidden.
- **Tests**: site `tools/tests/fun-site.js`; cloud `tools/tests/fun-cloud.js` (rules, Ask a tutor end to end, teach-back, figures, mentor bonus).

## Class activity

- **Card "📊 Class activity"** (`engine/activity.js`, lecturer only, folding `lfBlock` card `actc`, reads users/ on open, Refresh button). Range: full semester (since 28 Oct 2026), this week, any past week (Mon–Sun, GMT+5, with tutorial week numbers from `termWeek`) or a custom from–to.
  - Calendar heatmap (active students per day; tap a day for students, answers, XP, study hours), totals, activity mix per week (stacked bars), busy times by hour (from 4 Nov: `U.qa` + `U.al`).
  - Students table: Top 5 / 10 / 20 / Everyone; sort by XP, study hours, days active, answers, MCQ accuracy or XP per hour; tap a row for daily hours and XP, profile and View as student.
  - CSV: this list, everyone, and a daily class CSV.
  - Sources: `U.days`, `U.cnt` (dated counted actions; MCQ first-try accuracy from the `mcqRight` counter), `U.al` (actions not counted), `U.st` + `U.stw`, `U.xpd` (from 29 Oct; "Full semester" XP is the total). `ACT_PRE` maps key prefixes to categories.
- **Timed writing as study time** (`U.stw`, presence.js `twStart/twTake/twStop/stwAdd`). A writing timer (core.js `timer`) and practice-paper sections answered on paper (paper.js `ppSubmit`) add their time on Done (≥40% of the time), capped at the timer's length, minus the on-screen seconds already in `U.st` during it (`PR.act`, taken every 10 s and on pause). It never earns screen-time XP (goal and 20-minute blocks stay on `U.st`). Shown as "incl. timed writing" on the screen-time card, My progress and the lecturer profile.
- Tests: `tools/tests/activity-site.js` (actrange, acttop, actheat, twcredit).
