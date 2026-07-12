import { useState } from 'react'
import { ClipboardList, CheckCircle2, Camera } from 'lucide-react'
import VerifyLayout from './VerifyLayout'
import { useAuth } from '../../context/AuthContext'
import { driversApi } from '../../api/client'

export default function Verify1() {
  const { user, isDriver } = useAuth()
  const [selfie, setSelfie] = useState(false)

  async function onBeforeNext() {
    if (!isDriver) return // los usuarios no tienen perfil de conductor que actualizar
    await driversApi.verify({
      step: 1,
      telefono: user?.telefono || '000-000-0000',
      zona: user?.zona || 'Centro, Rosario',
      selfieUrl: selfie ? 'https://placehold.co/200x200?text=selfie' : undefined,
    })
  }

  return (
    <VerifyLayout
      step={1}
      icon={<ClipboardList size={24} strokeWidth={1.5} />}
      title="Registro básico"
      description="Confirmá tus datos y tomate una selfie para empezar la verificación."
      nextPath="/verify-2"
      disabled={!selfie}
      onBeforeNext={onBeforeNext}
    >
      <div className="flex flex-col gap-3">
        <div className="bg-surface-2 border border-subtle rounded-lg p-4 text-sm">
          <p className="text-ink-muted text-xs uppercase tracking-wide">Nombre</p>
          <p className="font-medium text-ink">{user?.nombre || 'Nuevo usuario'}</p>
        </div>
        <div className="bg-surface-2 border border-subtle rounded-lg p-4 text-sm">
          <p className="text-ink-muted text-xs uppercase tracking-wide">Celular verificado por SMS</p>
          <p className="font-medium text-ink flex items-center gap-1.5 mt-1">
            <CheckCircle2 size={16} strokeWidth={1.75} className="text-accent" />
            Código confirmado
          </p>
        </div>
        <button
          onClick={() => setSelfie(true)}
          className={`flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-6 text-center text-sm ${
            selfie ? 'border-accent text-accent' : 'border-subtle text-ink-muted'
          }`}
        >
          {selfie ? <CheckCircle2 size={18} strokeWidth={1.75} /> : <Camera size={18} strokeWidth={1.75} />}
          {selfie ? 'Selfie capturada' : 'Tomar selfie'}
        </button>
      </div>
    </VerifyLayout>
  )
}
