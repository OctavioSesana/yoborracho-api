import { z } from 'zod'
import { pool } from '../db/pool.js'
import { asyncHandler } from '../middleware/errorHandler.js'

const vehicleSchema = z.object({
  marca: z.string().min(1),
  modelo: z.string().min(1),
  anio: z.number().int().optional(),
  patente: z.string().min(4),
  color: z.string().optional(),
  transmision: z.enum(['manual', 'automatica']).optional(),
})

function toPublic(row) {
  return {
    id: row.id,
    riderId: row.rider_id,
    marca: row.marca,
    modelo: row.modelo,
    anio: row.anio,
    patente: row.patente,
    color: row.color,
    transmision: row.transmision,
  }
}

export const listMyVehicles = asyncHandler(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM vehicles WHERE rider_id = $1 ORDER BY created_at DESC', [
    req.user.id,
  ])
  res.json({ vehicles: rows.map(toPublic) })
})

export const createVehicle = asyncHandler(async (req, res) => {
  const data = vehicleSchema.parse(req.body)
  const { rows } = await pool.query(
    `INSERT INTO vehicles (rider_id, marca, modelo, anio, patente, color, transmision)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [req.user.id, data.marca, data.modelo, data.anio || null, data.patente, data.color || null, data.transmision || 'manual']
  )
  res.status(201).json({ vehicle: toPublic(rows[0]) })
})
