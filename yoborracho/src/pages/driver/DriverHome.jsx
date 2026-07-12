import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Star, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import BottomNav from '../../components/BottomNav'
import Card from '../../components/Card'
import Button from '../../components/Button'
import Toggle from '../../components/Toggle'
import Avatar from '../../components/Avatar'
import { driversApi, tripsApi } from '../../api/client'

export default function DriverHome() {
  const navigate = useNavigate()
  const { user, setUser } = useAuth()
  const [disponible, setDisponible] = useState(true)
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    driversApi
      .me()
      .then(({ profile }) => setDisponible(Boolean(profile.disponible)))
      .catch(() => {})
      .finally(() => setProfileLoaded(true))
  }, [])

  useEffect(() => {
    let cancelled = false
    tripsApi
      .list()
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
  }, [])

  async function toggleDisponible() {
    const next = !disponible
    setDisponible(next)
    try {
      await driversApi.setDisponibilidad(next)
    } catch {
      setDisponible(!next) // revertimos si falló
    }
  }

  const recientes = useMemo(
    () => [...trips].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 2),
    [trips]
  )

  const ganadoHoy = useMemo(() => {
    const hoy = new Date().toDateString()
    return trips
      .filter((t) => t.status === 'completado' && new Date(t.createdAt).toDateString() === hoy)
      .reduce((acc, t) => acc + (t.fareBreakdown?.conductor || 0), 0)
  }, [trips])

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <Avatar name={user?.nombre} size="md" />
          <div>
            <p className="text-ink-muted text-xs">Hola,</p>
            <h1 className="text-lg font-bold text-ink">{user?.nombre?.split(' ')[0] || 'Conductor'}</h1>
          </div>
        </div>
        <button onClick={() => navigate('/driver-notifications')} className="w-10 h-10 rounded-full bg-surface-2 border border-subtle flex items-center justify-center text-ink-muted">
          <Bell size={18} strokeWidth={1.75} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-4 flex flex-col gap-4">
        <Card className={`flex items-center justify-between ${disponible ? 'border-accent' : ''}`}>
          <div>
            <p className="text-sm font-semibold text-ink flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${disponible ? 'bg-emerald-400' : 'bg-ink-faint'}`} />
              {disponible ? 'Disponible para viajes' : 'No disponible'}
            </p>
            <p className="text-xs text-ink-muted mt-0.5">{disponible ? 'Podés recibir pedidos ahora' : 'No recibirás pedidos nuevos'}</p>
          </div>
          <Toggle checked={disponible} onChange={toggleDisponible} disabled={!profileLoaded} />
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Card className="text-center">
            <p className="text-2xl font-bold text-accent">${ganadoHoy.toLocaleString('es-AR')}</p>
            <p className="text-[11px] uppercase tracking-wide text-ink-muted mt-1">Hoy</p>
          </Card>
          <Card className="text-center">
            <p className="text-2xl font-bold text-ink flex items-center justify-center gap-1">
              <Star size={18} strokeWidth={1.75} className="text-accent fill-accent" /> {user?.calificacion ?? '—'}
            </p>
            <p className="text-[11px] uppercase tracking-wide text-ink-muted mt-1">{user?.viajesTotales ?? 0} viajes</p>
          </Card>
        </div>

        <Card className="flex items-center gap-2">
          <CheckCircle2 size={18} strokeWidth={1.75} className="text-emerald-400 shrink-0" />
          <p className="text-xs text-ink-muted">Cuenta verificada — todas las etapas completas</p>
        </Card>

        <Button
          variant="primary"
          disabled={!disponible}
          onClick={() => navigate('/driver-request')}
        >
          <span className="flex items-center justify-center gap-2">
            <Bell size={18} strokeWidth={1.75} /> Ver pedidos disponibles
          </span>
        </Button>

        <div>
          <p className="text-xs uppercase tracking-wide font-semibold text-ink-muted mb-2">Últimos viajes</p>
          {loading && <p className="text-xs text-ink-muted py-2">Cargando…</p>}
          {error && <p className="text-xs text-red-500 py-2">{error}</p>}
          {!loading && !error && (
            <div className="flex flex-col gap-2">
              {recientes.map((t) => (
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
              {recientes.length === 0 && <p className="text-center text-ink-muted text-xs py-4">Todavía no hiciste ningún viaje.</p>}
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
