import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import TopBar from '../../components/TopBar'
import Button from '../../components/Button'
import Card from '../../components/Card'
import StarRating from '../../components/StarRating'
import Avatar from '../../components/Avatar'
import { CRITERIOS_CONDUCTOR_CALIFICA } from '../../data/mockData'
import { ratingsApi, tripsApi } from '../../api/client'

export default function DriverRate() {
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

  const allRated = CRITERIOS_CONDUCTOR_CALIFICA.every((c) => ratings[c.key] > 0)
  const promedio = allRated
    ? Object.values(ratings).reduce((a, b) => a + b, 0) / CRITERIOS_CONDUCTOR_CALIFICA.length
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

  const riderNombre = trip?.riderNombre || 'tu pasajero'

  if (enviado) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-6">
        <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <Sparkles size={32} strokeWidth={1.75} className="text-emerald-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-ink mb-2">¡Gracias por tu calificación!</h2>
          <p className="text-ink-muted text-sm">
            La verás reflejada cuando {riderNombre} también complete su calificación sobre vos (sistema doble ciego).
          </p>
        </div>
        <Button onClick={() => navigate('/driver-home')}>Volver al inicio</Button>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      <TopBar title="Calificá al usuario" onBack={() => navigate('/driver-home')} />
      <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col px-4 py-4 gap-4">
        <div className="flex items-center gap-3">
          <Avatar name={riderNombre} size="lg" />
          <div>
            <p className="font-semibold text-ink">{riderNombre}</p>
            {trip && <p className="text-xs text-ink-muted">Viaje #{trip.id?.slice(0, 8)}</p>}
          </div>
        </div>

        {CRITERIOS_CONDUCTOR_CALIFICA.map((c) => (
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
          className="w-full bg-surface border border-subtle rounded-xl px-4 py-3 text-sm outline-none focus:border-accent resize-none text-ink"
        />

        {error && <p className="text-red-500 text-xs">{error}</p>}
        <Button disabled={!allRated || loading} onClick={submit} className="mb-4">
          {loading ? 'Enviando…' : 'Enviar calificación'}
        </Button>
      </div>
    </div>
  )
}
