import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../../components/TopBar'
import Button from '../../components/Button'
import { useAuth } from '../../context/AuthContext'

export default function RegisterDriver() {
  const navigate = useNavigate()
  const { registerMock } = useAuth()
  const [form, setForm] = useState({ nombre: '', email: '', password: '', telefono: '', zona: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function update(key, val) {
    setForm((f) => ({ ...f, [key]: val }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await registerMock('conductor', form)
    setLoading(false)
    if (res.ok) {
      navigate('/verify-1')
    } else {
      setError(res.error)
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      <TopBar title="Registro de conductor" onBack={() => navigate('/register-select')} />
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-4 px-6 py-6 bg-surface">
        <Field label="Nombre completo" value={form.nombre} onChange={(v) => update('nombre', v)} placeholder="Martín Gómez" />
        <Field label="Email" type="email" value={form.email} onChange={(v) => update('email', v)} placeholder="tu@email.com" />
        <Field label="Contraseña" type="password" value={form.password} onChange={(v) => update('password', v)} placeholder="••••" />
        <Field label="Celular" value={form.telefono} onChange={(v) => update('telefono', v)} placeholder="341-555-0244" />
        <Field label="Zona de trabajo" value={form.zona} onChange={(v) => update('zona', v)} placeholder="Pichincha, Rosario" />
        <p className="text-[11px] text-ink-faint">
          Como conductor vas a pasar por 4 etapas de verificación, incluyendo licencia de conducir y antecedentes penales.
        </p>
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <Button type="submit" className="mt-4" disabled={loading}>
          {loading ? 'Creando cuenta…' : 'Continuar'}
        </Button>
      </form>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wide text-ink-muted font-semibold">{label}</label>
      <input
        type={type}
        required
        minLength={type === 'password' ? 3 : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full mt-1 bg-surface-2 border border-subtle rounded-lg px-4 py-3 text-sm text-ink outline-none focus:border-accent"
      />
    </div>
  )
}
