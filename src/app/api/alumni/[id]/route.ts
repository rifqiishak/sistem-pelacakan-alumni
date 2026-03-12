import { NextResponse } from 'next/server';
import db, { initDb } from '@/lib/db';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDb();
    const id = (await params).id;
    
    // Karena kita memakai ON DELETE CASCADE, log di JejakBukti akan ikut terhapus otomatis jika alumniId merujuk kepadanya
    db.prepare('DELETE FROM Alumni WHERE id = ?').run(id);
    
    return NextResponse.json({ success: true, message: 'Alumni berhasil dihapus' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
