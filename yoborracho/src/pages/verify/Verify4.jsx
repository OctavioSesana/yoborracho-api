import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Car, CheckCircle2 } from 'lucide-react'
import VerifyLayout from './VerifyLayout'
import { useAuth } from '../../context/AuthContext'
import { driversApi } from '../../api/client'

export default function Verify4() {
  const { isDriver } = useAuth()
  const navigate = useNavigate()
  const [licencia, setLicencia] = useState(false)

  useEffect(() => {
    // Los usuarios (no conductores) saltan este paso.
    if (!isDriver) navigate('/verify-pending', { replace: true })
  }, [isDriver, navigate])

  if (!isDriver) return null

  async function onBeforeNext() {
    await driversApi.verify({ step: 4, viajePruebaAprobado: true })
  }

  return (
    <VerifyLayout
      step={4}
      icon={<Car size={24} strokeWidth={1.5} />}
      title="Licencia de conducir"
      description="Este paso es exclusivo para conductores: necesitamos validar tu licencia habilitante."
      nextPath="/verify-pending"
      disabled={!licencia}
      onBeforeNext={onBeforeNext}
    >
      <button
        onClick={() => setLicencia(true)}
        className={`w-full flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-6 text-center text-sm ${
          licencia ? 'border-accent text-accent' : 'border-subtle text-ink-muted'
        }`}
      >
        {licencia ? <CheckCircle2 size={18} strokeWidth={1.75} /> : <Car size={18} strokeWidth={1.75} />}
        {licencia ? 'Licencia cargada' : 'Cargar foto de licencia'}
      </button>
      <p className="text-[11px] text-ink-faint mt-4">
        Luego de esto, tu primer viaje será un viaje de prueba supervisado por nuestro equipo.
      </p>
    </VerifyLayout>
  )
}
