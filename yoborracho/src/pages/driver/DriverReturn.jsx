import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Car, ExternalLink, Wallet, Bell } from 'lucide-react'
import Button from '../../components/Button'
import Card from '../../components/Card'
import { tripsApi } from '../../api/client'

// Paso 8 del flujo: "Regreso del conductor — Pide Uber/remis (costo incluido en tarifa)".
//
// Ese viaje de vuelta pasa en una app externa (Uber/Cabify), no dentro de YoBorracho —
// así que acá no simulamos nada: solo le damos al conductor un atajo para pedirlo con
// un toque (deep link a Uber, con el punto de partida ya cargado) y un botón siempre
// disponible para cerrar el viaje cuando esté de vuelta. Si se olvida, el backend le
// manda un recordatorio pasado un rato (ver regresoReminder.js).
export default function DriverReturn() {
  const navigate = useNavigate()
  const location = useLocation()
  const tripId = location.state?.tripId
  const [trip, setTrip] = useState(null)
  const [error, setError] = useState('')
  const [finishing, setFinishing] = useState(false)

  useEffect(() => {
    if (!tripId) {
      navigate('/driver-home', { replace: true })
      return
    }
    tripsApi.get(tripId).then(({ trip: t }) => setTrip(t)).catch(() => {})
  }, [tripId, navigate])

  async function llegueACasa() {
    if (!tripId) return
    setFinishing(true)
    setError('')
    try {
      await tripsApi.updateStatus(tripId, 'completado')
      navigate('/driver-rate', { state: { tripId } })
    } catch (err) {
      setError(err.message || 'No pudimos cerrar el viaje.')
    } finally {
      setFinishing(false)
    }
  }

  const ganancia = trip?.fareBreakdown?.conductor || 0

  // Deep link real de Uber: abre la app (o uber.com si no está instalada) con el
  // punto de partida ya cargado en la ubicación donde el conductor dejó el auto.
  // No cargamos destino porque no tenemos guardada la dirección de su casa —
  // el conductor la elige él mismo al abrir Uber.
  const uberUrl = (() => {
    const params = new URLSearchParams({ action: 'setPickup' })
    if (trip?.dropoff?.lat != null && trip?.dropoff?.lng != null) {
      params.set('pickup[latitude]', String(trip.dropoff.lat))
      params.set('pickup[longitude]', String(trip.dropoff.lng))
      if (trip.dropoff.address) params.set('pickup[formatted_address]', trip.dropoff.address)
    } else {
      params.set('pickup', 'my_location')
    }
    return `https://m.uber.com/ul/?${params.toString()}`
  })()

  return (
    <div className="flex-1 flex flex-col px-6 py-8 items-center text-center gap-5">
      <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
        <Car size={28} strokeWidth={1.75} className="text-accent" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-ink">Solicitá tu regreso</h1>
      <p className="text-ink-muted text-sm -mt-3">
        Ya dejaste el auto en destino. Pedí un Uber/remis para volver a tu casa.
      </p>

      <Card className="w-full bg-accent/10 border-accent/30">
        <p className="text-xs text-ink-muted flex items-center gap-2 justify-center">
          <Wallet size={14} strokeWidth={1.75} className="text-accent" /> Tu regreso ya está pagado
        </p>
        <p className="text-[11px] text-ink-muted mt-1">
          El costo de este viaje de vuelta ya está incluido en la tarifa que cobraste
          {ganancia ? ` ($${Number(ganancia).toLocaleString('es-AR')})` : ''}. No pagás nada aparte.
        </p>
      </Card>

      <a
        href={uberUrl}
        target="_blank"
        rel="noreferrer"
        className="w-full flex items-center justify-center gap-2 rounded-lg font-semibold text-sm py-3.5 px-4 bg-black hover:bg-surface-4 text-white border border-subtle transition-colors active:scale-[0.98]"
      >
        Abrir Uber para volver a casa <ExternalLink size={16} strokeWidth={1.75} />
      </a>

      <Card className="w-full text-left bg-surface-2">
        <p className="text-xs text-ink-muted flex items-start gap-2">
          <Bell size={16} strokeWidth={1.75} className="text-accent shrink-0 mt-0.5" />
          Pedí tu Uber, remis, o lo que prefieras — no hace falta que sea desde acá. Cuando llegues a tu casa, volvé a esta pantalla y confirmá abajo. Si te olvidás, te lo recordamos con una notificación.
        </p>
      </Card>

      {error && <p className="text-red-500 text-xs">{error}</p>}
      <Button className="mt-auto w-full" disabled={finishing} onClick={llegueACasa}>
        {finishing ? 'Cerrando viaje…' : 'Ya volví a casa'}
      </Button>
    </div>
  )
}
