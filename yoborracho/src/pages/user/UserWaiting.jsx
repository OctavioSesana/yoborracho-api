import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Search } from 'lucide-react'
import Button from '../../components/Button'
import ConfirmDialog from '../../components/ConfirmDialog'
import { tripsApi } from '../../api/client'

export default function UserWaiting() {
  const navigate = useNavigate()
  const location = useLocation()
  const tripId = location.state?.tripId
  const [error, setError] = useState('')
  const [cancelledByMe, setCancelledByMe] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    if (!tripId) {
      // Sin tripId (por ejemplo, entrando directo a esta ruta) volvemos al pedido.
      navigate('/user-request-1', { replace: true })
      return undefined
    }
    if (cancelledByMe) return undefined

    let cancelled = false
    let timer

    async function poll() {
      try {
        const { trip } = await tripsApi.get(tripId)
        if (cancelled) return
        if (trip.status === 'cancelado') {
          setError('Este pedido fue cancelado.')
          setTimeout(() => {
            if (!cancelled) navigate('/user-home', { replace: true })
          }, 2000)
          return
        }
        if (trip.status !== 'matching') {
          navigate('/user-tracking-arrive', { state: { tripId }, replace: true })
          return
        }
        timer = setTimeout(poll, 2500)
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'No pudimos consultar el estado de tu pedido.')
          timer = setTimeout(poll, 4000)
        }
      }
    }

    poll()
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [tripId, navigate, cancelledByMe])

  async function cancelarPedido() {
    if (!tripId || cancelling) return
    setConfirmOpen(false)
    setCancelling(true)
    setError('')
    try {
      await tripsApi.updateStatus(tripId, 'cancelado', 'Cancelado por el usuario mientras se buscaba conductor.')
      setCancelledByMe(true)
      navigate('/user-home', { replace: true })
    } catch (err) {
      setError(err.message || 'No pudimos cancelar el pedido. Probá de nuevo.')
      setCancelling(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-6">
      <div className="relative w-32 h-32 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-accent/20 animate-ping" />
        <div className="absolute inset-3 rounded-full bg-accent/30 animate-pulse-slow" />
        <Search size={40} strokeWidth={1.5} className="text-accent z-10" />
      </div>
      <div>
        <h2 className="text-xl font-bold mb-2 text-ink tracking-tight">Buscando un conductor cerca tuyo…</h2>
        <p className="text-ink-muted text-sm">Esto puede tardar unos segundos. No cierres la app.</p>
        {error && <p className="text-red-500 text-xs mt-3">{error}</p>}
      </div>
      <Button variant="secondary" disabled={cancelling} onClick={() => setConfirmOpen(true)}>
        {cancelling ? 'Cancelando…' : 'Cancelar pedido'}
      </Button>

      <ConfirmDialog
        open={confirmOpen}
        title="¿Cancelar este pedido?"
        message="Vamos a dejar de buscarte un conductor. Podés pedir uno nuevo cuando quieras."
        confirmLabel="Sí, cancelar"
        cancelLabel="Volver"
        danger
        onConfirm={cancelarPedido}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}
