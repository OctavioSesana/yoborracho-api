// Cliente HTTP delgado para la API de YoBorracho.
// Lee la URL base de VITE_API_BASE_URL, adjunta el JWT (si existe) y
// normaliza el manejo de errores/JSON de las respuestas del backend.

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'
const TOKEN_KEY = 'yoborracho_token'

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

export function getAuthToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setAuthToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // localStorage no disponible (modo privado, etc.) — seguimos igual en memoria.
  }
}

async function request(path, { method = 'GET', body, params } = {}) {
  let url = `${BASE_URL}${path}`

  if (params) {
    const entries = Object.entries(params).filter(
      ([, v]) => v !== undefined && v !== null && v !== ''
    )
    if (entries.length) {
      url += `?${new URLSearchParams(entries).toString()}`
    }
  }

  const headers = { 'Content-Type': 'application/json' }
  const token = getAuthToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(
      'No se pudo conectar con el servidor. Verificá que el backend esté corriendo en ' + BASE_URL,
      0
    )
  }

  let data = null
  const text = await res.text()
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = null
    }
  }

  if (!res.ok) {
    const message = data?.error || data?.message || `Error ${res.status}`
    throw new ApiError(message, res.status, data)
  }

  return data
}

// ---- Auth ----
export const authApi = {
  register: (payload) => request('/api/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/api/auth/login', { method: 'POST', body: payload }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  me: () => request('/api/auth/me'),
}

// ---- Usuarios ----
export const usersApi = {
  me: () => request('/api/users/me'),
  update: (payload) => request('/api/users/me', { method: 'PATCH', body: payload }),
}

// ---- Conductores ----
export const driversApi = {
  me: () => request('/api/drivers/me'),
  verify: (payload) => request('/api/drivers/verify', { method: 'POST', body: payload }),
  setDisponibilidad: (disponible) =>
    request('/api/drivers/disponibilidad', { method: 'PATCH', body: { disponible } }),
}

// ---- Vehículos ----
export const vehiclesApi = {
  list: () => request('/api/vehicles'),
  create: (payload) => request('/api/vehicles', { method: 'POST', body: payload }),
}

// ---- Direcciones frecuentes ----
export const addressesApi = {
  list: () => request('/api/addresses'),
  create: (payload) => request('/api/addresses', { method: 'POST', body: payload }),
  remove: (id) => request(`/api/addresses/${id}`, { method: 'DELETE' }),
}

// ---- Contactos de confianza ----
export const contactsApi = {
  list: () => request('/api/contacts'),
  create: (payload) => request('/api/contacts', { method: 'POST', body: payload }),
  remove: (id) => request(`/api/contacts/${id}`, { method: 'DELETE' }),
}

// ---- Viajes ----
export const tripsApi = {
  create: (payload) => request('/api/trips', { method: 'POST', body: payload }),
  list: (params) => request('/api/trips', { params }),
  available: () => request('/api/trips/available'),
  get: (id) => request(`/api/trips/${id}`),
  getPublic: (id) => request(`/api/trips/${id}/public`),
  accept: (id) => request(`/api/trips/${id}/accept`, { method: 'POST' }),
  updateStatus: (id, status, cancelReason) =>
    request(`/api/trips/${id}/status`, {
      method: 'PATCH',
      body: cancelReason ? { status, cancelReason } : { status },
    }),
  getLocations: (id) => request(`/api/trips/${id}/locations`),
  postLocation: (id, lat, lng) =>
    request(`/api/trips/${id}/locations`, { method: 'POST', body: { lat, lng } }),
}

// ---- Calificaciones ----
export const ratingsApi = {
  submit: (tripId, payload) => request(`/api/trips/${tripId}/rating`, { method: 'POST', body: payload }),
  get: (tripId) => request(`/api/trips/${tripId}/rating`),
}

// ---- Notificaciones ----
export const notificationsApi = {
  list: () => request('/api/notifications'),
  markRead: (id) => request(`/api/notifications/${id}/read`, { method: 'PATCH' }),
}
