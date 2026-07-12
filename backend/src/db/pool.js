import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg

const connectionString = process.env.DATABASE_URL

// Postgres administrado (Render, Railway, Supabase, etc.) exige SSL en la
// conexión externa; Postgres local/Docker Compose no lo tiene habilitado y
// no hace falta. DATABASE_SSL=true lo prende explícitamente en vez de
// adivinar por el connection string.
const ssl = process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false

export const pool = new Pool({
  connectionString,
  ssl,
})

pool.on('error', (err) => {
  // No tiramos abajo el proceso si Postgres se cae momentáneamente
  console.error('[db] Error inesperado en cliente inactivo del pool:', err.message)
})

export async function query(text, params) {
  return pool.query(text, params)
}

export async function getClient() {
  return pool.connect()
}

export async function checkConnection() {
  try {
    await pool.query('SELECT 1')
    return true
  } catch (err) {
    return false
  }
}
