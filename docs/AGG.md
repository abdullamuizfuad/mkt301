# Class figures (meta/agg)

The fun features show three class-wide figures. Students never read each other's progress, so the lecturer works these out and stores
them in `meta/agg`, which every class member can read:

- **Class goal**: practice answers by the whole class this week (Monday to Sunday, Maldives time) against a weekly target.
  The target is set on the Lecturer tab (🎯 Class goal and class figures, stored in `meta/goal`), or `CRS.fun.goal` by default.
  When the goal is reached, everyone who answered at least one question that week gets +20 XP and the Class goal badge.
- **Most improved**: last full week's accuracy against the week before, for students with 20+ answers in both weeks. The top 3 get +20 XP
  and the Most improved badge.
- **Topic territories**: each team's average accuracy per topic (students with 5+ tries in it, 2+ students a team). Teams are the class
  sections from the class list; when there are none (MKT101), the tutorial session each student joined most recently (Session 1, 2 …).

The calculation is `engine/agg.js` (`aggCompute`), used by both the Lecturer tab button and the script:

```bash
node tools/agg/run.mjs          # work them out and write meta/agg
node tools/agg/run.mjs --dry    # print the counts only
```

The script signs in as the lecturer with the PIN secret (`MKT101_LECTURER_PIN` / `MKT301_LECTURER_PIN`, like marking) and prints counts only.

**Suggested schedule:** every 4 hours, plus Monday 00:15 (GMT+5) so last week's most improved and the new week's goal start promptly,
e.g. a scheduled task that runs `node tools/agg/run.mjs` in each repo at 00:15, 08:15, 12:15, 16:15 and 20:15 GMT+5.
