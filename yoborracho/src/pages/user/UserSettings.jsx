import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Plus, Trash2, X, UserPlus } from 'lucide-react'
import TopBar from '../../components/TopBar'
import Card from '../../components/Card'
import Button from '../../components/Button'
import Toggle from '../../components/Toggle'
import { addressesApi, contactsApi } from '../../api/client'
import { geocodeAddress } from '../../api/geocoding'

export default function UserSettings() {
  const navigate = useNavigate()
  const [settings, setSettings] = useState({
    notifPush: true,
    notifEmail: false,
    compartirUbicacion: true,
    modoOscuro: true,
    sonidos: true,
  })

  function toggle(key) {
    setSettings((s) => ({ ...s, [key]: !s[key] }))
  }

  return (
    <div className="flex-1 flex flex-col">
      <TopBar title="Configuración" onBack={() => navigate('/user-profile')} />
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 flex flex-col gap-4">
        <Card>
          <p className="tracking-wide uppercase text-xs font-semibold text-ink-muted mb-3">Notificaciones</p>
          <Row label="Notificaciones push" checked={settings.notifPush} onChange={() => toggle('notifPush')} />
          <Row label="Notificaciones por email" checked={settings.notifEmail} onChange={() => toggle('notifEmail')} />
        </Card>
        <Card>
          <p className="tracking-wide uppercase text-xs font-semibold text-ink-muted mb-3">Seguridad</p>
          <Row label="Compartir ubicación con contactos" checked={settings.compartirUbicacion} onChange={() => toggle('compartirUbicacion')} />
        </Card>
        <TrustedContactsCard />
        <SavedAddressesCard />
        <Card>
          <p className="tracking-wide uppercase text-xs font-semibold text-ink-muted mb-3">Preferencias</p>
          <Row label="Modo oscuro" checked={settings.modoOscuro} onChange={() => toggle('modoOscuro')} />
          <Row label="Sonidos" checked={settings.sonidos} onChange={() => toggle('sonidos')} />
        </Card>
      </div>
    </div>
  )
}

function Row({ label, checked, onChange }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-ink-muted">{label}</span>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  )
}

// Contactos de confianza: a quienes se les puede compartir el viaje en tiempo
// real por WhatsApp mientras el conductor maneja el auto (ver ShareTripCard,
// usado en las pantallas de tracking). Son propios de cada usuario logueado.
function TrustedContactsCard() {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [nombre, setNombre] = useState('')
  const [parentesco, setParentesco] = useState('')
  const [telefono, setTelefono] = useState('')
  const [saving, setSaving] = useState(false)
  const [removingId, setRemovingId] = useState(null)

  useEffect(() => {
    cargarContactos()
  }, [])

  async function cargarContactos() {
    setLoading(true)
    setError('')
    try {
      const { contacts: list } = await contactsApi.list()
      setContacts(list)
    } catch (err) {
      setError(err.message || 'No pudimos cargar tus contactos.')
    } finally {
      setLoading(false)
    }
  }

  async function guardarContacto(e) {
    e.preventDefault()
    if (!nombre.trim() || !telefono.trim()) return
    setSaving(true)
    setError('')
    try {
      const { contact } = await contactsApi.create({
        nombre: nombre.trim(),
        parentesco: parentesco.trim() || undefined,
        telefono: telefono.trim(),
      })
      setContacts((prev) => [...prev, contact])
      setNombre('')
      setParentesco('')
      setTelefono('')
      setFormOpen(false)
    } catch (err) {
      setError(err.message || 'No pudimos guardar el contacto.')
    } finally {
      setSaving(false)
    }
  }

  async function borrarContacto(id) {
    setRemovingId(id)
    setError('')
    try {
      await contactsApi.remove(id)
      setContacts((prev) => prev.filter((c) => c.id !== id))
    } catch (err) {
      setError(err.message || 'No pudimos borrar el contacto.')
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <p className="tracking-wide uppercase text-xs font-semibold text-ink-muted">Contactos de confianza</p>
        {!formOpen && (
          <button
            onClick={() => setFormOpen(true)}
            className="text-accent text-xs font-semibold flex items-center gap-1 hover:text-accent-light"
          >
            <Plus size={14} strokeWidth={2} /> Agregar
          </button>
        )}
      </div>

      {loading && <p className="text-xs text-ink-faint">Cargando…</p>}

      {!loading && contacts.length === 0 && !formOpen && (
        <p className="text-xs text-ink-faint">
          Todavía no agregaste contactos. Agregá al menos uno para poder compartirle tu viaje en tiempo real por WhatsApp.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {contacts.map((c) => (
          <div key={c.id} className="flex items-center gap-3 bg-surface-3 border border-subtle rounded-xl px-3 py-2.5">
            <UserPlus size={16} strokeWidth={1.75} className="text-accent shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink truncate">
                {c.nombre} {c.parentesco && <span className="text-ink-muted text-xs">({c.parentesco})</span>}
              </p>
              <p className="text-xs text-ink-muted truncate">{c.telefono}</p>
            </div>
            <button
              onClick={() => borrarContacto(c.id)}
              disabled={removingId === c.id}
              className="text-ink-faint hover:text-red-400 shrink-0 disabled:opacity-40"
              aria-label={`Borrar ${c.nombre}`}
            >
              <Trash2 size={16} strokeWidth={1.75} />
            </button>
          </div>
        ))}
      </div>

      {formOpen && (
        <form onSubmit={guardarContacto} className="mt-3 flex flex-col gap-2 border-t border-subtle pt-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-ink-muted">Nuevo contacto</p>
            <button
              type="button"
              onClick={() => {
                setFormOpen(false)
                setNombre('')
                setParentesco('')
                setTelefono('')
              }}
              className="text-ink-faint hover:text-ink"
            >
              <X size={16} strokeWidth={1.75} />
            </button>
          </div>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre"
            maxLength={80}
            className="w-full bg-surface-2 border border-subtle rounded-lg px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
          />
          <input
            value={parentesco}
            onChange={(e) => setParentesco(e.target.value)}
            placeholder="Relación (opcional, ej. Hermana)"
            maxLength={40}
            className="w-full bg-surface-2 border border-subtle rounded-lg px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
          />
          <input
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="Teléfono (ej. 341-555-0110)"
            inputMode="tel"
            className="w-full bg-surface-2 border border-subtle rounded-lg px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
          />
          <Button type="submit" disabled={saving || !nombre.trim() || !telefono.trim()} className="mt-1">
            {saving ? 'Guardando…' : 'Guardar contacto'}
          </Button>
        </form>
      )}

      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
    </Card>
  )
}

// Direcciones frecuentes: el usuario les pone un nombre (ej. "Casa", "Sarmiento
// 1231, Rosario - Casa") para distinguirlas, y después aparecen como accesos
// directos al pedir un conductor (ver UserRequest1/UserRequest2).
function SavedAddressesCard() {
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [etiqueta, setEtiqueta] = useState('')
  const [direccion, setDireccion] = useState('')
  const [saving, setSaving] = useState(false)
  const [removingId, setRemovingId] = useState(null)

  useEffect(() => {
    cargarDirecciones()
  }, [])

  async function cargarDirecciones() {
    setLoading(true)
    setError('')
    try {
      const { addresses: list } = await addressesApi.list()
      setAddresses(list)
    } catch (err) {
      setError(err.message || 'No pudimos cargar tus direcciones.')
    } finally {
      setLoading(false)
    }
  }

  async function guardarDireccion(e) {
    e.preventDefault()
    if (!etiqueta.trim() || !direccion.trim()) return
    setSaving(true)
    setError('')
    try {
      let lat, lng, direccionFinal = direccion.trim()
      try {
        const geo = await geocodeAddress(direccion)
        lat = geo.lat
        lng = geo.lng
        direccionFinal = geo.formattedAddress || direccionFinal
      } catch {
        // Si no la pudimos geocodificar igual la guardamos como texto — se puede
        // volver a intentar geocodificarla en el momento de pedir el viaje.
      }
      const { address } = await addressesApi.create({ etiqueta: etiqueta.trim(), direccion: direccionFinal, lat, lng })
      setAddresses((prev) => [address, ...prev])
      setEtiqueta('')
      setDireccion('')
      setFormOpen(false)
    } catch (err) {
      setError(err.message || 'No pudimos guardar la dirección.')
    } finally {
      setSaving(false)
    }
  }

  async function borrarDireccion(id) {
    setRemovingId(id)
    setError('')
    try {
      await addressesApi.remove(id)
      setAddresses((prev) => prev.filter((a) => a.id !== id))
    } catch (err) {
      setError(err.message || 'No pudimos borrar la dirección.')
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <p className="tracking-wide uppercase text-xs font-semibold text-ink-muted">Direcciones frecuentes</p>
        {!formOpen && (
          <button
            onClick={() => setFormOpen(true)}
            className="text-accent text-xs font-semibold flex items-center gap-1 hover:text-accent-light"
          >
            <Plus size={14} strokeWidth={2} /> Agregar
          </button>
        )}
      </div>

      {loading && <p className="text-xs text-ink-faint">Cargando…</p>}

      {!loading && addresses.length === 0 && !formOpen && (
        <p className="text-xs text-ink-faint">
          Todavía no guardaste ninguna dirección. Agregá una para pedir tu viaje más rápido la próxima vez.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {addresses.map((a) => (
          <div key={a.id} className="flex items-center gap-3 bg-surface-3 border border-subtle rounded-xl px-3 py-2.5">
            <MapPin size={16} strokeWidth={1.75} className="text-accent shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink truncate">{a.etiqueta}</p>
              <p className="text-xs text-ink-muted truncate">{a.direccion}</p>
            </div>
            <button
              onClick={() => borrarDireccion(a.id)}
              disabled={removingId === a.id}
              className="text-ink-faint hover:text-red-400 shrink-0 disabled:opacity-40"
              aria-label={`Borrar ${a.etiqueta}`}
            >
              <Trash2 size={16} strokeWidth={1.75} />
            </button>
          </div>
        ))}
      </div>

      {formOpen && (
        <form onSubmit={guardarDireccion} className="mt-3 flex flex-col gap-2 border-t border-subtle pt-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-ink-muted">Nueva dirección</p>
            <button
              type="button"
              onClick={() => {
                setFormOpen(false)
                setEtiqueta('')
                setDireccion('')
              }}
              className="text-ink-faint hover:text-ink"
            >
              <X size={16} strokeWidth={1.75} />
            </button>
          </div>
          <input
            value={etiqueta}
            onChange={(e) => setEtiqueta(e.target.value)}
            placeholder="Nombre (ej. Casa, Trabajo)"
            maxLength={60}
            className="w-full bg-surface-2 border border-subtle rounded-lg px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
          />
          <input
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            placeholder="Dirección (ej. Sarmiento 1231, Rosario)"
            className="w-full bg-surface-2 border border-subtle rounded-lg px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
          />
          <Button type="submit" disabled={saving || !etiqueta.trim() || !direccion.trim()} className="mt-1">
            {saving ? 'Guardando…' : 'Guardar dirección'}
          </Button>
        </form>
      )}

      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
    </Card>
  )
}
