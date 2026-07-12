import { useState } from 'react'
import { IdCard, CheckCircle2, FileText } from 'lucide-react'
import VerifyLayout from './VerifyLayout'
import { useAuth } from '../../context/AuthContext'
import { driversApi } from '../../api/client'

export default function Verify2() {
  const { isDriver } = useAuth()
  const [dni, setDni] = useState(false)
  const [antecedentes, setAntecedentes] = useState(false)

  async function onBeforeNext() {
    if (!isDriver) return
    // La UI de este demo no colecta el número real de DNI/licencia (no había
    // inputs de texto en el diseño original); se envían valores de placeholder
    // consistentes con el toggle "escaneado" para completar el flujo end-to-end.
    await driversApi.verify({
      step: 2,
      dniNumero: '30123456',
      dniFrenteUrl: dni ? 'https://placehold.co/400x250?text=dni-frente' : undefined,
      dniDorsoUrl: dni ? 'https://placehold.co/400x250?text=dni-dorso' : undefined,
      licenciaNumero: 'LC-991234',
      licenciaVencimiento: '2028-01-01',
    })
  }

  return (
    <VerifyLayout
      step={2}
      icon={<IdCard size={24} strokeWidth={1.5} />}
      title="Verificación de identidad"
      description="Escaneamos tu DNI (OCR) y validamos tus antecedentes penales automáticamente."
      nextPath="/verify-3"
      disabled={!dni || !antecedentes}
      onBeforeNext={onBeforeNext}
    >
      <div className="flex flex-col gap-3">
        <button
          onClick={() => setDni(true)}
          className={`flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-6 text-center text-sm ${
            dni ? 'border-accent text-accent' : 'border-subtle text-ink-muted'
          }`}
        >
          {dni ? <CheckCircle2 size={18} strokeWidth={1.75} /> : <IdCard size={18} strokeWidth={1.75} />}
          {dni ? 'DNI escaneado (OCR)' : 'Escanear DNI'}
        </button>
        <button
          onClick={() => setAntecedentes(true)}
          className={`flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-6 text-center text-sm ${
            antecedentes ? 'border-accent text-accent' : 'border-subtle text-ink-muted'
          }`}
        >
          {antecedentes ? <CheckCircle2 size={18} strokeWidth={1.75} /> : <FileText size={18} strokeWidth={1.75} />}
          {antecedentes ? 'Antecedentes penales consultados' : 'Consultar antecedentes penales'}
        </button>
        <p className="text-[11px] text-ink-faint">
          El resultado automático demora menos de 24hs.
        </p>
      </div>
    </VerifyLayout>
  )
}
