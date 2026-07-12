import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Circle, Square } from 'lucide-react'
import TopBar from '../../components/TopBar'
import Card from '../../components/Card'
import { tripsApi } from '../../api/client'
import { calcularDesglose } from '../../lib/fareEstimate'

export default function UserHistoryDetail() {
  const navigate = useNavigate()
  const location = useLocation()
  const tripId = location.state?.tripId
  const [trip, setTrip] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!tripId) {
      setError('No encontramos ese viaje.')
      setLoading(false)
      return
    }
    tripsApi
      .get(tripId)
      .then(({ trip: t }) => setTrip(t))
      .catch((err) => setError(err.message || 'No pudimos cargar el viaje.'))
      .finally(() => setLoading(false))
  }, [tripId])

  if (loading) {
    return (
      <div className="flex-1 flex flex-col">
        <TopBar title="Viaje" onBack={() => navigate('/user-history')} />
        <p className="text-center text-ink-muted text-sm py-8">Cargando…</p>
      </div>
    )
  }

  if (error || !trip) {
    return (
      <div className="flex-1 flex flex-col">
        <TopBar title="Viaje" onBack={() => navigate('/user-history')} />
        <p className="text-center text-red-500 text-sm py-8">{error || 'Viaje no encontrado.'}</p>
      </div>
    )
  }

  const desglose = trip.fareBreakdown || calcularDesglose(trip.fareTotal || 0)

  return (
    <div className="flex-1 flex flex-col">
      <TopBar title={`Viaje #${trip.id.slice(0, 8)}`} onBack={() => navigate('/user-history')} />
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 flex flex-col gap-4">
        <Card>
          <p className="text-xs text-ink-muted mb-2">{new Date(trip.createdAt).toLocaleString('es-AR')}</p>
          <div className="flex flex-col gap-3">
            <div className="flex gap-3 items-center">
              <Circle size={12} strokeWidth={2} className="text-accent fill-accent" />
              <p className="text-sm text-ink">{trip.pickup?.address}</p>
            </div>
            <div className="flex gap-3 items-center">
              <Square size={12} strokeWidth={2} className="text-ink-muted fill-ink-muted" />
              <p className="text-sm text-ink">{trip.dropoff?.address}</p>
            </div>
          </div>
          <p className={`text-xs mt-3 ${trip.status === 'completado' ? 'text-emerald-400' : 'text-red-400'}`}>{trip.status}</p>
        </Card>

        <Card>
          <p className="text-sm font-semibold mb-1 text-ink">Conductor</p>
          <p className="text-sm text-ink-muted">{trip.driverNombre || '—'}</p>
        </Card>

        {trip.fareTotal > 0 && (
          <Card>
            <p className="text-sm font-semibold mb-3 text-ink">Desglose de tarifa</p>
            <Row label="Total del viaje" value={desglose.total} bold />
            <Row label="Conductor (65%)" value={desglose.conductor} />
            <Row label="Plataforma (20%)" value={desglose.plataforma} />
            <Row label="Fondo de seguro (10%)" value={desglose.fondoSeguro} />
            <Row label="Fondo de daños (5%)" value={desglose.fondoDanos} />
          </Card>
        )}
      </div>
    </div>
  )
}

function Row({ label, value, bold }) {
  return (
    <div className={`flex items-center justify-between py-1.5 text-sm ${bold ? 'font-bold text-ink border-b border-subtle pb-3 mb-2' : 'text-ink-muted'}`}>
      <span>{label}</span>
      <span className={bold ? 'text-accent' : ''}>${Number(value).toLocaleString('es-AR')}</span>
    </div>
  )
}
