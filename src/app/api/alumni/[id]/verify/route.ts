import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
    const { status_baru, validLogIds } = await request.json();

    if (status_baru === 'Teridentifikasi' && (!validLogIds || validLogIds.length === 0)) {
      return NextResponse.json({ success: false, error: "Pilih setidaknya satu rekam jejak yang valid." }, { status: 400 });
    }

    db.prepare("UPDATE Alumni SET status = 'Teridentifikasi dari sumber publik', tanggalPembaruan = CURRENT_TIMESTAMP WHERE id = ?").run(id);

    return NextResponse.json({ success: true, message: `Status alumni berhasil diperbarui menjadi ${status_baru}` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
