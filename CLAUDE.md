# MKT301 Arena: notes for Claude

A static practice portal (GitHub Pages) for MKT301 International Marketing at MNU, with Firebase for accounts, sync, the live leaderboard and marking. Read `README.md` for the layout of the code.

## Marking typed answers ("mark the MKT301 answers")

Students can type (or speak) answers to practice questions. Each submitted answer is stored in their progress and waits in a marking queue. When the lecturer asks you to mark them:

1. **Fetch** the unmarked answers:
   ```bash
   node tools/marking/fetch.mjs
   ```
   It signs in as the lecturer (`S000001`) with the `MKT301_LECTURER_PIN` environment secret and writes `tools/marking/pending.json`. If the secret is missing, stop and tell the lecturer how to add it (see "Setup" below). Never ask for the PIN in chat, and never print or store it.

2. **Read** `tools/marking/pending.json`. Each item has the question, its key ideas (what a strong answer covers), common mistakes, the 0–6 rubric, the student's answer, the automatic check's result and integrity flags.

3. **Mark** each answer against the key ideas and the rubric:
   - **band**: 0–6, using the rubric in the item. Judge the meaning, not keywords; credit ideas written in the student's own words. A strong answer applies ideas to the case or example and evaluates; a list of terms is band 1–2.
   - **xp**: `band × 4`, plus 2 if every key idea is present (max 30).
   - **fb**: plain, friendly English, at most 3 sentences: one strength, the most important missing point, one tip. Speak to the student ("You explained…"). Never mention exams, finals or resits. No marks out of 20, no grades.
   - Integrity flags (`pastesBlocked`, `tooFast`, and the older `bigInsertionsRemoved`) or text that looks pasted or AI-written: **flag it in your report, do not punish it** in the mark or feedback.
   - `largeInsertsKept` (with `events[].snippet`, `inputType`, `composing`) is **informational**: it is usually the phone keyboard's voice typing, which students are encouraged to use. Never penalise it and don't mention it to the student. Mention it in your report only if the snippet itself looks copied (e.g. polished text unrelated to the student's other writing, references or formatting from a website or AI tool).

4. **Write** the marks to `tools/marking/marks.json` as an array:
   ```json
   [{"key":"b10_lx3k2a","sid":"S081441","q":"b10","band":5,"xp":22,"fb":"…"}]
   ```
   Copy `key`, `sid` and `q` exactly from `pending.json`. Never write keys starting `note_`: those are the lecturer's messages to students, not marks. Check with `node tools/marking/apply.mjs --dry`.

5. **Apply**:
   ```bash
   node tools/marking/apply.mjs
   ```
   Marks go to Firebase (`reviews/{SID}`); students see the band, feedback and XP straight away. Applied items leave `pending.json`.

6. **Report** to the lecturer: how many answers you marked, the average band, the topics where answers were weakest, and the keys of any answers you flagged (with the reason). Don't commit anything from `tools/marking/` (the working files are git-ignored).

**Privacy:** student answers are personal data. Don't paste full answers or names into chat; summarise. Refer to students by ID only when flagging. Don't copy answers anywhere outside `tools/marking/`.

If there is a lot to mark, work in batches of about 20: write `marks.json`, apply, then continue with the rest.

## New practice questions ("write new MKT301 practice questions")

Follow `docs/QGEN.md`: draft them in `tools/qgen/drafts.json`, check and upload them with `node tools/qgen/upload.mjs`, and the lecturer publishes them from the Question editor. Practice questions only, never anything from a paper.

## Setup (once, by the lecturer)

1. Sign in to the live site as `S000001` and create the lecturer PIN.
2. In the Claude Code cloud environment's settings, add an environment secret named `MKT301_LECTURER_PIN` with that PIN.
3. Publish the current Firestore rules (`python3 tools/build-rules.py <class list>`, then Firebase console → Firestore → Rules → Publish). Marking needs the `reviews` rules.

The lecturer can also mark or change any mark by hand on the Lecturer tab (Marking card). Those marks show as "by: lecturer". `fetch.mjs` only collects answers with no mark yet, so Claude never overwrites a mark the lecturer has given.

## Other conventions

- No exam questions, exam scenarios or the word "exam" anywhere students can see.
- **One shared engine.** `engine/` (core.js, boot.js, cloud.js, concepts.js, install.js, coverage.js, presence.js, engine.css) is byte-identical in MKT101 and MKT301. Build every feature once in the engine; course differences go in `course-config.js` (the `CRS` settings), `course.js` (course pages, data hooks and `ROUTES`) and `course.css`. After changing `engine/`, run `node tools/sync-engine.mjs` (copies it to the other repo and refreshes `engine/MANIFEST`); the `engine` test fails if the two drift. See `docs/NIGHT-BUILD.md` for the load order and hooks.
- **The one exception to the no-exam-wording rule** (the lecturer's decision): home shows the date, time and a countdown to 14 Dec 2026, 9:00 am (GMT+5, both courses). Date, time and countdown only, nothing else about it. All dates and times on the site are GMT+5 (Maldives).
- **Data changes are additive.** Never remove or rewrite existing progress fields; migrations must be idempotent. Back up Firestore (`node tools/backup/export.mjs`, written outside the repo) before every push to main.
- XP always goes through `award()` / `countOnce()` with stable keys so Restart and anti-farming keep working.
- Screen time, break reminders and live sessions live in `engine/presence.js`. Its XP keys are `stgoal:<day>`, `stblock:<day>:<n>` and `sessfocus:<sessionId>`. Never weaken the idle rule (2 minutes) or the 6-block daily cap. Live sessions need the `sessions` rules blocks from `tools/build-rules.py`.
- Tests: `node tools/tests/run.js` (site) and `RULES=<path to firestore.rules> node tools/tests/firebase-run.js` (cloud, against the Firebase emulators).
