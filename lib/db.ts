import { sql } from '@vercel/postgres';

// Veritabanı tablolarını oluştur
export async function initDatabase() {
  try {
    // Notes tablosu
    await sql`
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Todos tablosu
    await sql`
      CREATE TABLE IF NOT EXISTS todos (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Reminders tablosu
    await sql`
      CREATE TABLE IF NOT EXISTS reminders (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        reminder_date_time TIMESTAMP NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

