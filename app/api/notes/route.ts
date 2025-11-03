import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { initDatabase } from '@/lib/db';

// GET - Tüm notları getir
export async function GET() {
  try {
    await initDatabase();
    const result = await sql`SELECT * FROM notes ORDER BY created_at DESC`;
    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error('Notes GET error:', error);
    return NextResponse.json(
      { error: 'Notlar yüklenemedi' },
      { status: 500 }
    );
  }
}

// POST - Yeni not ekle
export async function POST(request: Request) {
  try {
    await initDatabase();
    const { content } = await request.json();
    
    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Not içeriği gerekli' },
        { status: 400 }
      );
    }

    const id = Date.now().toString();
    await sql`
      INSERT INTO notes (id, content)
      VALUES (${id}, ${content.trim()})
    `;

    return NextResponse.json({ id, content: content.trim() });
  } catch (error: any) {
    console.error('Notes POST error:', error);
    return NextResponse.json(
      { error: 'Not eklenemedi' },
      { status: 500 }
    );
  }
}

// DELETE - Not sil
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Not ID gerekli' },
        { status: 400 }
      );
    }

    await sql`DELETE FROM notes WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Notes DELETE error:', error);
    return NextResponse.json(
      { error: 'Not silinemedi' },
      { status: 500 }
    );
  }
}

// PUT - Not güncelle
export async function PUT(request: Request) {
  try {
    const { id, content } = await request.json();

    if (!id || !content || !content.trim()) {
      return NextResponse.json(
        { error: 'Not ID ve içerik gerekli' },
        { status: 400 }
      );
    }

    await sql`
      UPDATE notes 
      SET content = ${content.trim()}
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Notes PUT error:', error);
    return NextResponse.json(
      { error: 'Not güncellenemedi' },
      { status: 500 }
    );
  }
}

