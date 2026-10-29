# Night build: status and resume notes

Shared by MKT101 (`abdullamuizfuad/mkt101-cases`) and MKT301 (`abdullamuizfuad/mkt301`). Work happens on branch `night` in each repo; a phase goes to `main` only when both sites' full suites pass.

## Phase status

| Phase | What | Status |
|---|---|---|
| 0 | One shared engine (`engine/`, identical in both repos) | **live** (main: MKT301 `d244165`, MKT101 `7e9b233`) |
| 1 | CI, XP audit, error reports, streak freeze, at-risk, problem reports, announcements, privacy page, wording fixes, backup export | **live** (main: MKT301 `cb6aa81`, MKT101 `ee22bf0`); site and cloud suites green on the combined rules and on the published rules |
| 2 | Home dashboard, avatar builder, streak blocks, countdown grid, spaced review, readiness, flashcards, item analysis, name policy | code done on `night` (`engine/dash.js`, `engine/avatar.js`); `dash` test group added; suites running |
| 3 | Practice paper (unlocks 22 Nov 2026 00:00 GMT+5) | not started |
| 4 | Class directory, challenges, weekend teams, notifications, push, quiz battle | not started |
| 5 | Question generation and editor, weekly report, backups, attendance, hints, a11y and performance, new-term rollover | not started |
| Release | Version 2.1: one-time sign-out, What's new popup, name confirmation | not started |

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

- Phase 2: full suites on `night`, backup, push to main. Then Phase 3.

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

- none yet
