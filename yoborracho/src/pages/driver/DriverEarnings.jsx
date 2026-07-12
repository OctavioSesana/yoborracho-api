import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Wallet, Star, TrendingUp, Calendar } from 'lucide-react'
import TopBar from '../../components/TopBar'
import BottomNav from '../../components/BottomNav'
import Card from '../../components/Card'
import { tripsApi } from '../../api/client'
import { useAuth } from '../../context/AuthContext'

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

export default function DriverEarnings() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    tripsApi
      .list({ status: 'completado' })
      .then(({ trips: data }) => setTrips(data))
      .catch((err) => setError(err.message || 'No pudimos cargar tus ganancias.'))
      .finally(() => setLoading(false))
  }, [])

  const last7Days = useMemo(() => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      days.push(d)
    }
    return days.map((d) => {
      const monto = trips
        .filter((t) => new Date(t.createdAt).toDateString() === d.toDateString())
        .reduce((a, t) => a + (t.fareBreakdown?.conductor || 0), 0)
      return { dia: DIAS[d.getDay()], monto }
    })
  }, [trips])

  const total = last7Days.reduce((a, d) => a + d.monto, 0)
  const max = Math.max(1, ...last7Days.map((d) => d.monto))
  const viajes = trips.length

  return (
    <div className="flex-1 flex flex-col">
      <TopBar title="Mis ganancias" onBack={() => navigate('/driver-home')} />
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 flex flex-col gap-4">
        {loading && <p className="text-center text-ink-muted text-sm py-8">Cargando…</p>}
        {error && <p className="text-center text-red-500 text-sm py-8">{error}</p>}
        {!loading && !error && (
          <>
            <Card className="bg-accent/10 border-accent/30">
              <p className="text-xs uppercase tracking-wide font-semibold text-ink-muted flex items-center gap-1.5">
                <Wallet size={14} strokeWidth={1.75} /> Ganancia esta semana
              </p>
              <p className="text-3xl font-bold tracking-tight text-accent mt-1">${total.toLocaleString('es-AR')}</p>
            </Card>

            <div className="grid grid-cols-3 gap-2">
              <Card className="text-center p-3">
                <p className="text-lg font-bold text-ink">{viajes}</p>
                <p className="text-[10px] uppercase tracking-wide text-ink-muted mt-1">Viajes totales</p>
              </Card>
              <Card className="text-center p-3">
                <p className="text-lg font-bold text-ink">${viajes ? Math.round(trips.reduce((a, t) => a + (t.fareBreakdown?.conductor || 0), 0) / viajes).toLocaleString('es-AR') : 0}</p>
                <p className="text-[10px] uppercase tracking-wide text-ink-muted mt-1">Promedio/viaje</p>
              </Card>
              <Card className="text-center p-3">
                <p className="text-lg font-bold text-ink flex items-center justify-center gap-1">
                  {user?.calificacion ?? '—'} <Star size={14} strokeWidth={1.75} className="text-accent fill-accent" />
                </p>
                <p className="text-[10px] uppercase tracking-wide text-ink-muted mt-1">Calificación</p>
              </Card>
            </div>

            <Card>
              <p className="text-xs uppercase tracking-wide font-semibold text-ink-muted mb-4 flex items-center gap-1.5">
                <TrendingUp size={14} strokeWidth={1.75} /> Últimos 7 días
              </p>
              <div className="flex items-end justify-between gap-2 h-40">
                {last7Days.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                    <div
                      className="w-full rounded-t-md bg-accent"
                      style={{ height: `${Math.max(4, (d.monto / max) * 100)}%` }}
                      title={`$${d.monto}`}
                    />
                    <span className="text-[10px] text-ink-muted">{d.dia}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <p className="text-xs uppercase tracking-wide font-semibold text-ink-muted mb-2 flex items-center gap-1.5">
                <Calendar size={14} strokeWidth={1.75} /> Próximo pago
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-muted">Se acredita el lunes</span>
                <span className="font-semibold text-ink">${total.toLocaleString('es-AR')}</span>
              </div>
            </Card>
          </>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
