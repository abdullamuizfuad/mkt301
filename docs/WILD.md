# The weekly 6th-spot challenge

Every week the lecturer brings a gift for the top 5 students by **XP earned that week**. Everyone else gets one 20-minute attempt at a
stand-alone challenge, and the best score wins the **6th gift**. The code is `engine/wild.js` (shared engine); the questions come from
`bank-chips.js` (`wildPick`) and the course hooks in `course.js` (`wildTopicList`, `wildItems`, `wildItem`, `wildArea`).

| | MKT301 | MKT101 |
|---|---|---|
| Opens (top 5 locked, invites sent) | Monday 4:00 pm | Tuesday 4:00 pm |
| Closes (class starts) | Tuesday 4:00 pm | Wednesday 4:00 pm |
| Questions | 2 paragraph questions + 2 "which is NOT right?" per week (8) | 5 MCQs + 1 paragraph question per topic (12) |
| `CRS.wild` | `{day:2, hour:16}` | `{day:3, hour:16}` |

All times are GMT+5. The week's XP runs from the previous class start up to the opening (`U.xph`: XP per hour; days before it existed use `U.xpd`).
Only students with XP that week can be in the top 5; the lecturer never takes part.

## Opening it

The site has no server, so something signed in as the lecturer must open each week's challenge at the opening time:

- **The scheduled task** (preferred): `node tools/wild/open.mjs` a few minutes after the opening. It does nothing if the challenge is
  already open. Options: `--topics=10,11`, `--dry` (counts only), `--at=<ISO time>` (tests).
- **The site**: when the window is open and nothing has opened it, the lecturer's home, the Lecturer tab card (🎁 6th-spot challenge) and
  the live screen show **Open this week's challenge**.

Topics: the lecturer picks two on the Lecturer tab card before the opening. If none are saved, `CRS.wildPlan` (a week the lecturer has already
chosen, e.g. `'w2026-11-03':['10','11']`) is used, then the two weakest topics across the class (site) or the two most recent (script).

## During and after

- Students see the two topics with **📖 Refer to notes** before they start. The notes lock once the 20 minutes start; the clock keeps running
  if the app closes, and an unfinished attempt is handed in on the next visit.
- The lecturer's **live screen** (`#/wild/live`, also from the lecturer home) shows the countdown to class, live standings, the week's top 5
  and integrity flags (very fast, perfect in very little time, a score that does not match the answers).
- After the close, `node tools/wild/close.mjs` writes provisional results with flags (optional), and the lecturer checks the top answers and
  taps **Confirm** next to the winner. Everyone who took part is told; the winner gets +30 XP (`wildwin:<id>`), everyone who finished +20 (`wild:<id>`).

## Data and rules

- `wild/{id}` (id `w<class date>`): written only by the lecturer.
- `wild/{id}/e/{SID}`: the attempt. It is started only inside the window, never by the week's top 5 or the lecturer, and finished once within 30 minutes of the start, with every answer.
- `wild/{id}/s/{SID}`: the public score for the live table, which must match the attempt.

The `wild` rules blocks come from `tools/build-rules.py`. The cloud tests are `wild` and `wildTools` in `tools/tests/firebase.js`; the site tests are in `tools/tests/wild-site.js`.

## Scheduled tasks (Claude Code)

- MKT301: Mondays 4:05 pm GMT+5: `node tools/wild/open.mjs` in the mkt301 repo.
- MKT101: Tuesdays 4:05 pm GMT+5: `node tools/wild/open.mjs` in the mkt101-cases repo.
- Optional, after class: `node tools/wild/close.mjs`.
