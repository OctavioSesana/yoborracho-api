// Ejecuta, en orden, todos los archivos .sql de la carpeta /migrations
// y lleva un registro de cuáles ya se aplicaron en la tabla schema_migrations.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { pool } from './pool.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const migrationsDir = path.resolve(__dirname, '../../migrations')

async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `)
}

async function getAppliedMigrations() {
  const { rows } = await pool.query('SELECT name FROM schema_migrations')
  return new Set(rows.map((r) => r.name))
}

async function run() {
  console.log('[migrate] Conectando a la base de datos...')
  await ensureMigrationsTable()
  const applied = await getAppliedMigrations()

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()

  if (files.length === 0) {
    console.log('[migrate] No se encontraron archivos .sql en /migrations')
    return
  }

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`[migrate] Ya aplicada, se omite: ${file}`)
      continue
    }
    const fullPath = path.join(migrationsDir, file)
    const sql = fs.readFileSync(fullPath, 'utf-8')
    console.log(`[migrate] Aplicando: ${file}`)
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query(sql)
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file])
      await client.query('COMMIT')
      console.log(`[migrate] OK: ${file}`)
    } catch (err) {
      await client.query('ROLLBACK')
      console.error(`[migrate] ERROR en ${file}:`, err.message)
      throw err
    } finally {
      client.release()
    }
  }

  console.log('[migrate] Migraciones completas.')
}

run()
  .then(() => pool.end())
  .catch((err) => {
    console.error('[migrate] Falló la migración:', err)
    pool.end().finally(() => process.exit(1))
  })
