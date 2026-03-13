import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const alumni = db.prepare('SELECT * FROM Alumni ORDER BY createdAt DESC').all();
    const stats = {
      total: alumni.length,
      ditemukan: alumni.filter((a: any) => a.status === 'Teridentifikasi dari sumber publik').length,
      verifikasi: alumni.filter((a: any) => a.status === 'Perlu Verifikasi Manual').length,
      belumDilacak: alumni.filter((a: any) => a.status === 'Belum Dilacak').length
    };
    return NextResponse.json({ sukses: true, data: alumni, stats });
  } catch (error: any) {
    return NextResponse.json({ sukses: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const stmt = db.prepare(`
      INSERT INTO Alumni (namaLengkap, kampus, prodi, tahunLulus, kotaAsal)
      VALUES (?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      body.namaLengkap,
      body.kampus,
      body.prodi,
      body.tahunLulus || '',
      body.kotaAsal || ''
    );
    return NextResponse.json({ sukses: true, id: info.lastInsertRowid });
  } catch (error: any) {
    return NextResponse.json({ sukses: false, error: String(error) }, { status: 500 });
  }
}
