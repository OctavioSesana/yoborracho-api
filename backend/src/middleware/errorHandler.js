export function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Recurso no encontrado.' })
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  console.error('[error]', err)

  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Datos inválidos.',
      detalles: err.issues?.map((i) => ({ campo: i.path.join('.'), mensaje: i.message })),
    })
  }

  if (err.code === '23505') {
    return res.status(409).json({ error: 'Ese registro ya existe (valor duplicado).' })
  }

  if (err.code === '23503') {
    return res.status(400).json({ error: 'Referencia inválida en la solicitud.' })
  }

  // Errores de conexión a la base de datos: no tirar abajo el proceso
  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    return res.status(503).json({ error: 'El servicio no está disponible en este momento. Intentá de nuevo en unos minutos.' })
  }

  const status = err.status || 500
  res.status(status).json({ error: err.publicMessage || 'Error interno del servidor.' })
}

export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)
}
