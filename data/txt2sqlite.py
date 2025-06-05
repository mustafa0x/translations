import os
import sys
import json
import sqlite3
import io

cols = ['imlaaiee_clean', 'transliteration', 'imlaaiee', 'uthmani', 'mushaf_font']
schema = 'CREATE TABLE `ayahs` (%s);' % (','.join([('`%s` TEXT NOT NULL' % c) for c in cols]))

conn = sqlite3.connect('ayahs.db')
conn.execute(schema)

files = {}
for c in cols:
    files[c] = io.open(c.replace('_', '-') + '.txt', encoding='utf-8').readlines()

vals = []
for i in range(1, 6237):
    vals.append([i] + [files[c][i-1].strip() for c in cols])

cols_ins = ','.join([("'%s'" % c) for c in cols])
conn.executemany("INSERT INTO ayahs(rowid, %s) VALUES (%s);" % (cols_ins, ('?,' * len(vals[0]))[:-1]), vals)

conn.commit()
conn.close()
