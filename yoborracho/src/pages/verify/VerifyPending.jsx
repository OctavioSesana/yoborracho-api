import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function VerifyPending() {
  const navigate = useNavigate()
  const { isDriver } = useAuth()

  useEffect(() => {
    const t = setTimeout(() => navigate('/verify-approved'), 3000)
    return () => clearTimeout(t)
  }, [navigate])

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-6 bg-surface">
      <div className="w-20 h-20 rounded-full border-4 border-surface-3 border-t-accent animate-spin" />
      <div>
        <h2 className="text-xl font-bold tracking-tight text-ink mb-2">Estamos verificando tus datos</h2>
        <p className="text-ink-muted text-sm font-normal">
          {isDriver
            ? 'Nuestro equipo está validando tu identidad, licencia y antecedentes. Esto suele demorar menos de 24hs (en este demo, unos segundos).'
            : 'Estamos validando tu identidad. Esto suele demorar menos de 24hs (en este demo, unos segundos).'}
        </p>
      </div>
    </div>
  )
}
