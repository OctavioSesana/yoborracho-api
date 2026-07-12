// Estimación de tarifa en el cliente, SOLO para mostrar un precio orientativo
// antes de confirmar el pedido (pantalla user-request-3). Replica la fórmula
// de backend/src/utils/fare.js. La tarifa autoritativa siempre la calcula y
// devuelve el backend en la respuesta de POST /api/trips; ese valor es el que
// se usa en el resto del flujo (esta estimación nunca se envía al servidor).

const TARIFA_BASE = 3500
const TARIFA_POR_KM = 650
const DISTANCIA_INCLUIDA_KM = 2

export function distanciaHaversineKm(lat1, lng1, lat2, lng2) {
  if ([lat1, lng1, lat2, lng2].some((v) => v === null || v === undefined)) return 5
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function calcularTarifaEstimada(distanciaKm = 0) {
  const km = Math.max(0, Number(distanciaKm) || 0)
  const kmExtra = Math.max(0, km - DISTANCIA_INCLUIDA_KM)
  const total = Math.round(TARIFA_BASE + kmExtra * TARIFA_POR_KM)
  return Math.max(total, TARIFA_BASE)
}

export function calcularDesglose(total) {
  return {
    total,
    conductor: Math.round(total * 0.65),
    plataforma: Math.round(total * 0.2),
    fondoSeguro: Math.round(total * 0.1),
    fondoDanos: Math.round(total * 0.05),
  }
}
