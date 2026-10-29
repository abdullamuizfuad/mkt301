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
| Weekly challenge | 6th-spot challenge, paragraph builder, Refer to notes, MKT301 notes | see "Weekly challenge" below |

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
