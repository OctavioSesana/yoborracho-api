import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Car, MessageCircle, Phone, ShieldCheck } from 'lucide-react'
import Button from '../../components/Button'
import Card from '../../components/Card'
import RealMap from '../../components/RealMap'
import Avatar from '../../components/Avatar'
import ConfirmDialog from '../../components/ConfirmDialog'
import ShareTripCard from '../../components/ShareTripCard'
import { tripsApi } from '../../api/client'
import { useTripSocket } from '../../api/socket'

export default function UserTrackingArrive() {
  const navigate = useNavigate()
  const location = useLocation()
  const tripId = location.state?.tripId
  const [trip, setTrip] = useState(null)
  const [error, setError] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [cancelledByOther, setCancelledByOther] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const { location: driverLocation, status } = useTripSocket(tripId)

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
    // El conductor es quien realmente hace avanzar el viaje (llega al punto,
    // verifica, inicia). Acá solo observamos: por WebSocket si está conectado,
    // y con un polling de respaldo cada 3s por si el socket se desconecta.
    if (status === 'en_viaje') {
      navigate('/user-tracking-ride', { state: { tripId }, replace: true })
    } else if (status === 'cancelado') {
      setCancelledByOther(true)
    }
  }, [status, tripId, navigate])

  useEffect(() => {
    if (!tripId || cancelling || cancelledByOther) return undefined
    let cancelled = false
    const interval = setInterval(async () => {
      try {
        const { trip: t } = await tripsApi.get(tripId)
        if (cancelled) return
        if (t.status === 'en_viaje') {
          navigate('/user-tracking-ride', { state: { tripId }, replace: true })
        } else if (t.status === 'cancelado') {
          setCancelledByOther(true)
        }
      } catch {
        // Silencioso: el WebSocket es la vía principal, esto es solo respaldo.
      }
    }, 3000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [tripId, navigate, cancelling, cancelledByOther])

  useEffect(() => {
    if (!cancelledByOther) return undefined
    const t = setTimeout(() => navigate('/user-home', { replace: true }), 2500)
    return () => clearTimeout(t)
  }, [cancelledByOther, navigate])

  async function cancelarViaje() {
    if (!tripId || cancelling) return
    setConfirmOpen(false)
    setCancelling(true)
    setError('')
    try {
      await tripsApi.updateStatus(tripId, 'cancelado', 'Cancelado por el usuario con conductor en camino.')
      navigate('/user-home', { replace: true })
    } catch (err) {
      setError(err.message || 'No pudimos cancelar el viaje. Probá de nuevo.')
      setCancelling(false)
    }
  }

  const pickup =
    trip?.pickup?.lat != null ? { lat: trip.pickup.lat, lng: trip.pickup.lng } : undefined
  const driverPos = driverLocation ? { lat: driverLocation.lat, lng: driverLocation.lng } : undefined

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-4 py-4">
        <h1 className="text-lg font-bold text-ink tracking-tight">Tu conductor está en camino</h1>
        <p className="text-ink-muted text-xs">Se está trasladando en Uber/remis hasta tu ubicación</p>
      </div>
      <div className="flex-1 flex flex-col px-4 gap-4">
        <RealMap height="h-56" pickup={pickup} driverPosition={driverPos} showRoute={false}>
          <span className="text-ink-muted text-sm flex items-center gap-1">
            <Car size={16} strokeWidth={1.75} /> {driverPos ? 'En camino' : 'Esperando ubicación del conductor…'}
          </span>
        </RealMap>

        <Card>
          <div className="flex items-center gap-3">
            <Avatar name={trip?.driverNombre} size="lg" />
            <div className="flex-1">
              <p className="font-semibold text-ink">{trip?.driverNombre || 'Conductor asignado'}</p>
              <p className="text-xs text-ink-muted flex items-center gap-1">
                <ShieldCheck size={12} strokeWidth={1.75} className="text-accent" /> Verificado
              </p>
              {trip && <p className="text-xs text-ink-faint">Viaje #{trip.id?.slice(0, 8)}</p>}
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" className="flex items-center justify-center gap-2">
            <MessageCircle size={16} strokeWidth={1.75} /> Mensaje
          </Button>
          <Button variant="secondary" className="flex items-center justify-center gap-2">
            <Phone size={16} strokeWidth={1.75} /> Llamar
          </Button>
        </div>

        <ShareTripCard tripId={tripId} />

        {error && <p className="text-red-500 text-xs">{error}</p>}

        {cancelledByOther ? (
          <p className="mt-auto mb-4 text-center text-sm text-red-400">
            El conductor canceló el viaje. Volviendo al inicio…
          </p>
        ) : (
          <>
            <p className="mt-auto text-center text-xs text-ink-faint">
              Te avisamos automáticamente en cuanto el conductor confirme la verificación e inicie el viaje.
            </p>
            <Button variant="secondary" className="mb-4" disabled={cancelling} onClick={() => setConfirmOpen(true)}>
              {cancelling ? 'Cancelando…' : 'Cancelar viaje'}
            </Button>
          </>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="¿Cancelar este viaje?"
        message="El conductor ya está en camino hacia vos. Se le va a avisar que cancelaste."
        confirmLabel="Sí, cancelar"
        cancelLabel="Volver"
        danger
        onConfirm={cancelarViaje}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}
