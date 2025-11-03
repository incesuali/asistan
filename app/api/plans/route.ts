import { NextResponse } from 'next/server';
import { sql, initDatabase } from '@/lib/db';

// GET - tüm planlar
export async function GET() {
  try {
    await initDatabase();
    const result = await sql`SELECT id, title, content, created_at as "createdAt", updated_at as "updatedAt" FROM plans ORDER BY updated_at DESC`;
    return NextResponse.json(result.rows);
  } catch (error: any) {
    return NextResponse.json({ error: 'Planlar yüklenemedi' }, { status: 500 });
  }
}

// POST - yeni plan
export async function POST(request: Request) {
  try {
    await initDatabase();
    const { title, content } = await request.json();
    if (!title || !title.trim() || !content || !content.trim()) {
      return NextResponse.json({ error: 'Başlık ve içerik gerekli' }, { status: 400 });
    }
    const id = Date.now().toString();
    await sql`INSERT INTO plans (id, title, content) VALUES (${id}, ${title.trim()}, ${content.trim()})`;
    return NextResponse.json({ id, title: title.trim(), content: content.trim(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  } catch (error: any) {
    return NextResponse.json({ error: 'Plan eklenemedi' }, { status: 500 });
  }
}

// PUT - güncelle
export async function PUT(request: Request) {
  try {
    const { id, title, content } = await request.json();
    if (!id) return NextResponse.json({ error: 'Plan ID gerekli' }, { status: 400 });
    if (title !== undefined) {
      await sql`UPDATE plans SET title = ${title.trim()}, updated_at = CURRENT_TIMESTAMP WHERE id = ${id}`;
    }
    if (content !== undefined) {
      await sql`UPDATE plans SET content = ${content.trim()}, updated_at = CURRENT_TIMESTAMP WHERE id = ${id}`;
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Plan güncellenemedi' }, { status: 500 });
  }
}

// DELETE - sil
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Plan ID gerekli' }, { status: 400 });
    await sql`DELETE FROM plans WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Plan silinemedi' }, { status: 500 });
  }
}


