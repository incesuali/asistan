import { NextResponse } from 'next/server';
import { sql, initDatabase } from '@/lib/db';
import { del } from '@vercel/blob';

// GET /api/plans/attachments?planId=...
export async function GET(request: Request) {
  try {
    await initDatabase();
    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('planId');
    if (!planId) return NextResponse.json({ error: 'planId gerekli' }, { status: 400 });
    const result = await sql`SELECT id, plan_id as "planId", file_name as "fileName", file_url as "fileUrl", created_at as "createdAt" FROM plans_attachments WHERE plan_id=${planId} ORDER BY created_at DESC`;
    return NextResponse.json(result.rows);
  } catch (e:any) {
    return NextResponse.json({ error: 'Ekler getirilemedi' }, { status: 500 });
  }
}

// DELETE /api/plans/attachments?id=...
export async function DELETE(request: Request) {
  try {
    await initDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id gerekli' }, { status: 400 });

    // Önce kaydı bul, blob'u sil, sonra DB'den kaldır
    const result = await sql`SELECT file_url FROM plans_attachments WHERE id=${id}`;
    const row = result.rows?.[0];
    if (row && row.file_url) {
      try {
        const token = process.env.BLOB_READ_WRITE_TOKEN;
        await del(row.file_url, { token });
      } catch {}
    }
    await sql`DELETE FROM plans_attachments WHERE id=${id}`;
    return NextResponse.json({ success: true });
  } catch (e:any) {
    return NextResponse.json({ error: 'Ek silinemedi' }, { status: 500 });
  }
}



