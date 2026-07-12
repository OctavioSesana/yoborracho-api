import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Compass, Handshake, AlertTriangle, GraduationCap, CheckCircle2, Play } from 'lucide-react'
import TopBar from '../../components/TopBar'
import StepIndicator from '../../components/StepIndicator'
import Button from '../../components/Button'
import { useAuth } from '../../context/AuthContext'
import { driversApi } from '../../api/client'

const MODULOS = [
  { icon: Compass, titulo: 'Manejo responsable' },
  { icon: Handshake, titulo: 'Protocolo de conflictos' },
  { icon: AlertTriangle, titulo: 'Emergencias' },
]

export default function Verify3() {
  const navigate = useNavigate()
  const { isDriver } = useAuth()
  const [done, setDone] = useState(MODULOS.map(() => false))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const total = isDriver ? 4 : 3
  const allDone = done.every(Boolean)

  function toggle(i) {
    setDone((d) => d.map((v, idx) => (idx === i ? true : v)))
  }

  async function next() {
    setError('')
    if (isDriver) {
      setLoading(true)
      try {
        await driversApi.verify({ step: 3, capacitacionCompletada: true })
      } catch (err) {
        setLoading(false)
        setError(err.message || 'No pudimos guardar tu capacitación. Intentá de nuevo.')
        return
      }
      setLoading(false)
    }
    navigate(isDriver ? '/verify-4' : '/verify-pending')
  }

  return (
    <div className="flex-1 flex flex-col">
      <TopBar title={`Verificación (3/${total})`} />
      <StepIndicator total={total} current={3} />
      <div className="flex-1 flex flex-col px-6 py-4 bg-surface">
        <div className="w-14 h-14 rounded-xl bg-surface-2 border border-subtle flex items-center justify-center mb-4 text-accent">
          <GraduationCap size={24} strokeWidth={1.5} />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-ink mb-2">Capacitación obligatoria</h2>
        <p className="text-ink-muted text-sm font-normal mb-6">
          Un curso corto (~30 min) sobre manejo responsable, protocolo de conflictos y emergencias.
        </p>
        <div className="flex flex-col gap-3 flex-1">
          {MODULOS.map((m, i) => {
            const ModIcon = m.icon
            return (
              <button
                key={m.titulo}
                onClick={() => toggle(i)}
                className={`flex items-center gap-3 rounded-lg p-4 text-left border ${
                  done[i] ? 'border-accent bg-accent/10' : 'border-subtle bg-surface-2'
                }`}
              >
                <ModIcon size={20} strokeWidth={1.5} className="text-ink-muted" />
                <span className="flex-1 text-sm font-medium text-ink">{m.titulo}</span>
                {done[i] ? (
                  <CheckCircle2 size={18} strokeWidth={1.75} className="text-accent" />
                ) : (
                  <Play size={16} strokeWidth={1.75} className="text-ink-faint" />
                )}
              </button>
            )
          })}
        </div>
        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
        <Button className="mt-6" disabled={!allDone || loading} onClick={next}>
          {loading ? 'Guardando…' : allDone ? 'Continuar' : 'Completá los 3 módulos'}
        </Button>
      </div>
    </div>
  )
}
