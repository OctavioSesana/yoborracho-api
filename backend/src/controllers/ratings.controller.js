import { z } from 'zod'
import { pool } from '../db/pool.js'
import { asyncHandler } from '../middleware/errorHandler.js'

const ratingSchema = z.object({
  stars: z.number().int().min(1).max(5),
  criteria: z.record(z.string(), z.union([z.number(), z.boolean(), z.string()])).optional(),
  comment: z.string().optional(),
})

function toPublicRating(row) {
  if (!row) return null
  return {
    id: row.id,
    tripId: row.trip_id,
    raterId: row.rater_id,
    ratedId: row.rated_id,
    stars: row.stars,
    criteria: row.criteria,
    comment: row.comment,
    isVisible: row.is_visible,
    createdAt: row.created_at,
  }
}

async function recalcAverageRating(userId) {
  const { rows } = await pool.query(
    'SELECT AVG(stars)::numeric(2,1) AS avg FROM ratings WHERE rated_id = $1 AND is_visible = true',
    [userId]
  )
  const avg = rows[0]?.avg || 0
  await pool.query('UPDATE users SET calificacion_avg = $2 WHERE id = $1', [userId, avg])
  await pool.query(
    'UPDATE driver_profiles SET rating_avg = $2 WHERE user_id = $1',
    [userId, avg]
  )
}

// POST /api/trips/:id/rating — envía una calificación. Doble ciego diferido:
// la fila queda con is_visible = false hasta que AMBAS partes del viaje calificaron;
// en ese momento se marcan ambas como visibles.
export const submitRating = asyncHandler(async (req, res) => {
  const data = ratingSchema.parse(req.body)
  const tripId = req.params.id

  const { rows: tripRows } = await pool.query('SELECT * FROM trips WHERE id = $1', [tripId])
  const trip = tripRows[0]
  if (!trip) return res.status(404).json({ error: 'Viaje no encontrado.' })

  if (trip.rider_id !== req.user.id && trip.driver_id !== req.user.id) {
    return res.status(403).json({ error: 'No tenés acceso a este viaje.' })
  }
  if (trip.status !== 'completado') {
    return res.status(409).json({ error: 'Sólo se puede calificar un viaje completado.' })
  }

  const ratedId = trip.rider_id === req.user.id ? trip.driver_id : trip.rider_id
  if (!ratedId) {
    return res.status(409).json({ error: 'Este viaje no tiene la otra parte asignada.' })
  }

  const existing = await pool.query('SELECT id FROM ratings WHERE trip_id = $1 AND rater_id = $2', [
    tripId,
    req.user.id,
  ])
  if (existing.rows.length > 0) {
    return res.status(409).json({ error: 'Ya calificaste este viaje.' })
  }

  await pool.query(
    `INSERT INTO ratings (trip_id, rater_id, rated_id, stars, criteria, comment)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [tripId, req.user.id, ratedId, data.stars, data.criteria || {}, data.comment || null]
  )

  // ¿Ya calificaron ambas partes de este viaje?
  const { rows: countRows } = await pool.query(
    'SELECT COUNT(DISTINCT rater_id)::int AS cnt FROM ratings WHERE trip_id = $1',
    [tripId]
  )
  const bothRated = countRows[0].cnt >= 2

  if (bothRated) {
    await pool.query('UPDATE ratings SET is_visible = true WHERE trip_id = $1', [tripId])
    await recalcAverageRating(trip.rider_id)
    if (trip.driver_id) await recalcAverageRating(trip.driver_id)
  }

  const { rows: myRatingRows } = await pool.query(
    'SELECT * FROM ratings WHERE trip_id = $1 AND rater_id = $2',
    [tripId, req.user.id]
  )

  res.status(201).json({
    rating: toPublicRating(myRatingRows[0]),
    bothRated,
    mensaje: bothRated
      ? 'Calificación enviada. Ya se puede ver la calificación de la otra parte.'
      : 'Calificación enviada. Se mostrará cuando la otra parte también califique.',
  })
})

// GET /api/trips/:id/rating — devuelve las calificaciones del viaje respetando el doble ciego
export const getRating = asyncHandler(async (req, res) => {
  const tripId = req.params.id

  const { rows: tripRows } = await pool.query('SELECT rider_id, driver_id FROM trips WHERE id = $1', [
    tripId,
  ])
  const trip = tripRows[0]
  if (!trip) return res.status(404).json({ error: 'Viaje no encontrado.' })
  if (trip.rider_id !== req.user.id && trip.driver_id !== req.user.id) {
    return res.status(403).json({ error: 'No tenés acceso a este viaje.' })
  }

  const { rows } = await pool.query('SELECT * FROM ratings WHERE trip_id = $1', [tripId])

  const mine = rows.find((r) => r.rater_id === req.user.id)
  const other = rows.find((r) => r.rater_id !== req.user.id)

  res.json({
    myRating: toPublicRating(mine),
    // La calificación de la otra parte sólo se expone si is_visible = true (doble ciego)
    otherRating: other && other.is_visible ? toPublicRating(other) : null,
  })
})
