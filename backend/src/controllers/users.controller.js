import { z } from 'zod'
import { pool } from '../db/pool.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { toPublicUser } from './auth.controller.js'

const updateSchema = z.object({
  nombre: z.string().min(2).optional(),
  telefono: z.string().optional(),
  zona: z.string().optional(),
})

export const getMe = asyncHandler(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id])
  if (!rows[0]) return res.status(404).json({ error: 'Usuario no encontrado.' })
  res.json({ user: toPublicUser(rows[0]) })
})

export const updateMe = asyncHandler(async (req, res) => {
  const data = updateSchema.parse(req.body)
  const fields = Object.keys(data)
  if (fields.length === 0) {
    return res.status(400).json({ error: 'No se enviaron campos para actualizar.' })
  }

  const setClauses = fields.map((f, i) => `${f} = $${i + 2}`).join(', ')
  const values = fields.map((f) => data[f])

  const { rows } = await pool.query(
    `UPDATE users SET ${setClauses}, updated_at = now() WHERE id = $1 RETURNING *`,
    [req.user.id, ...values]
  )

  res.json({ user: toPublicUser(rows[0]) })
})
