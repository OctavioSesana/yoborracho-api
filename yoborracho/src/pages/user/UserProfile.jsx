import { useNavigate } from 'react-router-dom'
import { Star, CheckCircle2 } from 'lucide-react'
import TopBar from '../../components/TopBar'
import BottomNav from '../../components/BottomNav'
import Card from '../../components/Card'
import Button from '../../components/Button'
import Avatar from '../../components/Avatar'
import { useAuth } from '../../context/AuthContext'

export default function UserProfile() {
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <div className="flex-1 flex flex-col">
      <TopBar title="Mi perfil" onBack={() => navigate('/user-home')} />
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 flex flex-col gap-4">
        <div className="flex flex-col items-center gap-2 py-4">
          <Avatar name={user?.nombre} size="xl" />
          <h2 className="text-lg font-bold text-ink">{user?.nombre}</h2>
          <p className="text-xs text-ink-muted flex items-center gap-1">
            <Star size={12} strokeWidth={1.75} className="text-accent fill-accent" /> {user?.calificacion} · {user?.viajesTotales} viajes
          </p>
        </div>

        <Card>
          <Info label="Email" value={user?.email} />
          <Info label="Celular" value={user?.telefono} />
          <Info label="Zona" value={user?.zona} />
        </Card>

        <Card className="flex items-center justify-between">
          <span className="text-sm text-ink">Identidad verificada</span>
          <CheckCircle2 size={18} strokeWidth={1.75} className="text-emerald-400" />
        </Card>

        <Button variant="secondary" onClick={() => navigate('/user-profile-edit')}>Editar perfil</Button>
        <Button variant="secondary" onClick={() => navigate('/user-settings')}>Configuración</Button>
        <Button variant="danger" onClick={() => navigate('/logout-confirm')}>Cerrar sesión</Button>
      </div>
      <BottomNav />
    </div>
  )
}

function Info({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-subtle last:border-none text-sm">
      <span className="text-ink-muted">{label}</span>
      <span className="text-ink">{value}</span>
    </div>
  )
}
