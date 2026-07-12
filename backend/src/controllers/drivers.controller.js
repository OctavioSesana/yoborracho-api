import { z } from 'zod'
import { pool } from '../db/pool.js'
import { asyncHandler } from '../middleware/errorHandler.js'

// Las 4 etapas de onboarding del conductor (ver DRIVER_ONBOARDING en el frontend):
// 1. Registro básico (nombre, celular, selfie, zona)
// 2. Verificación de identidad (DNI, licencia, antecedentes)
// 3. Capacitación obligatoria
// 4. Viaje de prueba supervisado

const step1Schema = z.object({
  step: z.literal(1),
  telefono: z.string().min(6),
  zona: z.string().min(2),
  selfieUrl: z.string().optional(),
})

const step2Schema = z.object({
  step: z.literal(2),
  dniNumero: z.string().min(6),
  dniFrenteUrl: z.string().optional(),
  dniDorsoUrl: z.string().optional(),
  licenciaNumero: z.string().min(4),
  licenciaVencimiento: z.string().optional(),
})

const step3Schema = z.object({
  step: z.literal(3),
  capacitacionCompletada: z.boolean(),
})

const step4Schema = z.object({
  step: z.literal(4),
  viajePruebaAprobado: z.boolean(),
})

function toPublicProfile(row) {
  return {
    userId: row.user_id,
    verificationStatus: row.verification_status,
    etapaActual: row.etapa_actual,
    dniNumero: row.dni_numero,
    licenciaNumero: row.licencia_numero,
    licenciaVencimiento: row.licencia_vencimiento,
    antecedentesOk: row.antecedentes_ok,
    capacitacionCompletada: row.capacitacion_completada,
    viajePruebaAprobado: row.viaje_prueba_aprobado,
    zonaOperacion: row.zona_operacion,
    disponible: row.disponible,
    vehiculoHabilitado: row.vehiculo_habilitado,
    rating: Number(row.rating_avg),
  }
}

async function getOrCreateProfile(userId) {
  const { rows } = await pool.query('SELECT * FROM driver_profiles WHERE user_id = $1', [userId])
  if (rows[0]) return rows[0]
  const created = await pool.query(
    'INSERT INTO driver_profiles (user_id) VALUES ($1) RETURNING *',
    [userId]
  )
  return created.rows[0]
}

export const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await getOrCreateProfile(req.user.id)
  res.json({ profile: toPublicProfile(profile) })
})

// POST /api/drivers/verify  { step: 1|2|3|4, ...datosDeLaEtapa }
export const submitVerificationStep = asyncHandler(async (req, res) => {
  const step = req.body?.step

  await getOrCreateProfile(req.user.id)

  if (step === 1) {
    const data = step1Schema.parse(req.body)
    await pool.query(
      `UPDATE driver_profiles SET zona_operacion = $2, selfie_url = $3,
         etapa_actual = GREATEST(etapa_actual, 2), updated_at = now()
       WHERE user_id = $1`,
      [req.user.id, data.zona, data.selfieUrl || null]
    )
    await pool.query('UPDATE users SET telefono = $2, zona = $3 WHERE id = $1', [
      req.user.id,
      data.telefono,
      data.zona,
    ])
  } else if (step === 2) {
    const data = step2Schema.parse(req.body)
    await pool.query(
      `UPDATE driver_profiles SET dni_numero = $2, dni_frente_url = $3, dni_dorso_url = $4,
         licencia_numero = $5, licencia_vencimiento = $6,
         verification_status = 'en_capacitacion', etapa_actual = GREATEST(etapa_actual, 3),
         updated_at = now()
       WHERE user_id = $1`,
      [
        req.user.id,
        data.dniNumero,
        data.dniFrenteUrl || null,
        data.dniDorsoUrl || null,
        data.licenciaNumero,
        data.licenciaVencimiento || null,
      ]
    )
  } else if (step === 3) {
    const data = step3Schema.parse(req.body)
    await pool.query(
      `UPDATE driver_profiles SET capacitacion_completada = $2,
         etapa_actual = GREATEST(etapa_actual, 4), updated_at = now()
       WHERE user_id = $1`,
      [req.user.id, data.capacitacionCompletada]
    )
  } else if (step === 4) {
    const data = step4Schema.parse(req.body)
    await pool.query(
      `UPDATE driver_profiles SET viaje_prueba_aprobado = $2,
         verification_status = CASE WHEN $2 THEN 'activo' ELSE verification_status END,
         vehiculo_habilitado = CASE WHEN $2 THEN true ELSE vehiculo_habilitado END,
         disponible = CASE WHEN $2 THEN true ELSE disponible END,
         updated_at = now()
       WHERE user_id = $1`,
      [req.user.id, data.viajePruebaAprobado]
    )
  } else {
    return res.status(400).json({ error: 'El campo "step" debe ser 1, 2, 3 o 4.' })
  }

  const { rows } = await pool.query('SELECT * FROM driver_profiles WHERE user_id = $1', [req.user.id])
  res.json({ profile: toPublicProfile(rows[0]) })
})

export const setDisponibilidad = asyncHandler(async (req, res) => {
  const disponible = Boolean(req.body?.disponible)
  const { rows } = await pool.query(
    `UPDATE driver_profiles SET disponible = $2, updated_at = now() WHERE user_id = $1 RETURNING *`,
    [req.user.id, disponible]
  )
  if (!rows[0]) return res.status(404).json({ error: 'Perfil de conductor no encontrado.' })
  res.json({ profile: toPublicProfile(rows[0]) })
})
