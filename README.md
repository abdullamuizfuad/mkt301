# MKT301 International Marketing: Practice Portal

A gamified study and practice site for MKT301 International Marketing (MNU Business School). Students sign in with their student ID, work through case studies, short-answer and essay practice, and earn XP, badges and a place on the class leaderboard. All written answers are done on paper; the portal helps students plan, time and check them.

## What's in it

- **Section A · Cases:** ICETO Gelato, The Coffee Bean & Tea Leaf, and Kandu Bites (tuna jerky to Japan and Italy). Each has an extended case, exhibits, a Boardroom of competing arguments, and random sets of practice questions (plan with chips → timed writing on paper → self-check).
- **Section B · Short answers:** 56 practice questions tagged by week (3 angles on each key short-answer skill, plus questions from the other weeks). Random sets of 6, filter by week, plan with chips → 10-minute timer → self-check.
- **Section C · Strategy & essay:** 4 competitive-advantage scenarios in three parts (Five Forces sort, Diamond sort, Strategic Intent and Blue Ocean canvas, each with its own timer), and an Essay Coach with 4 expansion scenarios (mark bands, market scoring, order and entry modes, supply-chain builder, revenue and risk tools, an essay script, a 40-minute timer and self-marking).
- **Game:** XP, levels, badges, day streaks, a daily mission and a weekly leaderboard.

## Files

| File | What it holds |
|---|---|
| `index.html` | The portal: sign-in, game engine, pages |
| `cases.js`, `case-cbtl.js`, `case-tuna.js` | One file per case: sections, exhibits, Boardroom arguments, practice questions |
| `bank-b.js` | Section B short-answer questions |
| `bank-c.js` | Section C strategy scenarios and essay scenarios |
| `roster.js` | Scrambled class list |
| `leaderboard.js` | This week's leaderboard |

## Update the leaderboard (weekly)

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
