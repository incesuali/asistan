import { NextResponse } from 'next/server';
import { sql, initDatabase } from '@/lib/db';

// GET - Tüm yapılacakları getir
export async function GET() {
  try {
    await initDatabase();
    const result = await sql`SELECT * FROM todos ORDER BY created_at DESC`;
    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error('Todos GET error:', error);
    return NextResponse.json(
      { error: 'Yapılacaklar yüklenemedi' },
      { status: 500 }
    );
  }
}

// POST - Yeni yapılacak ekle
export async function POST(request: Request) {
  try {
    await initDatabase();
    const { content } = await request.json();
    
    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Yapılacak içeriği gerekli' },
        { status: 400 }
      );
    }

    const id = Date.now().toString();
    await sql`
      INSERT INTO todos (id, content)
      VALUES (${id}, ${content.trim()})
    `;

    return NextResponse.json({ id, content: content.trim() });
  } catch (error: any) {
    console.error('Todos POST error:', error);
    return NextResponse.json(
      { error: 'Yapılacak eklenemedi' },
      { status: 500 }
    );
  }
}

// DELETE - Yapılacak sil
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Yapılacak ID gerekli' },
        { status: 400 }
      );
    }

    await sql`DELETE FROM todos WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Todos DELETE error:', error);
    return NextResponse.json(
      { error: 'Yapılacak silinemedi' },
      { status: 500 }
    );
  }
}

// PUT - Yapılacak güncelle
export async function PUT(request: Request) {
  try {
    const { id, content } = await request.json();

    if (!id || !content || !content.trim()) {
      return NextResponse.json(
        { error: 'Yapılacak ID ve içerik gerekli' },
        { status: 400 }
      );
    }

    await sql`
      UPDATE todos 
      SET content = ${content.trim()}
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Todos PUT error:', error);
    return NextResponse.json(
      { error: 'Yapılacak güncellenemedi' },
      { status: 500 }
    );
  }
}

