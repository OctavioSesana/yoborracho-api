import { useNavigate } from 'react-router-dom'
import { IdCard, Car, FileText, GraduationCap, Star } from 'lucide-react'
import TopBar from '../../components/TopBar'
import BottomNav from '../../components/BottomNav'
import Card from '../../components/Card'
import Button from '../../components/Button'
import Avatar from '../../components/Avatar'
import { useAuth } from '../../context/AuthContext'

const BADGES = [
  { icon: IdCard, label: 'Identidad verificada' },
  { icon: Car, label: 'Licencia habilitada' },
  { icon: FileText, label: 'Antecedentes sin observaciones' },
  { icon: GraduationCap, label: 'Capacitación completa' },
]

export default function DriverProfile() {
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <div className="flex-1 flex flex-col">
      <TopBar title="Mi perfil" onBack={() => navigate('/driver-home')} />
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 flex flex-col gap-4">
        <div className="flex flex-col items-center gap-2 py-4">
          <Avatar name={user?.nombre} size="xl" />
          <h2 className="text-xl font-bold tracking-tight text-ink">{user?.nombre}</h2>
          <p className="text-xs text-ink-muted flex items-center gap-1">
            <Star size={12} strokeWidth={1.75} className="text-accent fill-accent" /> {user?.calificacion} · {user?.viajesTotales} viajes
          </p>
        </div>

        <Card>
          <Info label="Email" value={user?.email} />
          <Info label="Celular" value={user?.telefono} />
          <Info label="Zona" value={user?.zona} />
        </Card>

        <div>
          <p className="text-xs uppercase tracking-wide font-semibold text-ink-muted mb-2">Badges de verificación</p>
          <div className="grid grid-cols-2 gap-2">
            {BADGES.map((b) => (
              <Card key={b.label} className="text-center p-3">
                <b.icon size={20} strokeWidth={1.75} className="text-accent mx-auto mb-1" />
                <p className="text-[11px] text-ink-muted">{b.label}</p>
              </Card>
            ))}
          </div>
        </div>

        <Button variant="secondary" onClick={() => navigate('/driver-profile-edit')}>Editar perfil</Button>
        <Button variant="secondary" onClick={() => navigate('/driver-settings')}>Configuración</Button>
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
