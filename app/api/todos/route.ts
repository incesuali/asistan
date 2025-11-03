import { NextResponse } from 'next/server';
import { sql, initDatabase } from '@/lib/db';

// GET - Tüm yapılacakları getir
export async function GET() {
  try {
    await initDatabase();
    const result = await sql`SELECT id, content, created_at as "createdAt", due_at as "dueAt", completed FROM todos ORDER BY created_at DESC`;
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
    const { content, dueInHours } = await request.json();
    
    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Yapılacak içeriği gerekli' },
        { status: 400 }
      );
    }

    const id = Date.now().toString();
    const hours = Number(dueInHours);
    const dueAt = !isNaN(hours) && hours > 0 ? new Date(Date.now() + hours * 3600 * 1000).toISOString() : null;
    await sql`
      INSERT INTO todos (id, content, due_at, completed)
      VALUES (${id}, ${content.trim()}, ${dueAt}, false)
    `;

    return NextResponse.json({ id, content: content.trim(), dueAt, completed: false });
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
    const { id, content, dueAt, completed } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Yapılacak ID gerekli' },
        { status: 400 }
      );
    }

    if (content !== undefined) {
      await sql`
        UPDATE todos 
        SET content = ${content.trim()}
        WHERE id = ${id}
      `;
    }

    if (dueAt !== undefined) {
      await sql`
        UPDATE todos
        SET due_at = ${dueAt}
        WHERE id = ${id}
      `;
    }

    if (completed !== undefined) {
      await sql`
        UPDATE todos
        SET completed = ${completed}
        WHERE id = ${id}
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Todos PUT error:', error);
    return NextResponse.json(
      { error: 'Yapılacak güncellenemedi' },
      { status: 500 }
    );
  }
}

