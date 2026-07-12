import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { CheckCircle2, IdCard, Camera } from 'lucide-react'
import TopBar from '../../components/TopBar'
import Button from '../../components/Button'
import Card from '../../components/Card'
import ConfirmDialog from '../../components/ConfirmDialog'
import { tripsApi } from '../../api/client'

export default function DriverCheckin() {
  const navigate = useNavigate()
  const location = useLocation()
  const tripId = location.state?.tripId
  const [fotoId, setFotoId] = useState(false)
  const [fotoAuto, setFotoAuto] = useState(false)
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [cancelledByOther, setCancelledByOther] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const ready = fotoId && fotoAuto && pin.length === 4

  useEffect(() => {
    if (!tripId || cancelling || cancelledByOther) return undefined
    let cancelled = false
    const interval = setInterval(async () => {
      try {
        const { trip: t } = await tripsApi.get(tripId)
        if (cancelled) return
        if (t.status === 'cancelado') setCancelledByOther(true)
      } catch {
        // Silencioso.
      }
    }, 3000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [tripId, cancelling, cancelledByOther])

  useEffect(() => {
    if (!cancelledByOther) return undefined
    const t = setTimeout(() => navigate('/driver-home', { replace: true }), 2500)
    return () => clearTimeout(t)
  }, [cancelledByOther, navigate])

  async function iniciarViaje() {
    if (!tripId) return
    setLoading(true)
    setError('')
    try {
      await tripsApi.updateStatus(tripId, 'en_viaje')
      navigate('/driver-ride', { state: { tripId } })
    } catch (err) {
      setError(err.message || 'No pudimos iniciar el viaje.')
    } finally {
      setLoading(false)
    }
  }

  async function cancelarViaje() {
    if (!tripId || cancelling) return
    setConfirmOpen(false)
    setCancelling(true)
    setError('')
    try {
      await tripsApi.updateStatus(tripId, 'cancelado', 'Cancelado por el conductor durante la verificación.')
      navigate('/driver-home', { replace: true })
    } catch (err) {
      setError(err.message || 'No pudimos cancelar el viaje. Probá de nuevo.')
      setCancelling(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      <TopBar title="Verificación en punto de encuentro" />
      <div className="flex-1 flex flex-col px-4 py-4 gap-4">
        <button
          onClick={() => setFotoId(true)}
          className={`border-2 border-dashed rounded-xl p-6 text-center text-sm flex flex-col items-center gap-2 ${
            fotoId ? 'border-accent text-accent' : 'border-subtle text-ink-muted'
          }`}
        >
          {fotoId ? <CheckCircle2 size={22} strokeWidth={1.75} /> : <IdCard size={22} strokeWidth={1.75} />}
          {fotoId ? 'Identidad de la usuaria verificada' : 'Verificar identidad del usuario'}
        </button>

        <button
          onClick={() => setFotoAuto(true)}
          className={`border-2 border-dashed rounded-xl p-6 text-center text-sm flex flex-col items-center gap-2 ${
            fotoAuto ? 'border-accent text-accent' : 'border-subtle text-ink-muted'
          }`}
        >
          {fotoAuto ? <CheckCircle2 size={22} strokeWidth={1.75} /> : <Camera size={22} strokeWidth={1.75} />}
          {fotoAuto ? 'Foto del estado del auto tomada' : 'Foto del estado del auto (antes)'}
        </button>

        <Card>
          <p className="text-sm font-semibold text-ink mb-2">PIN de confirmación</p>
          <p className="text-xs text-ink-muted mb-3">Pedile al usuario el PIN de 4 dígitos que ve en su app.</p>
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            inputMode="numeric"
            placeholder="• • • •"
            className="w-full text-center text-2xl tracking-[0.5em] bg-surface border border-subtle rounded-xl px-4 py-3 outline-none focus:border-accent text-ink"
          />
        </Card>

        {error && <p className="text-red-500 text-xs">{error}</p>}

        {cancelledByOther ? (
          <p className="mt-auto mb-4 text-center text-sm text-red-400">
            El pasajero canceló el viaje. Volviendo al inicio…
          </p>
        ) : (
          <div className="mt-auto mb-4 flex flex-col gap-2">
            <Button disabled={!ready || loading} onClick={iniciarViaje}>
              {loading ? 'Iniciando…' : 'Iniciar viaje'}
            </Button>
            <Button variant="secondary" disabled={cancelling} onClick={() => setConfirmOpen(true)}>
              {cancelling ? 'Cancelando…' : 'Cancelar viaje'}
            </Button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="¿Cancelar este viaje?"
        message="Se le va a avisar al pasajero que cancelaste este viaje."
        confirmLabel="Sí, cancelar"
        cancelLabel="Volver"
        danger
        onConfirm={cancelarViaje}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}
