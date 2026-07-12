import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { HeartHandshake, Clock, AlertTriangle } from 'lucide-react'
import TopBar from '../../components/TopBar'
import Button from '../../components/Button'
import Card from '../../components/Card'
import StarRating from '../../components/StarRating'
import Avatar from '../../components/Avatar'
import { CRITERIOS_USUARIO_CALIFICA } from '../../data/mockData'
import { ratingsApi, tripsApi } from '../../api/client'

export default function UserRate() {
  const navigate = useNavigate()
  const location = useLocation()
  const tripId = location.state?.tripId
  const [trip, setTrip] = useState(null)
  const [ratings, setRatings] = useState({})
  const [comentario, setComentario] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!tripId) return
    tripsApi.get(tripId).then(({ trip: t }) => setTrip(t)).catch(() => {})
  }, [tripId])

  const allRated = CRITERIOS_USUARIO_CALIFICA.every((c) => ratings[c.key] > 0)
  const promedio = allRated
    ? Object.values(ratings).reduce((a, b) => a + b, 0) / CRITERIOS_USUARIO_CALIFICA.length
    : 0

  async function submit() {
    if (!tripId) {
      setError('No encontramos el viaje a calificar.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await ratingsApi.submit(tripId, {
        stars: Math.round(promedio),
        criteria: ratings,
        comment: comentario || undefined,
      })
      setEnviado(true)
    } catch (err) {
      setError(err.message || 'No pudimos enviar tu calificación.')
    } finally {
      setLoading(false)
    }
  }

  const driverNombre = trip?.driverNombre || 'tu conductor'

  if (enviado) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-6">
        <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <HeartHandshake size={36} strokeWidth={1.5} className="text-emerald-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold mb-2 text-ink tracking-tight">¡Gracias por tu calificación!</h2>
          <p className="text-ink-muted text-sm">
            La verás reflejada una vez que {driverNombre} también complete su calificación sobre vos (sistema doble ciego).
          </p>
        </div>
        <Button onClick={() => navigate('/user-home')}>Volver al inicio</Button>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      <TopBar title="Calificá tu viaje" onBack={() => navigate('/user-home')} />
      <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col px-4 py-4 gap-4">
        <Card className="bg-accent/10 border-accent/30">
          <p className="text-xs text-accent flex items-start gap-2">
            <Clock size={16} strokeWidth={1.75} className="shrink-0 mt-0.5" />
            Notificación del día siguiente: ya pasó la noche, contanos con calma cómo estuvo tu viaje con {driverNombre}.
          </p>
        </Card>

        <div className="flex items-center gap-3">
          <Avatar name={driverNombre} size="lg" />
          <div>
            <p className="font-semibold text-ink">{driverNombre}</p>
            {trip && <p className="text-xs text-ink-muted">Viaje #{trip.id?.slice(0, 8)}</p>}
          </div>
        </div>

        {CRITERIOS_USUARIO_CALIFICA.map((c) => (
          <Card key={c.key} className="flex items-center justify-between">
            <span className="text-sm text-ink">{c.label}</span>
            <StarRating value={ratings[c.key] || 0} onChange={(v) => setRatings((r) => ({ ...r, [c.key]: v }))} size="text-xl" />
          </Card>
        ))}

        <textarea
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          placeholder="Comentario opcional…"
          rows={3}
          className="w-full bg-surface-2 border border-subtle rounded-xl px-4 py-3 text-sm text-ink outline-none focus:border-accent resize-none"
        />

        {allRated && promedio < 4 && (
          <p className="text-[11px] text-yellow-500 flex items-center gap-1">
            <AlertTriangle size={14} strokeWidth={1.75} /> Las calificaciones menores a 4.0 pasan por una revisión manual de nuestro equipo de seguridad.
          </p>
        )}

        {error && <p className="text-red-500 text-xs">{error}</p>}
        <Button disabled={!allRated || loading} onClick={submit} className="mb-4">
          {loading ? 'Enviando…' : 'Enviar calificación'}
        </Button>
      </div>
    </div>
  )
}
