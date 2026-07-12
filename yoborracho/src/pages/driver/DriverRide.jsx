import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Car, ShieldAlert } from 'lucide-react'
import Button from '../../components/Button'
import Card from '../../components/Card'
import RealMap from '../../components/RealMap'
import { tripsApi } from '../../api/client'
import { useTripSocket } from '../../api/socket'

export default function DriverRide() {
  const navigate = useNavigate()
  const location = useLocation()
  const tripId = location.state?.tripId
  const [trip, setTrip] = useState(null)
  const [eta, setEta] = useState(null)
  const [error, setError] = useState('')
  const [finishing, setFinishing] = useState(false)
  const [simPosition, setSimPosition] = useState(null)
  const routePathRef = useRef([])
  const pathIndexRef = useRef(0)
  const { sendLocation } = useTripSocket(tripId)

  useEffect(() => {
    if (!tripId) {
      navigate('/driver-home', { replace: true })
      return
    }
    tripsApi
      .get(tripId)
      .then(({ trip: t }) => setTrip(t))
      .catch((err) => setError(err.message || 'No pudimos cargar el viaje.'))
  }, [tripId, navigate])

  const handleRoute = useCallback((path, leg) => {
    routePathRef.current = path
    pathIndexRef.current = 0
    if (leg?.duration) setEta(leg.duration.text)
    if (path.length) setSimPosition(path[0])
  }, [])

  // Simula el movimiento del conductor interpolando puntos reales de la ruta
  // (devuelta por la Directions API) y emitiendo `location_update` por WebSocket
  // cada 2 segundos, como haría un GPS real en producción.
  useEffect(() => {
    if (!tripId) return undefined
    const interval = setInterval(() => {
      const path = routePathRef.current
      if (!path.length) return
      pathIndexRef.current = Math.min(pathIndexRef.current + 1, path.length - 1)
      const point = path[pathIndexRef.current]
      setSimPosition(point)
      sendLocation(point.lat, point.lng)
    }, 2000)
    return () => clearInterval(interval)
  }, [tripId, sendLocation])

  const pickup = trip?.pickup?.lat != null ? { lat: trip.pickup.lat, lng: trip.pickup.lng } : undefined
  const dropoff = trip?.dropoff?.lat != null ? { lat: trip.dropoff.lat, lng: trip.dropoff.lng } : undefined

  async function llegamosADestino() {
    if (!tripId) return
    setFinishing(true)
    setError('')
    try {
      await tripsApi.updateStatus(tripId, 'llegada')
      navigate('/driver-dropoff', { state: { tripId } })
    } catch (err) {
      setError(err.message || 'No pudimos actualizar el viaje.')
    } finally {
      setFinishing(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-4 py-4">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Viaje activo</h1>
        <p className="text-ink-muted text-xs mt-1">Llevando a {trip?.riderNombre || 'tu pasajero'} y su auto a destino</p>
      </div>
      <div className="flex-1 flex flex-col px-4 gap-4">
        <RealMap height="h-56" pickup={pickup} dropoff={dropoff} driverPosition={simPosition} onRouteComputed={handleRoute}>
          <div className="flex flex-col items-center gap-1">
            <Car size={20} strokeWidth={1.5} className="text-accent animate-pulse-slow" />
            <span className="text-ink-muted text-xs">GPS en tiempo real (simulado sobre la ruta real)</span>
          </div>
        </RealMap>

        <Card>
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-muted">Destino</span>
            <span className="font-semibold text-ink">{trip?.dropoff?.address || '—'}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-ink-muted">ETA</span>
            <span className="font-semibold text-ink">{eta || '—'}</span>
          </div>
        </Card>

        <Button variant="danger" className="text-base py-4">
          <span className="flex items-center justify-center gap-2">
            <ShieldAlert size={20} strokeWidth={1.75} /> Botón SOS
          </span>
        </Button>

        <Card className="bg-surface-2">
          <p className="text-xs text-ink-muted">
            Recordá: manejo defensivo, respetá los límites de velocidad y mantené la comunicación con el pasajero.
          </p>
        </Card>

        {error && <p className="text-red-500 text-xs">{error}</p>}
        <Button className="mt-auto mb-4" disabled={finishing} onClick={llegamosADestino}>
          {finishing ? 'Actualizando…' : 'Llegamos a destino'}
        </Button>
      </div>
    </div>
  )
}
