import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
    
    const logs = db.prepare('SELECT * FROM JejakBukti WHERE alumniId = ? ORDER BY confidenceScore DESC').all(id);
    
    // Mapping keys from DB names to response format the UI expects based on the reference code
    const formattedLogs = logs.map((l: any) => ({
      id: l.id,
      confidence_score: l.confidenceScore,
      keterangan: l.ringkasanInfo,
      tautan_bukti: l.pointerBukti,
      sumber: l.sumberTemuan,
      waktu_pelacakan: l.tanggalDitemukan
    }));

    return NextResponse.json(formattedLogs);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
