// Lista de orígenes permitidos, compartida entre CORS de Express y de Socket.io.
// CORS_ORIGIN puede ser una lista separada por comas (ej. "http://localhost:5173,http://localhost:5174").
// Si el origen no está en la lista, en desarrollo igual permitimos cualquier localhost:<puerto> —
// Vite corre en 5173 por defecto pero salta al siguiente puerto libre (5174, 5175...) si ese ya está ocupado.

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

export function isOriginAllowed(origin) {
  if (!origin) return true // requests sin origin (curl, health checks, apps nativas, etc.)
  if (allowedOrigins.includes(origin)) return true
  if (process.env.NODE_ENV !== 'production' && /^http:\/\/localhost:\d+$/.test(origin)) return true
  return false
}
