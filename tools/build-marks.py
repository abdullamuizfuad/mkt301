#!/usr/bin/env python3
"""Read the lecturer's MKT301 coursework marks workbook and write a PRIVATE JSON file for tools/marks/upload.mjs.

    python3 tools/build-marks.py <coursework marks .xlsx> -o <private marks .json, outside the repo>
    node tools/marks/upload.mjs <private marks .json> --dry      (check)
    node tools/marks/upload.mjs <private marks .json>            (publish to each student)

Sheet "Class Marks": the header row is the one that starts with "#"; columns are found by their header text (so a moved
column can't shift the marks): Student Name, Group, Market, Report /100, Report (25%), Presentation /50, Presentation (15%),
Coursework /40, Min final for PP/CR/DN/HD (/100) (a number or "Not reachable"), Student ID (000-085-412 → S085412), Status
("Submitted", "Exempt (exam only)", "No group submission"). Computed values are read, not formulas.

Privacy: nothing from the workbook goes into the repo. Each student's record goes to their own reviews/{SID} document
(key cm_<term>), which only that student and the lecturer can read. Keep the JSON outside the repo; never commit the workbook.
"""
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

def num(v): return round(float(v), 2) if isinstance(v, (int, float)) else None
def fin(v): return num(v) if isinstance(v, (int, float)) else ("NR" if str(v or "").strip().lower() == "not reachable" else None)

def main(argv):
    try: import openpyxl
    except ImportError: sys.exit("Needs: pip install openpyxl")
    if "-o" not in argv: sys.exit(__doc__)
    i = argv.index("-o"); out = Path(argv[i + 1]); argv = argv[:i] + argv[i + 2:]
    if ROOT in out.resolve().parents: sys.exit("✗ Write the JSON outside the repo (it holds names and marks).")
    ws = openpyxl.load_workbook(argv[0], data_only=True)["Class Marks"]
    hr = next(r for r in range(1, 40) if ws.cell(r, 1).value == "#")
    H = {str(ws.cell(hr, c).value or "").strip(): c for c in range(1, ws.max_column + 1)}
    need = ["Student Name", "Group", "Market", "Report /100", "Report (25%)", "Presentation /50", "Presentation (15%)", "Coursework /40",
            "Min final for PP (/100)", "Min final for CR (/100)", "Min final for DN (/100)", "Min final for HD (/100)", "Student ID", "Status"]
    miss = [h for h in need if h not in H]
    if miss: sys.exit("✗ Missing columns: " + ", ".join(miss))
    g = lambda r, h: ws.cell(r, H[h]).value
    recs, skipped = {}, []
    for r in range(hr + 1, ws.max_row + 1):
        name, rid = g(r, "Student Name"), str(g(r, "Student ID") or "").strip()
        if not name and not rid: continue
        m = re.fullmatch(r"000-(\d{3})-(\d{3})", rid)
        if not m: skipped.append((r, rid)); continue
        st = str(g(r, "Status") or "").strip()
        recs["S" + m.group(1) + m.group(2)] = {"n": str(name or "").strip(), "g": g(r, "Group"), "mk": g(r, "Market") or "",
            "rp": num(g(r, "Report (25%)")), "pr": num(g(r, "Presentation (15%)")), "rpRaw": num(g(r, "Report /100")), "prRaw": num(g(r, "Presentation /50")),
            "tot": num(g(r, "Coursework /40")) or 0, "pass": fin(g(r, "Min final for PP (/100)")), "cr": fin(g(r, "Min final for CR (/100)")),
            "dn": fin(g(r, "Min final for DN (/100)")), "hd": fin(g(r, "Min final for HD (/100)")), "st": st,
            "ex": 1 if st.lower().startswith("exempt") else 0, "nog": 1 if st.lower().startswith("no group") else 0}
    out.write_text(json.dumps({"term": "T2 2026", "key": "cm_t2_2026", "recs": recs}, indent=1), encoding="utf-8")
    out.chmod(0o600)
    print(f"✓ {out}: {len(recs)} students (private: names and marks)")
    for r, rid in skipped: print(f"⚠ row {r}: student ID {rid!r} is not in the 000-085-412 format, skipped")

if __name__ == "__main__":
    main(sys.argv[1:])
