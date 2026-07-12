import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, MessageCircle } from 'lucide-react'
import Card from './Card'
import { contactsApi } from '../api/client'

// Arma el link de wa.me. wa.me espera el número en formato internacional sin
// signos (ej. 5493415550110). Los datos de prueba usan formato local argentino
// (341-555-0110, sin código de país) — para no perder la funcionalidad con
// esos datos, si el teléfono no arranca con un código de país reconocible le
// anteponemos el prefijo de Argentina (54 9). En producción, lo correcto es
// pedir el teléfono ya en formato E.164 al guardarlo.
function toWhatsAppNumber(telefono) {
  const digits = (telefono || '').replace(/\D/g, '')
  if (!digits) return null
  if (digits.startsWith('54')) return digits
  return `549${digits}`
}

/**
 * Tarjeta de "compartir viaje" — se usa en las pantallas de tracking del
 * usuario. Lista sus contactos de confianza y, al tocar uno, abre WhatsApp
 * con un mensaje que incluye el link público de seguimiento (`/track/:tripId`,
 * sin login) para que puedan ver el viaje en tiempo real.
 */
export default function ShareTripCard({ tripId }) {
  const navigate = useNavigate()
  const [contacts, setContacts] = useState([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    contactsApi
      .list()
      .then(({ contacts: list }) => setContacts(list))
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  if (!loaded) return null

  const trackUrl = `${window.location.origin}/track/${tripId}`
  const mensaje = `Estoy volviendo con YoBorracho: un conductor está manejando mi auto hasta casa. Podés seguir mi viaje en vivo acá (no hace falta la app): ${trackUrl}`

  if (contacts.length === 0) {
    return (
      <Card className="bg-surface-2">
        <p className="text-xs text-ink-muted flex items-start gap-2">
          <ShieldCheck size={16} strokeWidth={1.75} className="text-accent shrink-0 mt-0.5" />
          Todavía no tenés contactos de confianza guardados.{' '}
          <button onClick={() => navigate('/user-settings')} className="text-accent underline underline-offset-2">
            Agregá uno en Configuración
          </button>{' '}
          para poder compartir tu viaje en tiempo real.
        </p>
      </Card>
    )
  }

  return (
    <Card className="bg-surface-2">
      <p className="text-xs text-ink-muted flex items-start gap-2 mb-3">
        <ShieldCheck size={16} strokeWidth={1.75} className="text-accent shrink-0 mt-0.5" />
        Compartí tu viaje en tiempo real con un contacto de confianza:
      </p>
      <div className="flex flex-col gap-2">
        {contacts.map((c) => {
          const numero = toWhatsAppNumber(c.telefono)
          if (!numero) return null
          const href = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`
          return (
            <a
              key={c.id}
              href={href}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between gap-2 bg-surface-3 border border-subtle rounded-lg px-3 py-2.5 text-sm text-ink hover:border-accent"
            >
              <span className="truncate">
                {c.nombre} {c.parentesco && <span className="text-ink-muted text-xs">({c.parentesco})</span>}
              </span>
              <MessageCircle size={16} strokeWidth={1.75} className="text-emerald-400 shrink-0" />
            </a>
          )
        })}
      </div>
    </Card>
  )
}
