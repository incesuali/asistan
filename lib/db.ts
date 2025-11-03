import { sql as vercelSql } from '@vercel/postgres';

// @vercel/postgres'in sql fonksiyonunu direkt kullan
// createClient() otomatik olarak pooled connection string kullanır
export const sql = vercelSql;

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
  } catch (error: any) {
    console.error('Database initialization error:', error);
    throw error; // Hata fırlat ki API route'ları yakalasın
  }
}

