import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Wallet, Star, Settings } from 'lucide-react'
import TopBar from '../../components/TopBar'
import BottomNav from '../../components/BottomNav'
import Card from '../../components/Card'
import { notificationsApi } from '../../api/client'

const ICONS = { pedido: Bell, pago: Wallet, calificacion: Star, sistema: Settings, viaje: Bell }

export default function DriverNotifications() {
  const navigate = useNavigate()
  const [notifs, setNotifs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    notificationsApi
      .list()
      .then(({ notifications }) => setNotifs(notifications))
      .catch((err) => setError(err.message || 'No pudimos cargar tus notificaciones.'))
      .finally(() => setLoading(false))
  }, [])

  async function handleClick(n) {
    if (!n.leido) {
      try {
        await notificationsApi.markRead(n.id)
        setNotifs((list) => list.map((x) => (x.id === n.id ? { ...x, leido: true } : x)))
      } catch {
        // no bloqueamos la navegación si falla marcar como leída
      }
    }
    if (n.tipo === 'calificacion') navigate('/driver-rate')
  }

  return (
    <div className="flex-1 flex flex-col">
      <TopBar title="Notificaciones" onBack={() => navigate('/driver-home')} />
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 flex flex-col gap-2">
        {loading && <p className="text-center text-ink-muted text-sm py-8">Cargando…</p>}
        {error && <p className="text-center text-red-500 text-sm py-8">{error}</p>}
        {!loading && !error && notifs.map((n) => {
          const Icon = ICONS[n.tipo] || Bell
          return (
            <Card
              key={n.id}
              className={`cursor-pointer ${!n.leido ? 'border-accent/50' : ''}`}
              onClick={() => handleClick(n)}
            >
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-surface-3 flex items-center justify-center shrink-0">
                  <Icon size={16} strokeWidth={1.75} className="text-accent" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-ink">{n.titulo}</p>
                    {!n.leido && <span className="w-2 h-2 rounded-full bg-accent" />}
                  </div>
                  <p className="text-xs text-ink-muted mt-0.5">{n.detalle}</p>
                  <p className="text-[10px] text-ink-faint mt-1">{new Date(n.createdAt).toLocaleString('es-AR')}</p>
                </div>
              </div>
            </Card>
          )
        })}
        {!loading && !error && notifs.length === 0 && <p className="text-center text-ink-muted text-sm py-8">No tenés notificaciones.</p>}
      </div>
      <BottomNav />
    </div>
  )
}
