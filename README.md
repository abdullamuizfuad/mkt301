# MKT301 International Marketing: Practice Portal

A gamified study and practice site for MKT301 International Marketing (MNU Business School). Students sign in with their student ID and a personal PIN, work through case studies, short-answer and essay practice, and earn XP, badges and a place on the class leaderboard. All written answers are done on paper; the portal helps students plan, time and check them.

## What's in it

- **Section A · Cases:** ICETO Gelato, The Coffee Bean & Tea Leaf, and Kandu Bites (tuna jerky to Japan and Italy). Each has an extended case, exhibits, a Boardroom of competing arguments, and random sets of practice questions (plan with chips → timed writing on paper → self-check).
- **Section B · Short answers:** 56 practice questions tagged by week (3 angles on each key short-answer skill, plus questions from the other weeks). Random sets of 6, filter by week, plan with chips → 10-minute timer → self-check.
- **Section C · Strategy & essay:** 4 competitive-advantage scenarios in three parts (Five Forces sort, Diamond sort, Strategic Intent and Blue Ocean canvas, each with its own timer), and an Essay Coach with 4 expansion scenarios (mark bands, market scoring, order and entry modes, supply-chain builder, revenue and risk tools, an essay script, a 40-minute timer and self-marking).
- **Game:** XP, levels, badges, day streaks, three daily missions that change every day and get tougher with each level, and a **live leaderboard**.
- **Accounts (Firebase):** students sign in with their ID and a 6-digit PIN. Progress saves to their account and follows them to any device. The lecturer (`S000001`) gets a live class dashboard. If Firebase can't be reached, the portal falls back to device-only mode.
- **Save my progress:** the 💾 button in the top bar shows the sync status and makes extra backups: email to the lecturer, download a file or copy a code.
- **Focus mode:** practice sets show one question at a time (progress bar, Previous/Next, dots). After planning, students finish their way: **Plan only**, **Write on paper** (timed) or **Type my answer** (compare with the key points, self-mark 0–6). Each set ends with a summary and a **Practise my weak spots** option.
- **Install as an app:** students can add the portal to their home screen; it works offline (`manifest.webmanifest`, `sw.js`). When the list of files changes, bump `CACHE` in `sw.js`.
- **Restart:** every question, Section C part and Essay Coach scenario has a ↺ Restart button that clears it and removes the XP it earned.


## Student profiles (lecturer)

Signed in as `S000001` with the cloud on, tap any student on the **Leaderboard** or in the **Class dashboard** table (there is a search box above it) to open their full profile at `#/student/<ID>`. It updates live and shows: level, XP and streak; badges with dates; an 8-week practice calendar and recent activity; Section B progress and weak spots by week (decoys picked, key ideas missed); case progress; Section C (strategy parts and Essay Coach self-marks); integrity flags; and every typed answer with its automatic check and mark. From the profile you can mark or re-mark an answer, **send a message** (it appears on the student's Home page; no XP), send a **PIN reset email**, or download the student's data as JSON.

Messages are stored in `reviews/{SID}.m` under keys starting `note_`. The site and the marking tools never treat them as marks.

## Files

| File | What it holds |
|---|---|
| `index.html` | The portal: sign-in, game engine, pages |
| `cases.js`, `case-cbtl.js`, `case-tuna.js` | One file per case: sections, exhibits, Boardroom arguments, practice questions |
| `bank-b.js` | Section B short-answer questions |
| `bank-c.js` | Section C strategy scenarios and essay scenarios |
| `cloud.js` | Firebase connection: PIN accounts, progress sync, live leaderboard, lecturer dashboard |
| `vendor/firebase.js` | The Firebase SDK, bundled so the site needs no CDN (rebuild: `sh tools/firebase/build.sh`) |
| `concepts.js` | Automatic concept check for typed answers |
| `CLAUDE.md`, `tools/marking/` | How Claude marks typed answers, and the fetch/apply scripts |
| `roster.js` | Scrambled class list |
| `leaderboard.js` | Leaderboard for device-only mode (the live board is in Firebase) |

## Firebase (accounts, sync, live leaderboard)

Project `mkt301-f8830` (Authentication: Email/Password; Firestore in `asia-south1`). The web config in `cloud.js` is public by design; the data is protected by the security rules.

- **Sign-in:** the account email is `<student id>@student.mnu.edu.mv`, the password is the student's PIN. **Forgot PIN?** sends a reset link to that inbox. The portal handles the link itself if Authentication → Templates → *Customize action URL* is set to `https://abdullamuizfuad.github.io/mkt301/`; otherwise Firebase's own page is used, which also works.
- **Data:** `users/<ID>` holds each student's progress (readable by the student and the lecturer only); `board/<ID>` holds the leaderboard row (readable by the class).
- **Each new term, update the security rules** (they contain the class list, so they are not committed):

  ```bash
  python3 tools/build-rules.py ClassList_MKT301_*.xls   # writes firestore.rules
  ```

  Paste `firestore.rules` into Firebase console → Firestore → Rules → **Publish**. Run `build-roster.py` too (below).
- **A student is locked out:** Firebase console → Authentication → Users → find `<id>@student.mnu.edu.mv` → ⋮ → *Reset password* or *Delete account* (they can then create a new PIN; their progress in Firestore is kept).

## Typed answers and marking

- **Automatic check** (`concepts.js`): a typed or spoken answer is checked against the question's key ideas (stemmed keywords, synonyms and a few hand-tuned patterns) and four structure points: definition, example, evaluation and recommendation. It gives a band from 0 to 6 and the XP: 10, plus 3 per key idea and 2 per structure point, up to 32. XP needs 40+ words and at least one key idea. Unit tests: `node tools/tests/concepts.js`.
- **Integrity:** pasting and dropping are blocked. Any single insertion over 15 words that isn't from the 🎤 button is removed. Answers entered faster than about 2 words a second earn no XP. Flags are stored with each answer and shown in the Flags column of the dashboard.
- **🎤 Speak:** uses the browser's speech-to-text (Chrome, Safari) where available.
- **Marking:** submitted answers wait in the **Marking** card on the Lecturer tab. The lecturer can mark them there, or ask Claude Code to mark the queue (`CLAUDE.md` describes how: `tools/marking/fetch.mjs` → `marks.json` → `tools/marking/apply.mjs`, signed in as S000001 with the `MKT301_LECTURER_PIN` secret). Marks live in `reviews/{SID}`. Students see the band, feedback and XP live, and marked XP stays if they restart the question.

## Update the leaderboard by hand (device-only fallback)

Only needed if Firebase is unavailable.

1. Students tap **Email my score** on the Leaderboard page.
2. Sign in as `S000001`, open **Lecturer**, paste all the score emails, then **Download leaderboard.js**.
3. Upload it here: **Add file → Upload files → Commit changes**.

## Student sign-in

Only IDs on the MKT301 class list can sign in. `roster.js` holds **scrambled IDs only** (SHA-256 hashes), never names or readable IDs. `S000001` is the lecturer test ID.

To update the class list, run from this folder:

```bash
python3 tools/build-roster.py ClassList_MKT301_*.xls
```

It also accepts a CSV with student IDs in the first column. Then commit and push `roster.js`.

**Never commit class lists or exam papers.** This repo is public.

## Tests

End-to-end tests cover sign-in, the tour, all three cases, every Section B question, every Section C scenario, restart and anti-farming rules, backup/restore, missions, the lecturer tools, layout at 320/390/1280px in both themes, and offline support.

```bash
npm i -D playwright && npx playwright install chromium   # once
node tools/tests/run.js              # all groups (starts its own local server)
node tools/tests/run.js --only=sectionB
```

Cloud tests run against the Firebase emulators (needs Java and `firebase-tools`) and the real rules file:

```bash
python3 tools/build-rules.py <class list>   # once, writes firestore.rules (git-ignored)
node tools/tests/firebase-run.js           # PIN accounts, sync, live board, dashboard, reset links, fallback
```
