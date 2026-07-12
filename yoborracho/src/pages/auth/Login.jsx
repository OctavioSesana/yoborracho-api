import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Car } from 'lucide-react'
import Button from '../../components/Button'
import { useAuth } from '../../context/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function goHomeFor(user) {
    navigate(user.role === 'conductor' ? '/driver-home' : '/user-home')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await login(email, password)
    setLoading(false)
    if (res.ok) {
      goHomeFor(res.user)
    } else {
      setError(res.error)
    }
  }

  async function quickLogin(mail, pass) {
    setError('')
    setLoading(true)
    const res = await login(mail, pass)
    setLoading(false)
    if (res.ok) goHomeFor(res.user)
    else setError(res.error)
  }

  return (
    <div className="flex-1 flex flex-col px-6 py-10 bg-surface">
      <button onClick={() => navigate('/splash')} className="flex items-center gap-1.5 text-ink-muted text-sm mb-6">
        <ArrowLeft size={18} strokeWidth={1.75} />
        Volver
      </button>
      <h1 className="text-2xl font-bold tracking-tight text-ink mb-1">Bienvenido de nuevo</h1>
      <p className="text-ink-muted text-sm font-normal mb-8">Ingresá para pedir o manejar</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-xs uppercase tracking-wide text-ink-muted font-semibold">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full mt-1 bg-surface-2 border border-subtle rounded-lg px-4 py-3 text-sm text-ink outline-none focus:border-accent"
            placeholder="tu@email.com"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-ink-muted font-semibold">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mt-1 bg-surface-2 border border-subtle rounded-lg px-4 py-3 text-sm text-ink outline-none focus:border-accent"
            placeholder="••••"
          />
        </div>
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <Button type="submit" className="mt-2" disabled={loading}>
          {loading ? 'Ingresando…' : 'Ingresar'}
        </Button>
      </form>

      <div className="mt-8">
        <p className="text-xs uppercase tracking-wide text-ink-muted font-semibold mb-3">Acceso rápido (usuarios de prueba del seed)</p>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => quickLogin('sofia@test.com', '123')}
            disabled={loading}
            className="flex items-center justify-between bg-surface-2 border border-subtle rounded-lg px-4 py-3 text-sm text-ink hover:border-accent transition disabled:opacity-50"
          >
            <span className="flex items-center gap-2">
              <User size={16} strokeWidth={1.75} className="text-ink-muted" />
              Sofía (Usuario)
            </span>
            <span className="text-ink-faint text-xs">sofia@test.com</span>
          </button>
          <button
            onClick={() => quickLogin('martin@test.com', '123')}
            disabled={loading}
            className="flex items-center justify-between bg-surface-2 border border-subtle rounded-lg px-4 py-3 text-sm text-ink hover:border-accent transition disabled:opacity-50"
          >
            <span className="flex items-center gap-2">
              <Car size={16} strokeWidth={1.75} className="text-ink-muted" />
              Martín (Conductor)
            </span>
            <span className="text-ink-faint text-xs">martin@test.com</span>
          </button>
        </div>
      </div>

      <p className="text-center text-xs text-ink-muted mt-auto pt-8">
        ¿No tenés cuenta?{' '}
        <button onClick={() => navigate('/register-select')} className="text-accent font-semibold">
          Registrate
        </button>
      </p>
    </div>
  )
}
