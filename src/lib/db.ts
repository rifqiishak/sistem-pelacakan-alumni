import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'dev.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

db.exec(`
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

export default db;
