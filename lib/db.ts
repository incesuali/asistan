import { sql } from '@vercel/postgres';

// Veritabanı tablolarını oluştur
export async function initDatabase() {
  try {
    // Environment variable kontrolü
    if (!process.env.POSTGRES_URL && !process.env.DATABASE_URL) {
      console.error('POSTGRES_URL or DATABASE_URL environment variable is missing');
      throw new Error('Database connection string not found');
    }

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
  } catch (error: any) {
    console.error('Database initialization error:', error);
    throw error; // Hata fırlat ki API route'ları yakalasın
  }
}

