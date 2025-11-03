import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { initDatabase } from '@/lib/db';

// GET - Tüm hatırlatmaları getir
export async function GET() {
  try {
    await initDatabase();
    const result = await sql`
      SELECT 
        id,
        content,
        reminder_date_time as "reminderDateTime",
        completed,
        created_at as "createdAt"
      FROM reminders 
      ORDER BY created_at DESC
    `;
    
    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error('Reminders GET error:', error);
    return NextResponse.json(
      { error: 'Hatırlatmalar yüklenemedi' },
      { status: 500 }
    );
  }
}

// POST - Yeni hatırlatma ekle
export async function POST(request: Request) {
  try {
    await initDatabase();
    const { content, reminderDateTime } = await request.json();
    
    if (!content || !content.trim() || !reminderDateTime) {
      return NextResponse.json(
        { error: 'Hatırlatma içeriği ve tarih gerekli' },
        { status: 400 }
      );
    }

    const id = Date.now().toString();
    await sql`
      INSERT INTO reminders (id, content, reminder_date_time, completed)
      VALUES (${id}, ${content.trim()}, ${reminderDateTime}, false)
    `;

    return NextResponse.json({ 
      id, 
      content: content.trim(), 
      reminderDateTime,
      completed: false,
      createdAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Reminders POST error:', error);
    return NextResponse.json(
      { error: 'Hatırlatma eklenemedi' },
      { status: 500 }
    );
  }
}

// DELETE - Hatırlatma sil
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Hatırlatma ID gerekli' },
        { status: 400 }
      );
    }

    await sql`DELETE FROM reminders WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Reminders DELETE error:', error);
    return NextResponse.json(
      { error: 'Hatırlatma silinemedi' },
      { status: 500 }
    );
  }
}

// PUT - Hatırlatma güncelle
export async function PUT(request: Request) {
  try {
    const { id, content, reminderDateTime, completed } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Hatırlatma ID gerekli' },
        { status: 400 }
      );
    }

    if (content !== undefined) {
      await sql`
        UPDATE reminders 
        SET content = ${content.trim()},
            reminder_date_time = ${reminderDateTime}
        WHERE id = ${id}
      `;
    }

    if (completed !== undefined) {
      await sql`
        UPDATE reminders 
        SET completed = ${completed}
        WHERE id = ${id}
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Reminders PUT error:', error);
    return NextResponse.json(
      { error: 'Hatırlatma güncellenemedi' },
      { status: 500 }
    );
  }
}

