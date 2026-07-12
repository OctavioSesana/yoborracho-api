import { pool } from '../db/pool.js'
import { asyncHandler } from '../middleware/errorHandler.js'

function toPublic(row) {
  return {
    id: row.id,
    tipo: row.tipo,
    titulo: row.titulo,
    detalle: row.detalle,
    leido: row.leido,
    createdAt: row.created_at,
  }
}

// GET /api/notifications
export const listNotifications = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100',
    [req.user.id]
  )
  res.json({ notifications: rows.map(toPublic) })
})

// PATCH /api/notifications/:id/read
export const markAsRead = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    'UPDATE notifications SET leido = true WHERE id = $1 AND user_id = $2 RETURNING *',
    [req.params.id, req.user.id]
  )
  if (!rows[0]) return res.status(404).json({ error: 'Notificación no encontrada.' })
  res.json({ notification: toPublic(rows[0]) })
})
