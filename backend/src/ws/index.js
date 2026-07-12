import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import { isOriginAllowed } from '../utils/corsOrigins.js'

let io = null

// Namespace/room por viaje: cada viaje tiene su propia "room" llamada `trip:<tripId>`.
// Eventos:
//  - cliente -> servidor: "join_trip"        { tripId }
//  - cliente -> servidor: "location_update"  { tripId, lat, lng }         (lo emite el conductor, o el usuario en modo emergencia)
//  - cliente -> servidor: "safety_alert"     { tripId, mensaje }
//  - servidor -> clientes en la room: "location_update" { tripId, lat, lng, recordedBy, timestamp }
//  - servidor -> clientes en la room: "trip_status_changed" { tripId, status, timestamp }
//  - servidor -> clientes en la room: "safety_alert" { tripId, mensaje, from, timestamp }

export function initWebSocket(httpServer, { pool } = {}) {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (isOriginAllowed(origin)) callback(null, true)
        else callback(new Error(`Origen no permitido por CORS: ${origin}`))
      },
      methods: ['GET', 'POST'],
    },
  })

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token
      if (!token) return next(new Error('No autorizado.'))
      const payload = jwt.verify(token, process.env.JWT_SECRET)
      socket.user = { id: payload.sub, role: payload.role }
      next()
    } catch (err) {
      next(new Error('Token inválido.'))
    }
  })

  io.on('connection', (socket) => {
    // Room personal del usuario (no depende de ningún viaje puntual): permite
    // targetear notificaciones a un usuario específico mientras esté conectado,
    // por ejemplo avisarle a un conductor "te llegó un pedido nuevo" apenas se
    // crea, sin que tenga que estar mirando una pantalla de un viaje en particular.
    socket.join(`user:${socket.user.id}`)

    socket.on('join_trip', ({ tripId }) => {
      if (!tripId) return
      socket.join(`trip:${tripId}`)
    })

    socket.on('leave_trip', ({ tripId }) => {
      if (!tripId) return
      socket.leave(`trip:${tripId}`)
    })

    socket.on('location_update', async ({ tripId, lat, lng }) => {
      if (!tripId || lat === undefined || lng === undefined) return
      const recordedBy = socket.user.role === 'conductor' ? 'conductor' : 'usuario'

      if (pool) {
        try {
          await pool.query(
            'INSERT INTO trip_locations (trip_id, lat, lng, recorded_by) VALUES ($1, $2, $3, $4)',
            [tripId, lat, lng, recordedBy]
          )
        } catch (err) {
          console.error('[ws] No se pudo guardar la ubicación:', err.message)
        }
      }

      io.to(`trip:${tripId}`).emit('location_update', {
        tripId,
        lat,
        lng,
        recordedBy,
        timestamp: new Date().toISOString(),
      })
    })

    socket.on('safety_alert', ({ tripId, mensaje }) => {
      if (!tripId) return
      io.to(`trip:${tripId}`).emit('safety_alert', {
        tripId,
        mensaje: mensaje || 'Se activó una alerta de seguridad.',
        from: socket.user.role,
        timestamp: new Date().toISOString(),
      })
    })
  })

  return io
}

export function getIO() {
  return io
}

export function emitTripStatusChanged(tripId, status) {
  if (!io) return
  io.to(`trip:${tripId}`).emit('trip_status_changed', {
    tripId,
    status,
    timestamp: new Date().toISOString(),
  })
}

// Avisa a un conductor puntual (room `user:<driverId>`) que hay un pedido nuevo
// disponible para él, sin importar en qué pantalla esté dentro de la app.
export function emitNewTripRequest(driverId, trip) {
  if (!io) return
  io.to(`user:${driverId}`).emit('new_trip_request', {
    ...trip,
    timestamp: new Date().toISOString(),
  })
}
