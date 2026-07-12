import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../../components/TopBar'
import Card from '../../components/Card'
import Toggle from '../../components/Toggle'

export default function DriverSettings() {
  const navigate = useNavigate()
  const [settings, setSettings] = useState({
    notifPedidos: true,
    notifPagos: true,
    radioAmpliado: false,
    aceptarAutomatico: false,
    sonidos: true,
  })

  function toggle(key) {
    setSettings((s) => ({ ...s, [key]: !s[key] }))
  }

  return (
    <div className="flex-1 flex flex-col">
      <TopBar title="Configuración" onBack={() => navigate('/driver-profile')} />
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 flex flex-col gap-4">
        <Card>
          <p className="text-xs uppercase tracking-wide font-semibold text-ink-muted mb-3">Notificaciones</p>
          <Row label="Nuevos pedidos" checked={settings.notifPedidos} onChange={() => toggle('notifPedidos')} />
          <Row label="Pagos y ganancias" checked={settings.notifPagos} onChange={() => toggle('notifPagos')} />
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide font-semibold text-ink-muted mb-3">Operación</p>
          <Row label="Radio de búsqueda ampliado" checked={settings.radioAmpliado} onChange={() => toggle('radioAmpliado')} />
          <Row label="Aceptar pedidos automáticamente" checked={settings.aceptarAutomatico} onChange={() => toggle('aceptarAutomatico')} />
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide font-semibold text-ink-muted mb-3">Preferencias</p>
          <Row label="Sonidos" checked={settings.sonidos} onChange={() => toggle('sonidos')} />
        </Card>
      </div>
    </div>
  )
}

function Row({ label, checked, onChange }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-ink">{label}</span>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  )
}
