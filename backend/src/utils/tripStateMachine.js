// Máquina de estados del viaje (flujo de 9 pasos del producto).
// Cada estado sólo puede avanzar a los estados listados, o cancelarse
// (salvo que ya esté completado/cancelado).

export const ESTADOS = [
  'solicitud',
  'matching',
  'aceptado',
  'traslado_al_punto',
  'verificacion',
  'en_viaje',
  'llegada',
  'regreso_conductor',
  'completado',
  'cancelado',
]

const TRANSICIONES = {
  solicitud: ['matching', 'cancelado'],
  matching: ['aceptado', 'cancelado'],
  aceptado: ['traslado_al_punto', 'cancelado'],
  traslado_al_punto: ['verificacion', 'cancelado'],
  verificacion: ['en_viaje', 'cancelado'],
  en_viaje: ['llegada', 'cancelado'],
  llegada: ['regreso_conductor', 'cancelado'],
  regreso_conductor: ['completado', 'cancelado'],
  completado: [],
  cancelado: [],
}

// Columna con el timestamp que corresponde marcar al entrar a cada estado.
export const TIMESTAMP_COLUMNS = {
  solicitud: 'requested_at',
  matching: 'matched_at',
  aceptado: 'accepted_at',
  traslado_al_punto: 'traslado_al_punto_at',
  verificacion: 'verificacion_at',
  en_viaje: 'en_viaje_at',
  llegada: 'llegada_at',
  regreso_conductor: 'regreso_conductor_at',
  completado: 'completado_at',
  cancelado: 'cancelado_at',
}

export function puedeTransicionar(estadoActual, estadoNuevo) {
  if (!TRANSICIONES[estadoActual]) return false
  return TRANSICIONES[estadoActual].includes(estadoNuevo)
}
