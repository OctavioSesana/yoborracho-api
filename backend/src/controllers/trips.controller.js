import { z } from 'zod'
import { pool } from '../db/pool.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { calcularTarifa, calcularDesglose, distanciaHaversineKm } from '../utils/fare.js'
import { puedeTransicionar, TIMESTAMP_COLUMNS } from '../utils/tripStateMachine.js'
import { emitTripStatusChanged, emitNewTripRequest } from '../ws/index.js'
import { scheduleRegresoReminder } from '../utils/regresoReminder.js'

const createTripSchema = z.object({
  pickupAddress: z.string().min(3, 'La dirección de origen es obligatoria.'),
  pickupLat: z.number().optional(),
  pickupLng: z.number().optional(),
  dropoffAddress: z.string().min(3, 'La dirección de destino es obligatoria.'),
  dropoffLat: z.number().optional(),
  dropoffLng: z.number().optional(),
  vehicleId: z.string().uuid().optional(),
})

const statusSchema = z.object({
  status: z.enum([
    'matching',
    'aceptado',
    'traslado_al_punto',
    'verificacion',
    'en_viaje',
    'llegada',
    'regreso_conductor',
    'completado',
    'cancelado',
  ]),
  cancelReason: z.string().optional(),
})

function toPublicTrip(row) {
  return {
    id: row.id,
    riderId: row.rider_id,
    driverId: row.driver_id,
    vehicleId: row.vehicle_id,
    pickup: { address: row.pickup_address, lat: row.pickup_lat, lng: row.pickup_lng },
    dropoff: { address: row.dropoff_address, lat: row.dropoff_lat, lng: row.dropoff_lng },
    distanceKm: row.distance_km ? Number(row.distance_km) : null,
    status: row.status,
    fareTotal: Number(row.fare_total),
    fareBreakdown: row.fare_breakdown,
    cancelReason: row.cancel_reason,
    riderNombre: row.rider_nombre,
    driverNombre: row.driver_nombre,
    timestamps: {
      requestedAt: row.requested_at,
      matchedAt: row.matched_at,
      acceptedAt: row.accepted_at,
      trasladoAlPuntoAt: row.traslado_al_punto_at,
      verificacionAt: row.verificacion_at,
      enViajeAt: row.en_viaje_at,
      llegadaAt: row.llegada_at,
      regresoConductorAt: row.regreso_conductor_at,
      completadoAt: row.completado_at,
      canceladoAt: row.cancelado_at,
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

const TRIP_SELECT = `
  SELECT t.*, ru.nombre AS rider_nombre, du.nombre AS driver_nombre
  FROM trips t
  JOIN users ru ON ru.id = t.rider_id
  LEFT JOIN users du ON du.id = t.driver_id
`

// Avisa (notificación in-app + WebSocket "new_trip_request") a los conductores
// disponibles y verificados en la misma ciudad del rider apenas se crea un
// pedido. Misma lógica de matching por ciudad que listAvailableTrips (el
// lanzamiento es ciudad por ciudad, no barrio por barrio).
async function notificarConductoresDeNuevoPedido(trip) {
  const { rows: riderRows } = await pool.query('SELECT zona FROM users WHERE id = $1', [trip.riderId])
  const zona = riderRows[0]?.zona
  const ciudad = zona?.includes(',') ? zona.split(',').pop().trim() : zona

  const params = []
  let zonaClause = ''
  if (ciudad) {
    params.push(`%${ciudad}%`)
    zonaClause = `AND dp.zona_operacion ILIKE $${params.length}`
  }

  const { rows: drivers } = await pool.query(
    `SELECT du.id
     FROM driver_profiles dp
     JOIN users du ON du.id = dp.user_id
     WHERE dp.disponible = true AND dp.verification_status = 'activo' ${zonaClause}`,
    params
  )

  if (drivers.length === 0) return

  const payload = {
    tripId: trip.id,
    pickup: trip.pickup,
    dropoff: trip.dropoff,
    fareTotal: trip.fareTotal,
    fareBreakdown: trip.fareBreakdown,
    distanceKm: trip.distanceKm,
    riderNombre: trip.riderNombre,
  }

  await Promise.all(
    drivers.map(async (d) => {
      await pool.query(
        `INSERT INTO notifications (user_id, tipo, titulo, detalle)
         VALUES ($1, 'pedido', 'Nuevo pedido cerca tuyo', $2)`,
        [d.id, `${trip.pickup.address} → ${trip.dropoff.address}`]
      )
      emitNewTripRequest(d.id, payload)
    })
  )
}

// POST /api/trips — el rider solicita un viaje
export const createTrip = asyncHandler(async (req, res) => {
  if (req.user.role !== 'usuario') {
    return res.status(403).json({ error: 'Sólo un usuario puede solicitar un viaje.' })
  }
  const data = createTripSchema.parse(req.body)

  const distanceKm = distanciaHaversineKm(data.pickupLat, data.pickupLng, data.dropoffLat, data.dropoffLng)
  const total = calcularTarifa(distanceKm)
  const breakdown = calcularDesglose(total)

  const { rows } = await pool.query(
    `INSERT INTO trips (
      rider_id, vehicle_id, pickup_address, pickup_lat, pickup_lng,
      dropoff_address, dropoff_lat, dropoff_lng, distance_km,
      status, fare_total, fare_breakdown
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'matching',$10,$11)
     RETURNING id`,
    [
      req.user.id,
      data.vehicleId || null,
      data.pickupAddress,
      data.pickupLat ?? null,
      data.pickupLng ?? null,
      data.dropoffAddress,
      data.dropoffLat ?? null,
      data.dropoffLng ?? null,
      distanceKm,
      total,
      breakdown,
    ]
  )

  const { rows: full } = await pool.query(`${TRIP_SELECT} WHERE t.id = $1`, [rows[0].id])
  const trip = toPublicTrip(full[0])

  notificarConductoresDeNuevoPedido(trip).catch((err) =>
    console.error('[trips] No se pudo notificar a los conductores del nuevo pedido:', err.message)
  )

  res.status(201).json({ trip })
})

// GET /api/trips — historial, filtrable por status y fecha
export const listTrips = asyncHandler(async (req, res) => {
  const { status, from, to } = req.query
  const conditions = []
  const params = []

  if (req.user.role === 'usuario') {
    params.push(req.user.id)
    conditions.push(`t.rider_id = $${params.length}`)
  } else {
    params.push(req.user.id)
    conditions.push(`t.driver_id = $${params.length}`)
  }

  if (status) {
    params.push(status)
    conditions.push(`t.status = $${params.length}`)
  }
  if (from) {
    params.push(from)
    conditions.push(`t.created_at >= $${params.length}`)
  }
  if (to) {
    params.push(to)
    conditions.push(`t.created_at <= $${params.length}`)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const { rows } = await pool.query(`${TRIP_SELECT} ${where} ORDER BY t.created_at DESC`, params)
  res.json({ trips: rows.map(toPublicTrip) })
})

// GET /api/trips/available — el conductor ve solicitudes pendientes en su zona
export const listAvailableTrips = asyncHandler(async (req, res) => {
  if (req.user.role !== 'conductor') {
    return res.status(403).json({ error: 'Sólo un conductor puede ver viajes disponibles.' })
  }

  const { rows: profileRows } = await pool.query(
    'SELECT zona_operacion, disponible FROM driver_profiles WHERE user_id = $1',
    [req.user.id]
  )
  const zona = profileRows[0]?.zona_operacion
  // La zona se guarda como "Barrio, Ciudad". El lanzamiento es por ciudad, no por barrio
  // (ver estrategia de expansión), así que el matching compara solo la ciudad, no el barrio
  // exacto — si no, un conductor con zona "Pichincha, Rosario" nunca vería un pedido de
  // alguien en "Centro, Rosario" aunque estén en la misma ciudad.
  const ciudad = zona?.includes(',') ? zona.split(',').pop().trim() : zona

  const params = []
  let zonaClause = ''
  if (ciudad) {
    params.push(`%${ciudad}%`)
    zonaClause = `AND ru.zona ILIKE $${params.length}`
  }

  const { rows } = await pool.query(
    `${TRIP_SELECT} WHERE t.status = 'matching' AND t.driver_id IS NULL ${zonaClause} ORDER BY t.created_at DESC`,
    params
  )
  res.json({ trips: rows.map(toPublicTrip) })
})

// GET /api/trips/:id
export const getTrip = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(`${TRIP_SELECT} WHERE t.id = $1`, [req.params.id])
  const trip = rows[0]
  if (!trip) return res.status(404).json({ error: 'Viaje no encontrado.' })

  if (trip.rider_id !== req.user.id && trip.driver_id !== req.user.id) {
    return res.status(403).json({ error: 'No tenés acceso a este viaje.' })
  }

  res.json({ trip: toPublicTrip(trip) })
})

// POST /api/trips/:id/accept — el conductor acepta un viaje en "matching"
export const acceptTrip = asyncHandler(async (req, res) => {
  if (req.user.role !== 'conductor') {
    return res.status(403).json({ error: 'Sólo un conductor puede aceptar un viaje.' })
  }

  const { rows } = await pool.query('SELECT * FROM trips WHERE id = $1', [req.params.id])
  const trip = rows[0]
  if (!trip) return res.status(404).json({ error: 'Viaje no encontrado.' })

  if (trip.status !== 'matching' || trip.driver_id) {
    return res.status(409).json({ error: 'Este viaje ya no está disponible.' })
  }

  const { rows: updated } = await pool.query(
    `UPDATE trips SET driver_id = $2, status = 'aceptado', accepted_at = now(), updated_at = now()
     WHERE id = $1 RETURNING *`,
    [req.params.id, req.user.id]
  )

  await pool.query(
    `INSERT INTO notifications (user_id, tipo, titulo, detalle)
     VALUES ($1, 'viaje', 'Conductor asignado', 'Un conductor aceptó tu solicitud y ya está en camino.')`,
    [trip.rider_id]
  )

  emitTripStatusChanged(req.params.id, 'aceptado')

  const { rows: full } = await pool.query(`${TRIP_SELECT} WHERE t.id = $1`, [req.params.id])
  res.json({ trip: toPublicTrip(full[0]) })
})

// PATCH /api/trips/:id/status — transición del estado del viaje
export const updateTripStatus = asyncHandler(async (req, res) => {
  const data = statusSchema.parse(req.body)

  const { rows } = await pool.query('SELECT * FROM trips WHERE id = $1', [req.params.id])
  const trip = rows[0]
  if (!trip) return res.status(404).json({ error: 'Viaje no encontrado.' })

  if (trip.rider_id !== req.user.id && trip.driver_id !== req.user.id) {
    return res.status(403).json({ error: 'No tenés acceso a este viaje.' })
  }

  if (!puedeTransicionar(trip.status, data.status)) {
    return res.status(409).json({
      error: `No se puede pasar de "${trip.status}" a "${data.status}".`,
    })
  }

  const tsColumn = TIMESTAMP_COLUMNS[data.status]
  const setClauses = [`status = $2`, `${tsColumn} = now()`, `updated_at = now()`]
  const params = [req.params.id, data.status]

  if (data.status === 'cancelado' && data.cancelReason) {
    params.push(data.cancelReason)
    setClauses.push(`cancel_reason = $${params.length}`)
  }

  const { rows: updated } = await pool.query(
    `UPDATE trips SET ${setClauses.join(', ')} WHERE id = $1 RETURNING *`,
    params
  )

  // Al completar el viaje, sumamos viajes totales a ambas partes
  if (data.status === 'completado') {
    await pool.query('UPDATE users SET viajes_totales = viajes_totales + 1 WHERE id = ANY($1)', [
      [trip.rider_id, trip.driver_id].filter(Boolean),
    ])
    await pool.query(
      `INSERT INTO notifications (user_id, tipo, titulo, detalle)
       VALUES ($1, 'calificacion', 'Calificá tu viaje', 'Contanos cómo fue tu experiencia.'),
              ($2, 'calificacion', 'Calificá a tu pasajero', 'Contanos cómo fue el viaje.')`,
      [trip.rider_id, trip.driver_id]
    )
  }

  if (data.status === 'regreso_conductor' && trip.driver_id) {
    // El conductor ya pidió su Uber/remis de vuelta; si en unos minutos no volvió
    // a confirmar "Llegué a casa", le mandamos un recordatorio.
    scheduleRegresoReminder(trip.id, trip.driver_id)
  }

  if (data.status === 'aceptado' || data.status === 'traslado_al_punto') {
    await pool.query(
      `INSERT INTO notifications (user_id, tipo, titulo, detalle)
       VALUES ($1, 'viaje', 'Actualización de tu viaje', $2)`,
      [trip.rider_id, `El estado de tu viaje cambió a "${data.status}".`]
    )
  }

  if (data.status === 'cancelado') {
    // Avisamos a la otra parte (el que no canceló), si ya había alguien asignado.
    const quienCancelo = req.user.id === trip.rider_id ? 'usuario' : 'conductor'
    const notificar = quienCancelo === 'usuario' ? trip.driver_id : trip.rider_id
    if (notificar) {
      const titulo = quienCancelo === 'usuario' ? 'El pasajero canceló el viaje' : 'El conductor canceló el viaje'
      const detalle =
        quienCancelo === 'usuario'
          ? 'El pasajero canceló este pedido. No hace falta que continúes.'
          : 'El conductor canceló este viaje. Podés pedir uno nuevo cuando quieras.'
      await pool.query(
        `INSERT INTO notifications (user_id, tipo, titulo, detalle)
         VALUES ($1, 'viaje', $2, $3)`,
        [notificar, titulo, detalle]
      )
    }
  }

  emitTripStatusChanged(req.params.id, data.status)

  const { rows: full } = await pool.query(`${TRIP_SELECT} WHERE t.id = $1`, [req.params.id])
  res.json({ trip: toPublicTrip(full[0]) })
})

// GET /api/trips/:id/locations — fallback REST de polling (además del WebSocket)
export const getTripLocations = asyncHandler(async (req, res) => {
  const { rows: tripRows } = await pool.query('SELECT rider_id, driver_id FROM trips WHERE id = $1', [
    req.params.id,
  ])
  const trip = tripRows[0]
  if (!trip) return res.status(404).json({ error: 'Viaje no encontrado.' })
  if (trip.rider_id !== req.user.id && trip.driver_id !== req.user.id) {
    return res.status(403).json({ error: 'No tenés acceso a este viaje.' })
  }

  const { rows } = await pool.query(
    'SELECT lat, lng, recorded_by, created_at FROM trip_locations WHERE trip_id = $1 ORDER BY created_at ASC',
    [req.params.id]
  )
  res.json({
    locations: rows.map((r) => ({
      lat: r.lat,
      lng: r.lng,
      recordedBy: r.recorded_by,
      timestamp: r.created_at,
    })),
  })
})

// POST /api/trips/:id/locations — fallback REST para enviar una ubicación (sin WebSocket)
export const postTripLocation = asyncHandler(async (req, res) => {
  const { lat, lng } = req.body || {}
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return res.status(400).json({ error: 'lat y lng son obligatorios y deben ser numéricos.' })
  }

  const { rows: tripRows } = await pool.query('SELECT rider_id, driver_id FROM trips WHERE id = $1', [
    req.params.id,
  ])
  const trip = tripRows[0]
  if (!trip) return res.status(404).json({ error: 'Viaje no encontrado.' })
  if (trip.rider_id !== req.user.id && trip.driver_id !== req.user.id) {
    return res.status(403).json({ error: 'No tenés acceso a este viaje.' })
  }

  const recordedBy = req.user.role === 'conductor' ? 'conductor' : 'usuario'
  await pool.query(
    'INSERT INTO trip_locations (trip_id, lat, lng, recorded_by) VALUES ($1, $2, $3, $4)',
    [req.params.id, lat, lng, recordedBy]
  )

  res.status(201).json({ ok: true })
})

const ESTADOS_TERMINADOS = ['completado', 'cancelado']

// GET /api/trips/:id/public — SIN autenticación. Pensado para que un contacto de
// confianza abra el link que le mandaron por WhatsApp y vea el viaje en curso sin
// necesidad de tener cuenta ni la app instalada. Devuelve solo lo mínimo e
// inofensivo: nombres de pila, estado, direcciones y la última ubicación conocida
// — nada de email, teléfono, tokens ni datos de pago.
export const getPublicTrip = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(`${TRIP_SELECT} WHERE t.id = $1`, [req.params.id])
  const trip = rows[0]
  if (!trip) return res.status(404).json({ error: 'Viaje no encontrado.' })

  const { rows: locRows } = await pool.query(
    'SELECT lat, lng, created_at FROM trip_locations WHERE trip_id = $1 ORDER BY created_at DESC LIMIT 1',
    [req.params.id]
  )

  res.json({
    trip: {
      id: trip.id,
      status: trip.status,
      activo: !ESTADOS_TERMINADOS.includes(trip.status),
      riderNombre: trip.rider_nombre,
      driverNombre: trip.driver_nombre,
      pickup: { address: trip.pickup_address, lat: trip.pickup_lat, lng: trip.pickup_lng },
      dropoff: { address: trip.dropoff_address, lat: trip.dropoff_lat, lng: trip.dropoff_lng },
      lastLocation: locRows[0]
        ? { lat: locRows[0].lat, lng: locRows[0].lng, timestamp: locRows[0].created_at }
        : null,
      updatedAt: trip.updated_at,
    },
  })
})
