import { useNavigate } from 'react-router-dom'
import { User, Car } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import TopBar from '../../components/TopBar'
import Card from '../../components/Card'

export default function RegisterSelect() {
  const navigate = useNavigate()
  const { setPendingRole } = useAuth()

  function choose(role) {
    setPendingRole(role)
    navigate(role === 'conductor' ? '/register-driver' : '/register-user')
  }

  return (
    <div className="flex-1 flex flex-col">
      <TopBar title="Crear cuenta" onBack={() => navigate('/splash')} />
      <div className="flex-1 flex flex-col gap-4 px-6 py-8 bg-surface">
        <p className="text-ink-muted text-sm font-normal mb-2">¿Cómo querés usar YoBorracho?</p>
        <Card
          className="cursor-pointer hover:border-accent transition"
          onClick={() => choose('usuario')}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-surface-3 border border-subtle flex items-center justify-center shrink-0">
              <User size={22} strokeWidth={1.5} className="text-ink" />
            </div>
            <div>
              <h3 className="font-semibold text-ink">Soy Usuario</h3>
              <p className="text-xs text-ink-muted font-normal">Quiero pedir un conductor que me lleve a casa en mi propio auto.</p>
            </div>
          </div>
        </Card>
        <Card
          className="cursor-pointer hover:border-accent transition"
          onClick={() => choose('conductor')}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-surface-3 border border-subtle flex items-center justify-center shrink-0">
              <Car size={22} strokeWidth={1.5} className="text-ink" />
            </div>
            <div>
              <h3 className="font-semibold text-ink">Soy Conductor</h3>
              <p className="text-xs text-ink-muted font-normal">Quiero trabajar llevando gente y sus autos a casa de forma segura.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
