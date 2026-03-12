// @ts-nocheck
import initSqlJs from 'sql.js';
import path from 'path';
import fs from 'fs';

const isVercel = process.env.VERCEL === '1';
const dbPath = isVercel
  ? path.join('/tmp', 'dev.db')
  : path.join(process.cwd(), 'dev.db');

let _db: any = null;

function getDb(): any {
  if (_db) return _db;
  throw new Error('Database not initialized. Call initDb() first.');
}

async function initDb(): Promise<any> {
  if (_db) return _db;

  const SQL = await initSqlJs();

  // Load existing database if exists
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    _db = new SQL.Database(buffer);
  } else {
    _db = new SQL.Database();
  }

  // Enable FK
  _db.run('PRAGMA foreign_keys = ON;');

  // Initialize Tables
  _db.run(`
    CREATE TABLE IF NOT EXISTS Alumni (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      namaLengkap TEXT NOT NULL,
      kampus TEXT NOT NULL,
      prodi TEXT NOT NULL,
      tahunLulus TEXT NOT NULL,
      kotaAsal TEXT,
      status TEXT DEFAULT 'Belum Dilacak',
      ringkasanAktivitas TEXT,
      tanggalPembaruan DATETIME,
      lastUpdateSearch DATETIME DEFAULT CURRENT_TIMESTAMP,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  _db.run(`
    CREATE TABLE IF NOT EXISTS JejakBukti (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      alumniId INTEGER NOT NULL,
      sumberTemuan TEXT NOT NULL,
      ringkasanInfo TEXT NOT NULL,
      confidenceScore INTEGER NOT NULL,
      pointerBukti TEXT NOT NULL,
      tanggalDitemukan DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(alumniId) REFERENCES Alumni(id) ON DELETE CASCADE
    );
  `);

  saveDb();
  return _db;
}

function saveDb() {
  if (!_db) return;
  try {
    const data = _db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  } catch (e) {
    console.error('Failed to save DB:', e);
  }
}

// Wrapper that mimics better-sqlite3 API
const db = {
  prepare(sql: string) {
    return {
      all(...params: any[]) {
        const database = getDb();
        const stmt = database.prepare(sql);
        if (params.length > 0) stmt.bind(params);
        const results: any[] = [];
        const columns = stmt.getColumnNames();
        while (stmt.step()) {
          const row: any = {};
          const values = stmt.get();
          columns.forEach((col, i) => { row[col] = values[i]; });
          results.push(row);
        }
        stmt.free();
        return results;
      },
      run(...params: any[]) {
        const database = getDb();
        database.run(sql, params);
        saveDb();
        // Return info similar to better-sqlite3
        const lastId = database.exec("SELECT last_insert_rowid() as id");
        const changes = database.exec("SELECT changes() as c");
        return {
          lastInsertRowid: lastId.length > 0 ? lastId[0].values[0][0] : 0,
          changes: changes.length > 0 ? changes[0].values[0][0] : 0,
        };
      },
      get(...params: any[]) {
        const database = getDb();
        const stmt = database.prepare(sql);
        if (params.length > 0) stmt.bind(params);
        const columns = stmt.getColumnNames();
        if (stmt.step()) {
          const row: any = {};
          const values = stmt.get();
          columns.forEach((col, i) => { row[col] = values[i]; });
          stmt.free();
          return row;
        }
        stmt.free();
        return undefined;
      },
    };
  },
  exec(sql: string) {
    const database = getDb();
    database.run(sql);
    saveDb();
  },
  pragma(p: string) {
    const database = getDb();
    database.run(`PRAGMA ${p}`);
  },
};

export { initDb };
export default db;
