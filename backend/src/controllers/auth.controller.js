import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { pool } from '../db/pool.js'
import { signToken } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errorHandler.js'

const SALT_ROUNDS = 10

const registerSchema = z.object({
  email: z.string().email('El email no es válido.'),
  password: z.string().min(3, 'La contraseña debe tener al menos 3 caracteres.'),
  nombre: z.string().min(2, 'El nombre es obligatorio.'),
  telefono: z.string().optional(),
  role: z.enum(['usuario', 'conductor']),
  zona: z.string().optional(),
})

const loginSchema = z.object({
  email: z.string().email('El email no es válido.'),
  password: z.string().min(1, 'La contraseña es obligatoria.'),
})

function toPublicUser(row) {
  return {
    id: row.id,
    email: row.email,
    nombre: row.nombre,
    telefono: row.telefono,
    role: row.role,
    zona: row.zona,
    calificacion: Number(row.calificacion_avg),
    viajesTotales: row.viajes_totales,
    createdAt: row.created_at,
  }
}

export const register = asyncHandler(async (req, res) => {
  const data = registerSchema.parse(req.body)

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [data.email])
  if (existing.rows.length > 0) {
    return res.status(409).json({ error: 'Ya existe una cuenta registrada con ese email.' })
  }

  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS)

  const { rows } = await pool.query(
    `INSERT INTO users (email, password_hash, nombre, telefono, role, zona)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [data.email, passwordHash, data.nombre, data.telefono || null, data.role, data.zona || null]
  )

  const user = rows[0]

  if (data.role === 'conductor') {
    await pool.query(
      `INSERT INTO driver_profiles (user_id, zona_operacion) VALUES ($1, $2)`,
      [user.id, data.zona || null]
    )
  }

  const token = signToken(user)
  res.status(201).json({ token, user: toPublicUser(user) })
})

export const login = asyncHandler(async (req, res) => {
  const data = loginSchema.parse(req.body)

  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [data.email])
  const user = rows[0]

  if (!user) {
    return res.status(401).json({ error: 'Email o contraseña incorrectos.' })
  }

  const valid = await bcrypt.compare(data.password, user.password_hash)
  if (!valid) {
    return res.status(401).json({ error: 'Email o contraseña incorrectos.' })
  }

  const token = signToken(user)
  res.json({ token, user: toPublicUser(user) })
})

export const logout = asyncHandler(async (req, res) => {
  // Con JWT stateless no hay sesión que invalidar en el servidor;
  // el cliente simplemente descarta el token.
  res.json({ ok: true, mensaje: 'Sesión cerrada.' })
})

export const me = asyncHandler(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id])
  const user = rows[0]
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' })
  res.json({ user: toPublicUser(user) })
})

export { toPublicUser }
