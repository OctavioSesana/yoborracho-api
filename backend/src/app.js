import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

import authRoutes from './routes/auth.routes.js'
import usersRoutes from './routes/users.routes.js'
import driversRoutes from './routes/drivers.routes.js'
import vehiclesRoutes from './routes/vehicles.routes.js'
import addressesRoutes from './routes/addresses.routes.js'
import contactsRoutes from './routes/contacts.routes.js'
import tripsRoutes from './routes/trips.routes.js'
import notificationsRoutes from './routes/notifications.routes.js'
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js'
import { checkConnection } from './db/pool.js'
import { isOriginAllowed } from './utils/corsOrigins.js'

dotenv.config()

export function createApp() {
  const app = express()

  app.use(
    cors({
      origin: (origin, callback) => {
        if (isOriginAllowed(origin)) callback(null, true)
        else callback(new Error(`Origen no permitido por CORS: ${origin}`))
      },
      credentials: true,
    })
  )
  app.use(express.json())

  app.get('/health', async (req, res) => {
    const dbOk = await checkConnection()
    res.status(dbOk ? 200 : 503).json({
      ok: dbOk,
      service: 'yoborracho-backend',
      db: dbOk ? 'conectada' : 'desconectada',
      timestamp: new Date().toISOString(),
    })
  })

  app.use('/api/auth', authRoutes)
  app.use('/api/users', usersRoutes)
  app.use('/api/drivers', driversRoutes)
  app.use('/api/vehicles', vehiclesRoutes)
  app.use('/api/addresses', addressesRoutes)
  app.use('/api/contacts', contactsRoutes)
  app.use('/api/trips', tripsRoutes)
  app.use('/api/notifications', notificationsRoutes)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
