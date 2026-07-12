import { z } from 'zod'
import { pool } from '../db/pool.js'
import { asyncHandler } from '../middleware/errorHandler.js'

const addressSchema = z.object({
  etiqueta: z.string().min(1, 'Ponele un nombre a la dirección (ej. "Casa").').max(60),
  direccion: z.string().min(3, 'La dirección es obligatoria.'),
  lat: z.number().optional(),
  lng: z.number().optional(),
})

function toPublic(row) {
  return {
    id: row.id,
    riderId: row.rider_id,
    etiqueta: row.etiqueta,
    direccion: row.direccion,
    lat: row.lat,
    lng: row.lng,
    createdAt: row.created_at,
  }
}

export const listMyAddresses = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM saved_addresses WHERE rider_id = $1 ORDER BY created_at DESC',
    [req.user.id]
  )
  res.json({ addresses: rows.map(toPublic) })
})

export const createAddress = asyncHandler(async (req, res) => {
  const data = addressSchema.parse(req.body)
  const { rows } = await pool.query(
    `INSERT INTO saved_addresses (rider_id, etiqueta, direccion, lat, lng)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [req.user.id, data.etiqueta, data.direccion, data.lat ?? null, data.lng ?? null]
  )
  res.status(201).json({ address: toPublic(rows[0]) })
})

export const deleteAddress = asyncHandler(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM saved_addresses WHERE id = $1', [req.params.id])
  const address = rows[0]
  if (!address) return res.status(404).json({ error: 'Dirección no encontrada.' })
  if (address.rider_id !== req.user.id) {
    return res.status(403).json({ error: 'No tenés acceso a esta dirección.' })
  }
  await pool.query('DELETE FROM saved_addresses WHERE id = $1', [req.params.id])
  res.status(204).end()
})
