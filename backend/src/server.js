import http from 'node:http'
import dotenv from 'dotenv'
import { createApp } from './app.js'
import { initWebSocket } from './ws/index.js'
import { pool, checkConnection } from './db/pool.js'

dotenv.config()

const PORT = process.env.PORT || 3001

const app = createApp()
const server = http.createServer(app)

initWebSocket(server, { pool })

server.listen(PORT, async () => {
  console.log(`[server] YoBorracho backend escuchando en http://localhost:${PORT}`)
  const dbOk = await checkConnection()
  if (dbOk) {
    console.log('[server] Conexión a PostgreSQL OK.')
  } else {
    console.warn(
      '[server] No se pudo conectar a PostgreSQL. El servidor sigue corriendo, pero las rutas que usan la base de datos van a devolver error 503 hasta que la conexión esté disponible.'
    )
  }
})

// Evitamos que errores no controlados tiren abajo todo el proceso en desarrollo.
process.on('unhandledRejection', (reason) => {
  console.error('[server] unhandledRejection:', reason)
})
process.on('uncaughtException', (err) => {
  console.error('[server] uncaughtException:', err)
})
