# MKT301 International Marketing: Practice Portal

A gamified study and practice site for MKT301 International Marketing (MNU Business School). Students sign in with their student ID, work through case studies, short-answer and essay practice, and earn XP, badges and a place on the class leaderboard. All written answers are done on paper; the portal helps students plan, time and check them.

Work in progress.

## Student sign-in

Only IDs on the MKT301 class list can sign in. `roster.js` holds **scrambled IDs only** (SHA-256 hashes), never names or readable IDs. `S000001` is the lecturer test ID.

To update the class list, run from this folder:

```bash
python3 tools/build-roster.py ClassList_MKT301_*.xls
```

It also accepts a CSV with student IDs in the first column. Then commit and push `roster.js`.

**Never commit class lists or exam papers.** This repo is public.
