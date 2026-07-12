import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../../components/TopBar'
import Button from '../../components/Button'
import { useAuth } from '../../context/AuthContext'

export default function UserProfileEdit() {
  const navigate = useNavigate()
  const { user, setUser } = useAuth()
  const [form, setForm] = useState({
    nombre: user?.nombre || '',
    telefono: user?.telefono || '',
    zona: user?.zona || '',
  })

  function update(key, val) {
    setForm((f) => ({ ...f, [key]: val }))
  }

  function save(e) {
    e.preventDefault()
    setUser((u) => ({ ...u, ...form }))
    navigate('/user-profile')
  }

  return (
    <div className="flex-1 flex flex-col">
      <TopBar title="Editar perfil" onBack={() => navigate('/user-profile')} />
      <form onSubmit={save} className="flex-1 flex flex-col gap-4 px-6 py-6">
        <Field label="Nombre completo" value={form.nombre} onChange={(v) => update('nombre', v)} />
        <Field label="Celular" value={form.telefono} onChange={(v) => update('telefono', v)} />
        <Field label="Zona habitual" value={form.zona} onChange={(v) => update('zona', v)} />
        <Button type="submit" className="mt-4">Guardar cambios</Button>
      </form>
    </div>
  )
}

function Field({ label, value, onChange }) {
  return (
    <div>
      <label className="tracking-wide uppercase text-xs font-semibold text-ink-muted">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 bg-surface-2 border border-subtle rounded-xl px-4 py-3 text-sm text-ink outline-none focus:border-accent"
      />
    </div>
  )
}
