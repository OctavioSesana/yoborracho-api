import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { MapPin, Square } from 'lucide-react'
import TopBar from '../../components/TopBar'
import Card from '../../components/Card'
import { tripsApi } from '../../api/client'
import { calcularDesglose } from '../../lib/fareEstimate'

export default function DriverHistoryDetail() {
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
        <TopBar title="Viaje" onBack={() => navigate('/driver-history')} />
        <p className="text-center text-ink-muted text-sm py-8">Cargando…</p>
      </div>
    )
  }

  if (error || !trip) {
    return (
      <div className="flex-1 flex flex-col">
        <TopBar title="Viaje" onBack={() => navigate('/driver-history')} />
        <p className="text-center text-red-500 text-sm py-8">{error || 'Viaje no encontrado.'}</p>
      </div>
    )
  }

  const desglose = trip.fareBreakdown || calcularDesglose(trip.fareTotal || 0)

  return (
    <div className="flex-1 flex flex-col">
      <TopBar title={`Viaje #${trip.id.slice(0, 8)}`} onBack={() => navigate('/driver-history')} />
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 flex flex-col gap-4">
        <Card>
          <p className="text-xs text-ink-muted mb-2">{new Date(trip.createdAt).toLocaleString('es-AR')}</p>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3"><MapPin size={14} strokeWidth={1.75} className="text-accent" /><p className="text-sm text-ink">{trip.pickup?.address}</p></div>
            <div className="flex items-center gap-3"><Square size={10} strokeWidth={1.75} className="text-red-400 fill-red-400" /><p className="text-sm text-ink">{trip.dropoff?.address}</p></div>
          </div>
          <p className="text-xs text-emerald-400 mt-3">{trip.status}</p>
        </Card>

        <Card>
          <p className="text-sm font-semibold text-ink mb-1">Usuario</p>
          <p className="text-sm text-ink-muted">{trip.riderNombre}</p>
        </Card>

        <Card>
          <p className="text-xs uppercase tracking-wide font-semibold text-ink-muted mb-3">Desglose completo</p>
          <Row label="Total del viaje" value={desglose.total} bold />
          <Row label="Tu ganancia (65%)" value={desglose.conductor} highlight />
          <Row label="Comisión plataforma (20%)" value={-desglose.plataforma} />
          <Row label="Fondo de seguro (10%)" value={-desglose.fondoSeguro} />
          <Row label="Fondo de daños (5%)" value={-desglose.fondoDanos} />
        </Card>

        <Card className="bg-emerald-500/10 border-emerald-800">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-ink">Ganancia neta</span>
            <span className="text-xl font-bold text-emerald-400">${Number(desglose.conductor).toLocaleString('es-AR')}</span>
          </div>
        </Card>
      </div>
    </div>
  )
}

function Row({ label, value, bold, highlight }) {
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  return (
    <div className={`flex items-center justify-between py-1.5 text-sm ${bold ? 'font-bold text-ink border-b border-subtle pb-3 mb-2' : 'text-ink-muted'}`}>
      <span>{label}</span>
      <span className={bold ? 'text-ink' : highlight ? 'text-emerald-400' : ''}>{sign}${Number(abs).toLocaleString('es-AR')}</span>
    </div>
  )
}
