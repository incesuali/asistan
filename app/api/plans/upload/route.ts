import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { initDatabase, sql } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    await initDatabase();
    const form = await request.formData();
    const planId = form.get('planId') as string | null;
    const file = form.get('file') as File | null;
    if (!planId || !file) {
      return NextResponse.json({ error: 'planId ve file gerekli' }, { status: 400 });
    }

    const blob = await put(`plans/${planId}/${Date.now()}-${file.name}`, file, { access: 'public' });
    const id = Date.now().toString();
    await sql`INSERT INTO plans_attachments (id, plan_id, file_name, file_url) VALUES (${id}, ${planId}, ${file.name}, ${blob.url})`;

    return NextResponse.json({ id, planId, fileName: file.name, fileUrl: blob.url, createdAt: new Date().toISOString() });
  } catch (e:any) {
    return NextResponse.json({ error: 'Yükleme başarısız' }, { status: 500 });
  }
}



