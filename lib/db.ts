import { Pool } from 'pg';

// Connection string: Prisma Postgres (DATABASE_URL veya POSTGRES_URL)
const connectionString =
  process.env.POSTGRES_URL || process.env.DATABASE_URL || '';

if (!connectionString) {
  // Bu durum API route'larında yakalanacak
  console.error('Database connection string is missing');
}

// Serverless için havuz (pool)
const pool = new Pool({ connectionString, max: 5, ssl: { rejectUnauthorized: false } });

// Basit sql helper (tagged template yerine parametreli query)
export async function sql(strings: TemplateStringsArray, ...values: any[]) {
  let text = '';
  for (let i = 0; i < strings.length; i++) {
    text += strings[i];
    if (i < values.length) text += `$${i + 1}`;
  }
  const result = await pool.query(text, values);
  return result;
}

// Veritabanı tablolarını oluştur
export async function initDatabase() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS todos (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Yeni alanlar: due_at ve completed
    await sql`ALTER TABLE todos ADD COLUMN IF NOT EXISTS due_at TIMESTAMP NULL`;
    await sql`ALTER TABLE todos ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT FALSE`;

    await sql`
      CREATE TABLE IF NOT EXISTS reminders (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        reminder_date_time TIMESTAMP NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Plans tablosu
    await sql`
      CREATE TABLE IF NOT EXISTS plans (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS plans_attachments (
        id TEXT PRIMARY KEY,
        plan_id TEXT NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
        file_name TEXT NOT NULL,
        file_url TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
  } catch (error: any) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

