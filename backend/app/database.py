import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path

DB_PATH = Path(os.getenv('CASFETA_DB_PATH', str(Path(__file__).resolve().parent.parent / 'casfeta.db')))

def init_db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute('''CREATE TABLE IF NOT EXISTS reports (
          id TEXT PRIMARY KEY, title TEXT NOT NULL, created_at TEXT NOT NULL,
          score INTEGER NOT NULL, level TEXT NOT NULL, engine TEXT NOT NULL,
          result_json TEXT NOT NULL)''')
        conn.commit()

@contextmanager
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()
