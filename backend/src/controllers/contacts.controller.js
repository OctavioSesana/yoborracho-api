import { z } from 'zod'
import { pool } from '../db/pool.js'
import { asyncHandler } from '../middleware/errorHandler.js'

const contactSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio.').max(80),
  parentesco: z.string().max(40).optional(),
  telefono: z.string().min(6, 'Ingresá un teléfono válido.').max(30),
})

function toPublic(row) {
  return {
    id: row.id,
    riderId: row.rider_id,
    nombre: row.nombre,
    parentesco: row.parentesco,
    telefono: row.telefono,
    createdAt: row.created_at,
  }
}

export const listMyContacts = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM trusted_contacts WHERE rider_id = $1 ORDER BY created_at ASC',
    [req.user.id]
  )
  res.json({ contacts: rows.map(toPublic) })
})

export const createContact = asyncHandler(async (req, res) => {
  const data = contactSchema.parse(req.body)
  const { rows } = await pool.query(
    `INSERT INTO trusted_contacts (rider_id, nombre, parentesco, telefono)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [req.user.id, data.nombre, data.parentesco || null, data.telefono]
  )
  res.status(201).json({ contact: toPublic(rows[0]) })
})

export const deleteContact = asyncHandler(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM trusted_contacts WHERE id = $1', [req.params.id])
  const contact = rows[0]
  if (!contact) return res.status(404).json({ error: 'Contacto no encontrado.' })
  if (contact.rider_id !== req.user.id) {
    return res.status(403).json({ error: 'No tenés acceso a este contacto.' })
  }
  await pool.query('DELETE FROM trusted_contacts WHERE id = $1', [req.params.id])
  res.status(204).end()
})
