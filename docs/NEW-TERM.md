# Starting a new term

Nothing is ever deleted. Students keep their progress, and a student who repeats the course finds their XP and badges still there. A new term needs a new class list and a fresh leaderboard.

1. **Back up** the current term: `node tools/backup/export.mjs`. It writes outside the repo; keep the file somewhere safe.
2. **Class list.** Export the participants CSV from Moodle. Then:
   - `python3 tools/build-roster.py <csv>`: the scrambled class list (`roster.js`) for device-only sign-in. Set the new term name inside it.
   - `python3 tools/build-rules.py <csv>`: the Firestore rules. Publish them (Firebase console → Firestore → Rules). Students who are no longer on the list can't sign in any more, and their data stays.
3. **Names.** On the Lecturer tab, paste the new CSV into **Class names** so the official names and sections (teams) are right.
4. **Leaderboard.** In `course-config.js`, set `termStart:'YYYY-MM-DD'` inside `CRS` (Maldives time). The leaderboard then shows only students who have practised since that day.
5. **Dates.** Update the dates that belong to the term:
   - `PAPER_AT` and `W14` in `engine/dash.js` (the practice paper unlock and week 14);
   - `EXAM_AT` and `EXAM_DAY` (the countdown on home);
   - the term weeks in `course-config.js`.

   `engine/` is shared, so run `node tools/sync-engine.mjs` afterwards.
6. **Check** with `node tools/tests/run.js`, then push to `main`.

Ask Claude: "start the new term for MKT301 with this class list". It follows these steps and asks you for the dates.
