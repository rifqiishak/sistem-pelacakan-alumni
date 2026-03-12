// @ts-nocheck
const isVercel = process.env.VERCEL === '1';

// In-Memory Database (Mock SQLite)
const memoryDb = {
  Alumni: [],
  JejakBukti: [],
  alumniAutoInc: 1,
  jejakAutoInc: 1
};

async function initDb(): Promise<any> {
    // No-op for memory DB
    return true;
}

// Wrapper that mimics better-sqlite3 API
const db = {
  prepare(sql: string) {
    const normalizedSql = sql.trim().toUpperCase();
    
    return {
      all(...params: any[]) {
        if (normalizedSql.includes('SELECT * FROM ALUMNI ORDER BY CREATEDAT DESC')) {
            return [...memoryDb.Alumni].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        if (normalizedSql.includes("SELECT * FROM ALUMNI WHERE STATUS = 'BELUM DILACAK'")) {
            return memoryDb.Alumni.filter(a => a.status === 'Belum Dilacak');
        }
        if (normalizedSql.includes('SELECT * FROM JEJAKBUKTI WHERE ALUMNIID = ?')) {
            const id = params[0];
            return memoryDb.JejakBukti.filter(j => j.alumniId === parseInt(id)).sort((a,b) => b.confidenceScore - a.confidenceScore);
        }
        return [];
      },
      run(...params: any[]) {
        if (normalizedSql.includes('INSERT INTO ALUMNI')) {
            const [namaLengkap, kampus, prodi, tahunLulus, kotaAsal] = params;
            const newId = memoryDb.alumniAutoInc++;
            memoryDb.Alumni.push({
                id: newId,
                namaLengkap,
                kampus,
                prodi,
                tahunLulus,
                kotaAsal,
                status: 'Belum Dilacak',
                ringkasanAktivitas: null,
                tanggalPembaruan: new Date().toISOString(),
                lastUpdateSearch: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            this.lastInsertRowid = newId;
            return { lastInsertRowid: newId, changes: 1 };
        }
        
        if (normalizedSql.includes('INSERT INTO JEJAKBUKTI')) {
            const [alumniId, sumberTemuan, ringkasanInfo, confidenceScore, pointerBukti] = params;
            const newId = memoryDb.jejakAutoInc++;
            memoryDb.JejakBukti.push({
                id: newId,
                alumniId: parseInt(alumniId),
                sumberTemuan,
                ringkasanInfo,
                confidenceScore,
                pointerBukti,
                tanggalDitemukan: new Date().toISOString()
            });
            this.lastInsertRowid = newId;
            return { lastInsertRowid: newId, changes: 1 };
        }

        if (normalizedSql.includes("UPDATE ALUMNI SET STATUS = 'TERIDENTIFIKASI DARI SUMBER PUBLIK'")) {
            const id = params[0];
            const p = memoryDb.Alumni.find(a => a.id === parseInt(id));
            if (p) {
                p.status = 'Teridentifikasi dari sumber publik';
                p.tanggalPembaruan = new Date().toISOString();
            }
            return { changes: p ? 1 : 0 };
        }

        if (normalizedSql.includes("UPDATE ALUMNI SET STATUS =")) {
           if (normalizedSql.includes('RINGKASANAKTIVITAS')) {
               const [status, ringkasan, tahunLulus, id] = params;
               const p = memoryDb.Alumni.find(a => a.id === parseInt(id));
               if (p) {
                   p.status = status;
                   p.ringkasanAktivitas = ringkasan;
                   p.tahunLulus = tahunLulus;
                   p.tanggalPembaruan = new Date().toISOString();
               }
           } else {
               // Update status only (track route not found)
               const [status, id] = params;
               const p = memoryDb.Alumni.find(a => a.id === parseInt(id));
               if (p) {
                   p.status = status;
                   p.tanggalPembaruan = new Date().toISOString();
               }
           }
           return { changes: 1 };
        }

        if (normalizedSql.includes('DELETE FROM ALUMNI WHERE ID = ?')) {
            const id = parseInt(params[0]);
            memoryDb.Alumni = memoryDb.Alumni.filter(a => a.id !== id);
            memoryDb.JejakBukti = memoryDb.JejakBukti.filter(j => j.alumniId !== id);
            return { changes: 1 };
        }
        
        if (normalizedSql.includes('DELETE FROM JEJAKBUKTI WHERE ID = ?')) {
            const id = parseInt(params[0]);
            memoryDb.JejakBukti = memoryDb.JejakBukti.filter(j => j.id !== id);
            return { changes: 1 };
        }

        return { changes: 0, lastInsertRowid: 0 };
      },
      get(...params: any[]) {
          return undefined; // We didn't use .get() in our routes
      },
    };
  },
  exec(sql: string) {
    // No-op
  },
  pragma(p: string) {
    // No-op
  },
};

export { initDb };
export default db;
