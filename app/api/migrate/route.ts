import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { initDatabase } from '@/lib/db';

// LocalStorage verilerini veritabanına taşıma endpoint'i
export async function POST(request: Request) {
  try {
    await initDatabase();
    
    const { notes, todos, reminders } = await request.json();
    
    const results = {
      notes: 0,
      todos: 0,
      reminders: 0,
      errors: [] as string[],
    };

    // Notes migrate
    if (notes && Array.isArray(notes)) {
      for (const note of notes) {
        try {
          await sql`
            INSERT INTO notes (id, content, created_at)
            VALUES (${note.id}, ${note.content}, ${note.createdAt || new Date().toISOString()})
            ON CONFLICT (id) DO NOTHING
          `;
          results.notes++;
        } catch (error: any) {
          results.errors.push(`Note ${note.id}: ${error.message}`);
        }
      }
    }

    // Todos migrate
    if (todos && Array.isArray(todos)) {
      for (const todo of todos) {
        try {
          await sql`
            INSERT INTO todos (id, content, created_at)
            VALUES (${todo.id}, ${todo.content}, ${todo.createdAt || new Date().toISOString()})
            ON CONFLICT (id) DO NOTHING
          `;
          results.todos++;
        } catch (error: any) {
          results.errors.push(`Todo ${todo.id}: ${error.message}`);
        }
      }
    }

    // Reminders migrate
    if (reminders && Array.isArray(reminders)) {
      for (const reminder of reminders) {
        try {
          const reminderDateTime = reminder.reminderDateTime || reminder.createdAt || new Date().toISOString();
          await sql`
            INSERT INTO reminders (id, content, reminder_date_time, completed, created_at)
            VALUES (
              ${reminder.id}, 
              ${reminder.content}, 
              ${reminderDateTime},
              ${reminder.completed ?? false},
              ${reminder.createdAt || new Date().toISOString()}
            )
            ON CONFLICT (id) DO NOTHING
          `;
          results.reminders++;
        } catch (error: any) {
          results.errors.push(`Reminder ${reminder.id}: ${error.message}`);
        }
      }
    }

    return NextResponse.json({ 
      success: true,
      migrated: results 
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Migration başarısız', details: error.message },
      { status: 500 }
    );
  }
}

