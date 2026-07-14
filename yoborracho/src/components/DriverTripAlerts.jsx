import { useNavigate } from 'react-router-dom'
import { Car, X, MapPin, Square } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useDriverTripAlerts } from '../api/socket'

// Host global de las notificaciones flotantes de "nuevo pedido" para el
// conductor. Se monta una sola vez en App.jsx (fuera de las rutas), así que
// sigue vivo sin importar a qué pantalla navegue el conductor — es justamente
// el problema que resuelve: antes solo se enteraba de pedidos nuevos si
// estaba parado en /driver-request.
export default function DriverTripAlerts() {
  const { isDriver } = useAuth()
  const navigate = useNavigate()
  const { alerts, dismiss } = useDriverTripAlerts(isDriver)

  if (!isDriver || alerts.length === 0) return null

  return (
    <div className="absolute top-[max(1rem,env(safe-area-inset-top))] left-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {alerts.slice(-3).map((a) => (
        <div
          key={a.key}
          className="pointer-events-auto bg-surface-3 border border-accent/40 rounded-xl shadow-2xl p-3"
        >
          <div className="flex items-start gap-2">
            <div className="w-8 h-8 rounded-full bg-accent/15 flex items-center justify-center shrink-0 mt-0.5">
              <Car size={16} strokeWidth={1.75} className="text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ink">Nuevo pedido cerca tuyo</p>
              <p className="text-xs text-ink-muted truncate flex items-center gap-1 mt-0.5">
                <MapPin size={11} strokeWidth={1.75} className="text-accent shrink-0" />
                {a.pickup?.address}
              </p>
              <p className="text-xs text-ink-muted truncate flex items-center gap-1">
                <Square size={8} strokeWidth={1.75} className="text-red-400 fill-red-400 shrink-0" />
                {a.dropoff?.address}
              </p>
              {a.fareBreakdown?.conductor != null && (
                <p className="text-xs text-accent font-semibold mt-1">
                  Ganancia estimada ${Number(a.fareBreakdown.conductor).toLocaleString('es-AR')}
                </p>
              )}
            </div>
            <button
              onClick={() => dismiss(a.key)}
              className="text-ink-faint hover:text-ink shrink-0"
              aria-label="Descartar"
            >
              <X size={14} strokeWidth={1.75} />
            </button>
          </div>
          <button
            onClick={() => {
              dismiss(a.key)
              navigate('/driver-request')
            }}
            className="w-full mt-2 bg-accent text-white text-xs font-semibold rounded-lg py-2"
          >
            Ver pedido
          </button>
        </div>
      ))}
    </div>
  )
}
