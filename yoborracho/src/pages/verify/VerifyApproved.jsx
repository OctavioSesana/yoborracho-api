import { useNavigate } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import Button from '../../components/Button'
import { useAuth } from '../../context/AuthContext'

export default function VerifyApproved() {
  const navigate = useNavigate()
  const { isDriver } = useAuth()

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-6 bg-surface">
      <div className="w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
        <CheckCircle2 size={44} strokeWidth={1.5} className="text-emerald-500" />
      </div>
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-ink mb-2">¡Cuenta verificada!</h2>
        <p className="text-ink-muted text-sm font-normal">
          {isDriver
            ? 'Ya podés empezar a recibir pedidos. Tu primer viaje será supervisado por nuestro equipo de seguridad.'
            : 'Ya podés pedir tu primer conductor cuando lo necesites.'}
        </p>
      </div>
      <Button onClick={() => navigate(isDriver ? '/driver-home' : '/user-home')}>
        Continuar
      </Button>
    </div>
  )
}
