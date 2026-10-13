import sqlite3
import json
import sys

def export_db(db_path):
    con = sqlite3.connect(db_path)
    con.row_factory = sqlite3.Row
    cur = con.cursor()

    tables = [r[0] for r in cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").fetchall()]

    data = {}
    for t in tables:
        rows = cur.execute(f'SELECT * FROM "{t}"').fetchall()
        data[t] = [dict(r) for r in rows]

    return data

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python3 export-sqlite.py <path_to_db>", file=sys.stderr)
        sys.exit(1)

    db_path = sys.argv[1]
    result = export_db(db_path)
    print(json.dumps(result))
