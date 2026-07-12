import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Car, ShieldAlert, AlertTriangle } from 'lucide-react'
import Button from '../../components/Button'
import Card from '../../components/Card'
import RealMap from '../../components/RealMap'
import ShareTripCard from '../../components/ShareTripCard'
import { tripsApi } from '../../api/client'
import { useTripSocket } from '../../api/socket'

export default function UserTrackingRide() {
  const navigate = useNavigate()
  const location = useLocation()
  const tripId = location.state?.tripId
  const [trip, setTrip] = useState(null)
  const [eta, setEta] = useState(null)
  const [error, setError] = useState('')
  const [sosEnviado, setSosEnviado] = useState(false)
  const { location: driverLocation, status, safetyAlert, sendSafetyAlert } = useTripSocket(tripId)

  useEffect(() => {
    if (!tripId) {
      navigate('/user-home', { replace: true })
      return
    }
    tripsApi
      .get(tripId)
      .then(({ trip: t }) => setTrip(t))
      .catch((err) => setError(err.message || 'No pudimos cargar tu viaje.'))
  }, [tripId, navigate])

  useEffect(() => {
    // El conductor cierra el viaje desde su propia pantalla (llegada -> regreso ->
    // completado). Acá solo observamos el estado y navegamos cuando termina de verdad.
    if (status === 'completado') {
      navigate('/user-arrived', { state: { tripId }, replace: true })
    }
  }, [status, tripId, navigate])

  useEffect(() => {
    if (!tripId) return undefined
    let cancelled = false
    const interval = setInterval(async () => {
      try {
        const { trip: t } = await tripsApi.get(tripId)
        if (cancelled) return
        if (t.status === 'completado') {
          navigate('/user-arrived', { state: { tripId }, replace: true })
        } else if (t.status === 'cancelado') {
          setError('El viaje fue cancelado.')
        }
      } catch {
        // Silencioso: el WebSocket es la vía principal, esto es solo respaldo.
      }
    }, 3000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [tripId, navigate])

  const handleRoute = useCallback((_path, leg) => {
    if (leg?.duration) setEta(leg.duration.text)
  }, [])

  const pickup = trip?.pickup?.lat != null ? { lat: trip.pickup.lat, lng: trip.pickup.lng } : undefined
  const dropoff = trip?.dropoff?.lat != null ? { lat: trip.dropoff.lat, lng: trip.dropoff.lng } : undefined
  const driverPos = driverLocation ? { lat: driverLocation.lat, lng: driverLocation.lng } : undefined

  function botonSOS() {
    sendSafetyAlert('El usuario activó el botón SOS.')
    setSosEnviado(true)
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-4 py-4">
        <h1 className="text-lg font-bold text-ink tracking-tight">Viaje en curso</h1>
        <p className="text-ink-muted text-xs">{trip?.driverNombre || 'Tu conductor'} está manejando tu auto a casa</p>
      </div>
      <div className="flex-1 flex flex-col px-4 gap-4">
        <RealMap height="h-64" pickup={pickup} dropoff={dropoff} driverPosition={driverPos} onRouteComputed={handleRoute}>
          <div className="flex flex-col items-center gap-1">
            <Car size={20} strokeWidth={1.5} className="text-accent animate-pulse-slow" />
            <span className="text-ink-muted text-xs">GPS en tiempo real</span>
          </div>
        </RealMap>

        <Card>
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-muted">ETA a destino</span>
            <span className="font-semibold text-ink">{eta || '—'}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-ink-muted">Estado</span>
            <span className="font-semibold text-ink">{status || trip?.status || 'en_viaje'}</span>
          </div>
        </Card>

        {safetyAlert && (
          <Card className="bg-red-500/10 border-red-700">
            <p className="text-xs text-red-400">{safetyAlert.mensaje}</p>
          </Card>
        )}

        <Card className="bg-surface-2">
          <p className="text-xs text-ink-muted flex items-start gap-2">
            <ShieldAlert size={16} strokeWidth={1.75} className="text-accent shrink-0 mt-0.5" />
            Monitoreamos la ruta automáticamente: te avisamos ante paradas de más de 10 min, desvíos de ruta o velocidad excesiva.
          </p>
        </Card>

        <ShareTripCard tripId={tripId} />

        <Button variant="danger" className="flex items-center justify-center gap-2" onClick={botonSOS} disabled={sosEnviado}>
          <AlertTriangle size={16} strokeWidth={1.75} /> {sosEnviado ? 'Alerta enviada' : 'Botón SOS'}
        </Button>

        {error && <p className="text-red-500 text-xs">{error}</p>}
        <p className="mb-4 text-center text-xs text-ink-faint">
          Te avisamos automáticamente en cuanto tu auto llegue a destino.
        </p>
      </div>
    </div>
  )
}
