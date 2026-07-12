// Recordatorio automático para el conductor: si pide su regreso (Uber/remis) desde
// la app pero se olvida de volver a confirmar "Llegué a casa", le mandamos una
// notificación pasado un tiempo para que no quede el viaje colgado sin cerrar.
//
// Implementación simple con setTimeout en memoria del proceso — suficiente para
// este prototipo (dev local / un solo contenedor de backend). En producción esto
// se movería a un job scheduler persistente (cron, cola, etc.) para sobrevivir
// reinicios del servidor.

import { pool } from '../db/pool.js'

const RECORDATORIO_MS = Number(process.env.REGRESO_RECORDATORIO_MS) || 3 * 60 * 1000 // 3 min por defecto

export function scheduleRegresoReminder(tripId, driverId) {
  setTimeout(async () => {
    try {
      const { rows } = await pool.query('SELECT status FROM trips WHERE id = $1', [tripId])
      const trip = rows[0]
      // Solo recordamos si el viaje sigue exactamente en "regreso_conductor"
      // (si ya se completó, se canceló, o nunca llegó a este estado, no hace falta).
      if (!trip || trip.status !== 'regreso_conductor') return

      await pool.query(
        `INSERT INTO notifications (user_id, tipo, titulo, detalle)
         VALUES ($1, 'viaje', '¿Ya volviste a tu casa?', 'Confirmá tu regreso en la app para cerrar el viaje y poder calificar a tu pasajero.')`,
        [driverId]
      )
    } catch (err) {
      console.error('[regresoReminder] Error al programar recordatorio:', err)
    }
  }, RECORDATORIO_MS)
}
