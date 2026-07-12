import jwt from 'jsonwebtoken'

export function signToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const [scheme, token] = header.split(' ')

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'No autorizado. Falta el token de acceso.' })
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.user = { id: payload.sub, role: payload.role, email: payload.email }
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado.' })
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'No tenés permisos para realizar esta acción.' })
    }
    next()
  }
}
