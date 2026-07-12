import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Car, ShieldCheck, MapPin } from 'lucide-react'
import Card from '../../components/Card'
import RealMap from '../../components/RealMap'
import { tripsApi } from '../../api/client'

// Página PÚBLICA (sin login) — es el link que un usuario le manda a un contacto
// de confianza por WhatsApp para que pueda ver su viaje en tiempo real sin
// necesidad de tener la app ni una cuenta. Solo lee /api/trips/:id/public, que
// no requiere autenticación y devuelve datos mínimos (sin email/teléfono/pagos).
const ESTADO_LABEL = {
  solicitud: 'Buscando conductor…',
  matching: 'Buscando conductor…',
  aceptado: 'Conductor asignado, yendo al punto de encuentro',
  traslado_al_punto: 'El conductor está yendo a buscar el auto',
  verificacion: 'El conductor está verificando todo en el punto de encuentro',
  en_viaje: 'En viaje — el conductor está manejando el auto',
  llegada: 'Llegaron a destino',
  regreso_conductor: 'El conductor está volviendo a su casa',
  completado: 'Viaje finalizado',
  cancelado: 'Viaje cancelado',
}

export default function TripTrack() {
  const { tripId } = useParams()
  const [trip, setTrip] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (!tripId) return undefined

    let cancelled = false

    async function poll() {
      try {
        const { trip: t } = await tripsApi.getPublic(tripId)
        if (cancelled) return
        setTrip(t)
        setError('')
        if (!t.activo && intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'No pudimos cargar este viaje.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    poll()
    intervalRef.current = setInterval(poll, 4000)
    return () => {
      cancelled = true
      clearInterval(intervalRef.current)
    }
  }, [tripId])

  const pickup = trip?.pickup?.lat != null ? { lat: trip.pickup.lat, lng: trip.pickup.lng } : undefined
  const dropoff = trip?.dropoff?.lat != null ? { lat: trip.dropoff.lat, lng: trip.dropoff.lng } : undefined
  const driverPos = trip?.lastLocation ? { lat: trip.lastLocation.lat, lng: trip.lastLocation.lng } : undefined

  return (
    <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar">
      <div className="px-4 py-4 border-b border-subtle">
        <p className="text-xs text-ink-faint flex items-center gap-1.5">
          <ShieldCheck size={14} strokeWidth={1.75} className="text-accent" /> Seguimiento compartido — YoBorracho
        </p>
        <h1 className="text-lg font-bold text-ink tracking-tight mt-0.5">
          {loading ? 'Cargando viaje…' : trip ? `Viaje de ${trip.riderNombre}` : 'Viaje no encontrado'}
        </h1>
      </div>

      <div className="flex-1 flex flex-col px-4 py-4 gap-4 max-w-md mx-auto w-full">
        {error && !trip && (
          <Card>
            <p className="text-sm text-red-400">{error}</p>
            <p className="text-xs text-ink-faint mt-2">
              Puede que el link haya expirado o el viaje ya no exista.
            </p>
          </Card>
        )}

        {trip && (
          <>
            <RealMap height="h-64" pickup={pickup} dropoff={dropoff} driverPosition={driverPos} showRoute={Boolean(pickup && dropoff)}>
              <div className="flex items-center gap-2">
                <Car size={16} strokeWidth={1.75} className="text-accent" />
                <span className="text-ink-muted text-xs">{driverPos ? 'Última ubicación conocida' : 'Todavía sin ubicación en vivo'}</span>
              </div>
            </RealMap>

            <Card>
              <p className="text-xs text-ink-muted mb-1">Estado actual</p>
              <p className="text-base font-semibold text-ink">{ESTADO_LABEL[trip.status] || trip.status}</p>
              {trip.driverNombre && (
                <p className="text-xs text-ink-muted mt-2">Conductor: {trip.driverNombre}</p>
              )}
            </Card>

            <Card>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-start gap-2">
                  <MapPin size={14} strokeWidth={1.75} className="text-accent shrink-0 mt-0.5" />
                  <span className="text-ink">{trip.pickup?.address}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin size={14} strokeWidth={1.75} className="text-ink-muted shrink-0 mt-0.5" />
                  <span className="text-ink">{trip.dropoff?.address}</span>
                </div>
              </div>
            </Card>

            {!trip.activo && (
              <Card className="bg-surface-2">
                <p className="text-xs text-ink-muted text-center">
                  Este viaje ya terminó. Esta página dejó de actualizarse.
                </p>
              </Card>
            )}

            <p className="text-[11px] text-ink-faint text-center mt-auto">
              Esta página se actualiza sola cada pocos segundos mientras el viaje esté activo.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
