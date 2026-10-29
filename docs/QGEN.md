# New practice questions with Claude ("write new MKT301 practice questions")

Claude drafts the questions and the lecturer publishes them. Nothing reaches students until the lecturer presses **Publish** in the Question editor on the Lecturer tab.

## For Claude

1. Read the existing bank first, so the new questions match its style and don't repeat it: `bank-b.js` for MKT301 Section B short answers, or `bank-s.js` and `bank.js` for MKT101 short answers and MCQs.
2. Write practice questions only. Use new situations (Maldivian and regional businesses work well). **Never** reuse, paraphrase or hint at past or upcoming paper questions or cases. Never use the words exam, final (as in a paper), midterm or resit.
3. Write `tools/qgen/drafts.json` as a list of drafts, using the same fields as the editor's templates:
   - MKT301 `short`: `{"kind":"short","data":{"id":"b-g01","week":5,"topic":"…","skill":"…","q":"…","chips":[{"t":"…","g":1}, … ,{"t":"…","g":0,"why":"…"}],"checks":["…"]},"note":"why this question"}`
   - MKT101 `short`: `{"kind":"short","data":{"id":"s-g01","t":9,"topic":"…","marks":6,"q":"…","chips":[…],"checks":[…]}}`
   - MKT101 `mcq`: `{"kind":"mcq","data":{"id":"t9-g01","t":9,"b":"K","d":1,"q":"…","o":["correct","wrong","wrong","wrong"],"why":"…"}}`

   Each short answer needs 4–6 key ideas (`g: 1`): define, apply to the situation, example, and evaluate. Add 2 decoys (`g: 0`), each with a `why`. In an MCQ the correct option comes first; the site shuffles them.
4. Check the file, then upload it:
   ```bash
   node tools/qgen/upload.mjs --dry
   node tools/qgen/upload.mjs
   ```
   This uses the lecturer PIN secret, as marking does. Don't commit `drafts.json`, which is git-ignored.
5. Tell the lecturer how many drafts were uploaded, their topics, and that they are waiting under **Lecturer → Question editor → Drafts**.

## For the lecturer

- **Drafts** shows Claude's questions and your own unsaved work. Use **Edit** to change one, then **Publish**.
- **Live** questions reach students at their next sign-in. You can also change an existing question: type its ID, press **Load**, edit it, then **Publish**. The data files stay as they are, and the editor's version wins.
- **Hide this question** takes a question out for everyone. Publish it again to bring it back.
