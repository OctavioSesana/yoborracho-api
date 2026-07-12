import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Home, CheckCircle2, Moon } from 'lucide-react'
import Button from '../../components/Button'
import Card from '../../components/Card'
import { tripsApi } from '../../api/client'

export default function UserArrived() {
  const navigate = useNavigate()
  const location = useLocation()
  const tripId = location.state?.tripId
  const [trip, setTrip] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!tripId) return
    tripsApi
      .get(tripId)
      .then(({ trip: t }) => setTrip(t))
      .catch((err) => setError(err.message || 'No pudimos cargar el resumen de tu viaje.'))
  }, [tripId])

  const total = trip?.fareTotal ?? 0

  return (
    <div className="flex-1 flex flex-col px-6 py-10 items-center text-center gap-6">
      <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center">
        <Home size={36} strokeWidth={1.5} className="text-accent" />
      </div>
      <div>
        <h1 className="text-2xl font-bold mb-1 text-ink tracking-tight">¡Llegaste bien a casa!</h1>
        <p className="text-ink-muted text-sm">
          {trip?.driverNombre || 'Tu conductor'} dejó tu auto estacionado y verificó que todo esté en orden.
        </p>
      </div>

      {error && <p className="text-red-500 text-xs">{error}</p>}

      <Card className="w-full text-left">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-ink">Pago</span>
          <span className="text-xs text-emerald-400 flex items-center gap-1">
            <CheckCircle2 size={14} strokeWidth={1.75} /> Confirmado
          </span>
        </div>
        <div className="flex items-center justify-between text-2xl font-bold text-ink">
          <span>Total</span>
          <span className="text-accent">${total.toLocaleString('es-AR')}</span>
        </div>
        <p className="text-[11px] text-ink-muted mt-2">Cobrado con tu método de pago registrado.</p>
      </Card>

      <Card className="w-full text-left">
        <p className="text-xs text-ink-muted flex items-start gap-2">
          <Moon size={16} strokeWidth={1.75} className="text-accent shrink-0 mt-0.5" />
          Mañana te pediremos que califiques tu experiencia con el conductor. Como sabemos que hoy no estabas en tu mejor momento para evaluar, preferimos preguntarte con la cabeza más clara.
        </p>
      </Card>

      <div className="w-full flex flex-col gap-3 mt-auto">
        <Button onClick={() => navigate('/user-rate', { state: { tripId } })}>Simular: calificar ahora</Button>
        <Button variant="secondary" onClick={() => navigate('/user-home')}>Volver al inicio</Button>
      </div>
    </div>
  )
}
