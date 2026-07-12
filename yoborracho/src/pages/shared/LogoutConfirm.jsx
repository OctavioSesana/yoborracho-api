import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import Button from '../../components/Button'
import { useAuth } from '../../context/AuthContext'

export default function LogoutConfirm() {
  const navigate = useNavigate()
  const { logout } = useAuth()

  function confirm() {
    logout()
    navigate('/splash')
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-6">
      <div className="w-16 h-16 rounded-full bg-surface-2 border border-subtle flex items-center justify-center">
        <LogOut size={26} strokeWidth={1.75} className="text-red-400" />
      </div>
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-ink mb-2">¿Cerrar sesión?</h2>
        <p className="text-ink-muted text-sm">Vas a tener que ingresar tu email y contraseña nuevamente.</p>
      </div>
      <div className="w-full flex flex-col gap-3">
        <Button variant="danger" onClick={confirm}>Sí, cerrar sesión</Button>
        <Button variant="secondary" onClick={() => navigate(-1)}>Cancelar</Button>
      </div>
    </div>
  )
}
