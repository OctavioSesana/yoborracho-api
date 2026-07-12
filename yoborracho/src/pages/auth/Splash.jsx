import { useNavigate } from 'react-router-dom'
import { Car } from 'lucide-react'
import Button from '../../components/Button'

export default function Splash() {
  const navigate = useNavigate()
  return (
    <div className="flex-1 flex flex-col items-center justify-between px-8 py-16 bg-surface">
      <div />
      <div className="flex flex-col items-center gap-5 text-center">
        <div className="w-24 h-24 rounded-2xl bg-accent flex items-center justify-center border border-subtle">
          <Car size={40} strokeWidth={1.5} className="text-ink" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-ink">YoBorracho</h1>
        <p className="text-ink-muted text-sm font-normal max-w-[260px]">
          Tomaste de más. Nosotros llevamos tu auto a casa, con vos adentro, sano y salvo.
        </p>
      </div>
      <div className="w-full flex flex-col gap-3">
        <Button onClick={() => navigate('/login')}>Ingresar</Button>
        <Button variant="outline" onClick={() => navigate('/register-select')}>
          Crear cuenta
        </Button>
        <p className="text-center text-[11px] uppercase tracking-wide text-ink-faint mt-2">
          Prototipo de producto — Rosario, Argentina
        </p>
      </div>
    </div>
  )
}
