import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Car, MessageCircle, Phone } from 'lucide-react'
import Button from '../../components/Button'
import Card from '../../components/Card'
import RealMap from '../../components/RealMap'
import Avatar from '../../components/Avatar'
import ConfirmDialog from '../../components/ConfirmDialog'
import { tripsApi } from '../../api/client'

export default function DriverApproach() {
  const navigate = useNavigate()
  const location = useLocation()
  const tripId = location.state?.tripId
  const [trip, setTrip] = useState(null)
  const [error, setError] = useState('')
  const [advancing, setAdvancing] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelledByOther, setCancelledByOther] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    if (!tripId) {
      navigate('/driver-home', { replace: true })
      return
    }
    let cancelled = false
    async function load() {
      try {
        const { trip: t } = await tripsApi.get(tripId)
        if (cancelled) return
        setTrip(t)
        // Este viaje ya fue aceptado; esta pantalla representa el traslado al punto de encuentro.
        if (t.status === 'aceptado') {
          const { trip: updated } = await tripsApi.updateStatus(tripId, 'traslado_al_punto')
          if (!cancelled) setTrip(updated)
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'No pudimos cargar el viaje.')
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [tripId, navigate])

  useEffect(() => {
    // Si el pasajero cancela mientras vamos en camino, nos enteramos por polling
    // (esta pantalla no usa WebSocket, alcanza con consultar cada 3s).
    if (!tripId || cancelling || cancelledByOther) return undefined
    let cancelled = false
    const interval = setInterval(async () => {
      try {
        const { trip: t } = await tripsApi.get(tripId)
        if (cancelled) return
        if (t.status === 'cancelado') setCancelledByOther(true)
      } catch {
        // Silencioso.
      }
    }, 3000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [tripId, cancelling, cancelledByOther])

  useEffect(() => {
    if (!cancelledByOther) return undefined
    const t = setTimeout(() => navigate('/driver-home', { replace: true }), 2500)
    return () => clearTimeout(t)
  }, [cancelledByOther, navigate])

  async function llegueAlPunto() {
    setAdvancing(true)
    setError('')
    try {
      await tripsApi.updateStatus(tripId, 'verificacion')
      navigate('/driver-checkin', { state: { tripId } })
    } catch (err) {
      setError(err.message || 'No pudimos actualizar el viaje.')
    } finally {
      setAdvancing(false)
    }
  }

  async function cancelarViaje() {
    if (!tripId || cancelling) return
    setConfirmOpen(false)
    setCancelling(true)
    setError('')
    try {
      await tripsApi.updateStatus(tripId, 'cancelado', 'Cancelado por el conductor en camino al punto de encuentro.')
      navigate('/driver-home', { replace: true })
    } catch (err) {
      setError(err.message || 'No pudimos cancelar el viaje. Probá de nuevo.')
      setCancelling(false)
    }
  }

  const pickup = trip?.pickup?.lat != null ? { lat: trip.pickup.lat, lng: trip.pickup.lng } : undefined

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-4 py-4">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Yendo al punto de encuentro</h1>
        <p className="text-ink-muted text-xs mt-1">Te estás trasladando en Uber/remis</p>
      </div>
      <div className="flex-1 flex flex-col px-4 gap-4">
        <RealMap height="h-56" pickup={pickup} showRoute={false}>
          <span className="text-ink-muted text-sm flex items-center gap-2">
            <Car size={16} strokeWidth={1.75} /> En camino
          </span>
        </RealMap>

        <Card>
          <div className="flex items-center gap-3">
            <Avatar name={trip?.riderNombre} size="lg" />
            <div className="flex-1">
              <p className="font-semibold text-ink">{trip?.riderNombre || 'Pasajero'}</p>
              <p className="text-xs text-ink-muted">{trip?.pickup?.address}</p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary">
            <span className="flex items-center justify-center gap-2"><MessageCircle size={16} strokeWidth={1.75} /> Mensaje</span>
          </Button>
          <Button variant="secondary">
            <span className="flex items-center justify-center gap-2"><Phone size={16} strokeWidth={1.75} /> Llamar</span>
          </Button>
        </div>

        {error && <p className="text-red-500 text-xs">{error}</p>}

        {cancelledByOther ? (
          <p className="mt-auto mb-4 text-center text-sm text-red-400">
            El pasajero canceló el viaje. Volviendo al inicio…
          </p>
        ) : (
          <div className="mt-auto mb-4 flex flex-col gap-2">
            <Button disabled={advancing || !trip} onClick={llegueAlPunto}>
              {advancing ? 'Actualizando…' : 'Llegué al punto de encuentro'}
            </Button>
            <Button variant="secondary" disabled={cancelling || !trip} onClick={() => setConfirmOpen(true)}>
              {cancelling ? 'Cancelando…' : 'Cancelar viaje'}
            </Button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="¿Cancelar este viaje?"
        message="Se le va a avisar al pasajero que cancelaste este viaje."
        confirmLabel="Sí, cancelar"
        cancelLabel="Volver"
        danger
        onConfirm={cancelarViaje}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}
