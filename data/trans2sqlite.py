import os
import sqlite3
import glob

for f in glob.glob('*.txt'):
    conn = sqlite3.connect(f[:f.rfind('.')] + '.db')
    conn.execute('CREATE TABLE `data` (`text` TEXT NOT NULL);')
    conn.executemany("INSERT INTO data(rowid, text) VALUES (?, ?);", enumerate(list(open(f)), 1))
    conn.commit()
    conn.close()
