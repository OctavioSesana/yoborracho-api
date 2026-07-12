import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star, MapPin, Square } from 'lucide-react'
import Button from '../../components/Button'
import Card from '../../components/Card'
import Avatar from '../../components/Avatar'
import { tripsApi } from '../../api/client'
import { distanciaHaversineKm } from '../../lib/fareEstimate'

export default function DriverRequest() {
  const navigate = useNavigate()
  const [seconds, setSeconds] = useState(15)
  const [trip, setTrip] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [accepting, setAccepting] = useState(false)

  useEffect(() => {
    tripsApi
      .available()
      .then(({ trips }) => setTrip(trips[0] || null))
      .catch((err) => setError(err.message || 'No pudimos buscar pedidos disponibles.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!trip) return undefined
    if (seconds <= 0) {
      navigate('/driver-home')
      return undefined
    }
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [seconds, navigate, trip])

  async function aceptar() {
    if (!trip) return
    setAccepting(true)
    setError('')
    try {
      const { trip: accepted } = await tripsApi.accept(trip.id)
      navigate('/driver-approach', { state: { tripId: accepted.id } })
    } catch (err) {
      setError(err.message || 'Ese pedido ya no está disponible.')
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-ink-muted text-sm">Buscando pedidos disponibles…</p>
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-4">
        <p className="text-ink-muted text-sm">{error || 'No hay pedidos disponibles en tu zona por ahora.'}</p>
        <Button onClick={() => navigate('/driver-home')}>Volver al inicio</Button>
      </div>
    )
  }

  const distanciaKm = distanciaHaversineKm(trip.pickup?.lat, trip.pickup?.lng, trip.dropoff?.lat, trip.dropoff?.lng)

  return (
    <div className="flex-1 flex flex-col px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Nuevo pedido</h1>
        <div className="w-10 h-10 rounded-full border-2 border-accent flex items-center justify-center font-bold text-ink">
          {seconds}
        </div>
      </div>

      <Card className="mb-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar name={trip.riderNombre} size="md" />
          <div>
            <p className="font-semibold text-ink">{trip.riderNombre}</p>
            <p className="text-xs text-ink-muted flex items-center gap-1">
              <Star size={12} strokeWidth={1.75} className="text-accent fill-accent" /> pasajero
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 text-sm text-ink">
          <div className="flex items-center gap-2"><MapPin size={14} strokeWidth={1.75} className="text-accent" /> {trip.pickup?.address}</div>
          <div className="flex items-center gap-2"><Square size={10} strokeWidth={1.75} className="text-red-400 fill-red-400" /> {trip.dropoff?.address}</div>
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-subtle">
          <span className="text-xs text-ink-muted">Distancia estimada</span>
          <span className="text-sm font-semibold text-ink">{distanciaKm.toFixed(1)} km</span>
        </div>
      </Card>

      <Card className="mb-6 bg-accent/10 border-accent/30">
        <p className="text-xs text-ink-muted">Tu ganancia estimada</p>
        <p className="text-3xl font-bold text-accent">${Number(trip.fareBreakdown?.conductor || 0).toLocaleString('es-AR')}</p>
        <p className="text-[11px] text-ink-muted mt-1">65% de ${Number(trip.fareTotal || 0).toLocaleString('es-AR')} · incluye tu regreso</p>
      </Card>

      {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
      <div className="grid grid-cols-2 gap-3 mt-auto">
        <Button variant="danger" onClick={() => navigate('/driver-home')} disabled={accepting}>Rechazar</Button>
        <Button variant="success" onClick={aceptar} disabled={accepting}>{accepting ? 'Aceptando…' : 'Aceptar'}</Button>
      </div>
    </div>
  )
}
