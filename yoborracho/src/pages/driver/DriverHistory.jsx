import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../../components/TopBar'
import BottomNav from '../../components/BottomNav'
import Card from '../../components/Card'
import { tripsApi } from '../../api/client'

const FILTERS = [
  { label: 'Todos', value: undefined },
  { label: 'Completado', value: 'completado' },
]

export default function DriverHistory() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState(FILTERS[0])
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    tripsApi
      .list(filter.value ? { status: filter.value } : undefined)
      .then(({ trips: data }) => {
        if (!cancelled) setTrips(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'No pudimos cargar tus viajes.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [filter])

  const totalGanado = useMemo(
    () => trips.filter((t) => t.status === 'completado').reduce((a, t) => a + (t.fareBreakdown?.conductor || 0), 0),
    [trips]
  )

  return (
    <div className="flex-1 flex flex-col">
      <TopBar title="Historial de viajes" onBack={() => navigate('/driver-home')} />
      <div className="px-4 pt-3">
        <Card className="bg-accent/10 border-accent/30 mb-3">
          <p className="text-xs text-ink-muted">Ganancia neta total (histórico reciente)</p>
          <p className="text-2xl font-bold text-accent">${totalGanado.toLocaleString('es-AR')}</p>
        </Card>
      </div>
      <div className="px-4 pb-3 flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.label}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs border ${
              filter.label === f.label ? 'bg-accent border-accent text-white' : 'border-subtle text-ink-muted'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-4 flex flex-col gap-2">
        {loading && <p className="text-center text-ink-muted text-sm py-8">Cargando…</p>}
        {error && <p className="text-center text-red-500 text-sm py-8">{error}</p>}
        {!loading && !error && trips.map((t) => (
          <Card key={t.id} className="cursor-pointer" onClick={() => navigate('/driver-history-detail', { state: { tripId: t.id } })}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ink">{t.riderNombre}</p>
                <p className="text-xs text-ink-muted">{new Date(t.createdAt).toLocaleString('es-AR')}</p>
              </div>
              <p className="text-sm font-semibold text-emerald-400">+${Number(t.fareBreakdown?.conductor || 0).toLocaleString('es-AR')}</p>
            </div>
          </Card>
        ))}
        {!loading && !error && trips.length === 0 && <p className="text-center text-ink-muted text-sm py-8">No hay viajes para este filtro.</p>}
      </div>
      <BottomNav />
    </div>
  )
}
