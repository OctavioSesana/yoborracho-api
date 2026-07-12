import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, MapPin, Car, Smartphone, KeyRound, Home } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import BottomNav from '../../components/BottomNav'
import RealMap from '../../components/RealMap'
import Card from '../../components/Card'
import Button from '../../components/Button'
import Avatar from '../../components/Avatar'
import { tripsApi } from '../../api/client'
import { ROSARIO_CENTER } from '../../lib/googleMaps'

export default function UserHome() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [myLocation, setMyLocation] = useState(null)
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setMyLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setMyLocation(null),
      { timeout: 4000 }
    )
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        const { trips: data } = await tripsApi.list()
        if (!cancelled) setTrips(data)
      } catch (err) {
        if (!cancelled) setError(err.message || 'No pudimos cargar tus viajes.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <Avatar name={user?.nombre} size="md" />
          <div>
            <p className="text-ink-muted text-xs">Hola,</p>
            <h1 className="text-lg font-bold text-ink">{user?.nombre?.split(' ')[0] || 'Usuario'}</h1>
          </div>
        </div>
        <button onClick={() => navigate('/user-notifications')} className="w-10 h-10 rounded-full bg-surface-2 border border-subtle flex items-center justify-center">
          <Bell size={18} strokeWidth={1.75} className="text-ink" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-4 flex flex-col gap-4">
        <RealMap height="h-48" pickup={myLocation || ROSARIO_CENTER} showRoute={false} zoom={14}>
          <span className="text-ink-muted text-sm flex items-center gap-1">
            <MapPin size={16} strokeWidth={1.75} /> Tu ubicación actual
          </span>
        </RealMap>

        <Button variant="primary" className="py-5 text-base flex items-center justify-center gap-2" onClick={() => navigate('/user-request-1')}>
          <Car size={20} strokeWidth={1.75} /> Pedir conductor
        </Button>

        <div>
          <p className="tracking-wide uppercase text-xs font-semibold text-ink-muted mb-2">Cómo funciona</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              [Smartphone, 'Pedís un conductor'],
              [Car, 'Viene hasta vos'],
              [KeyRound, 'Maneja tu auto'],
              [Home, 'Llegás a casa'],
            ].map(([Icon, txt]) => (
              <Card key={txt} className="p-3 text-center">
                <Icon size={22} strokeWidth={1.5} className="mx-auto mb-1 text-accent" />
                <p className="text-[11px] text-ink-muted">{txt}</p>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-ink">Viajes recientes</p>
            <button onClick={() => navigate('/user-history')} className="text-xs text-accent">Ver todos</button>
          </div>
          {loading && <p className="text-xs text-ink-muted py-2">Cargando…</p>}
          {error && <p className="text-xs text-red-500 py-2">{error}</p>}
          {!loading && !error && (
            <div className="flex flex-col gap-2">
              {trips.slice(0, 2).map((t) => (
                <Card
                  key={t.id}
                  className="cursor-pointer"
                  onClick={() => navigate('/user-history-detail', { state: { tripId: t.id } })}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-ink">{t.dropoff?.address}</p>
                      <p className="text-xs text-ink-muted">{new Date(t.createdAt).toLocaleString('es-AR')}</p>
                    </div>
                    <p className="text-sm font-semibold text-ink">${Number(t.fareTotal || 0).toLocaleString('es-AR')}</p>
                  </div>
                </Card>
              ))}
              {trips.length === 0 && <p className="text-center text-ink-muted text-xs py-4">Todavía no hiciste ningún viaje.</p>}
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
