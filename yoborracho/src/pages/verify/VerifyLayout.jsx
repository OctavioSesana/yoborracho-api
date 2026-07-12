import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../../components/TopBar'
import StepIndicator from '../../components/StepIndicator'
import Button from '../../components/Button'
import { useAuth } from '../../context/AuthContext'

export default function VerifyLayout({
  step,
  icon,
  title,
  description,
  children,
  nextPath,
  totalSteps,
  onBeforeNext,
  disabled,
}) {
  const navigate = useNavigate()
  const { isDriver } = useAuth()
  const total = totalSteps || (isDriver ? 4 : 3)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleContinue() {
    if (onBeforeNext) {
      setError('')
      setLoading(true)
      try {
        await onBeforeNext()
      } catch (err) {
        setLoading(false)
        setError(err.message || 'Ocurrió un error. Intentá de nuevo.')
        return
      }
      setLoading(false)
    }
    navigate(nextPath)
  }

  return (
    <div className="flex-1 flex flex-col">
      <TopBar title={`Verificación (${step}/${total})`} />
      <StepIndicator total={total} current={step} />
      <div className="flex-1 flex flex-col px-6 py-4 bg-surface">
        <div className="w-14 h-14 rounded-xl bg-surface-2 border border-subtle flex items-center justify-center mb-4 text-accent">
          {icon}
        </div>
        <h2 className="text-xl font-bold tracking-tight text-ink mb-2">{title}</h2>
        <p className="text-ink-muted text-sm font-normal mb-6">{description}</p>
        <div className="flex-1">{children}</div>
        {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
        <Button className="mt-6" onClick={handleContinue} disabled={disabled || loading}>
          {loading ? 'Guardando…' : 'Continuar'}
        </Button>
      </div>
    </div>
  )
}
