import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Flag, CheckCircle2, Camera } from 'lucide-react'
import Button from '../../components/Button'
import Card from '../../components/Card'
import { tripsApi } from '../../api/client'

export default function DriverDropoff() {
  const navigate = useNavigate()
  const location = useLocation()
  const tripId = location.state?.tripId
  const [trip, setTrip] = useState(null)
  const [fotoFinal, setFotoFinal] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!tripId) return
    tripsApi.get(tripId).then(({ trip: t }) => setTrip(t)).catch(() => {})
  }, [tripId])

  function tomarFoto() {
    setFotoFinal(true)
    setTimeout(() => setRevealed(true), 600)
  }

  async function continuar() {
    if (!tripId) return
    setFinishing(true)
    setError('')
    try {
      await tripsApi.updateStatus(tripId, 'regreso_conductor')
      navigate('/driver-return', { state: { tripId } })
    } catch (err) {
      setError(err.message || 'No pudimos continuar. Probá de nuevo.')
    } finally {
      setFinishing(false)
    }
  }

  const ganancia = trip?.fareBreakdown?.conductor || 0

  return (
    <div className="flex-1 flex flex-col px-6 py-8 items-center text-center gap-5">
      <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
        <Flag size={28} strokeWidth={1.75} className="text-accent" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-ink">Llegaste a destino</h1>
      <p className="text-ink-muted text-sm -mt-3">Tomá una foto final del auto antes de retirarte.</p>

      <button
        onClick={tomarFoto}
        className={`w-full border-2 border-dashed rounded-xl p-6 text-center text-sm flex flex-col items-center gap-2 ${
          fotoFinal ? 'border-accent text-accent' : 'border-subtle text-ink-muted'
        }`}
      >
        {fotoFinal ? <CheckCircle2 size={22} strokeWidth={1.75} /> : <Camera size={22} strokeWidth={1.75} />}
        {fotoFinal ? 'Foto final tomada' : 'Foto final del auto'}
      </button>

      {revealed && (
        <Card className="w-full animate-[fadeIn_0.3s_ease-in] bg-emerald-500/10 border-emerald-700">
          <p className="text-xs text-ink-muted mb-1">Ganaste en este viaje</p>
          <p className="text-4xl font-bold text-emerald-400">${Number(ganancia).toLocaleString('es-AR')}</p>
          <p className="text-[11px] text-ink-muted mt-2">Se acreditará junto con tus pagos semanales.</p>
        </Card>
      )}

      {error && <p className="text-red-500 text-xs">{error}</p>}
      <Button
        className="mt-auto w-full"
        disabled={!revealed || finishing}
        onClick={continuar}
      >
        {finishing ? 'Continuando…' : 'Continuar'}
      </Button>
    </div>
  )
}
