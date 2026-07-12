import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Star } from 'lucide-react'
import TopBar from '../../components/TopBar'
import Button from '../../components/Button'
import RealMap from '../../components/RealMap'
import { geocodeAddress } from '../../api/geocoding'
import { addressesApi } from '../../api/client'

const SUGERENCIAS = [
  'Bv. Oroño 1450, Rosario',
  'Peatonal Córdoba 950, Rosario',
  'Puerto Norte, Rosario',
  'Zona Universitaria, Rosario',
]

export default function UserRequest1() {
  const navigate = useNavigate()
  const [pickup, setPickup] = useState('Mi ubicación actual')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [savedCoords, setSavedCoords] = useState(null)
  const [savedAddresses, setSavedAddresses] = useState([])

  useEffect(() => {
    addressesApi
      .list()
      .then(({ addresses }) => setSavedAddresses(addresses))
      .catch(() => {}) // si falla, simplemente no mostramos la sección
  }, [])

  function elegirGuardada(addr) {
    setPickup(addr.etiqueta)
    setSavedCoords(addr.lat != null && addr.lng != null ? { lat: addr.lat, lng: addr.lng, address: addr.direccion } : null)
  }

  function useMyLocation() {
    setError('')
    if (!navigator.geolocation) {
      setError('Tu navegador no soporta geolocalización.')
      return
    }
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoading(false)
        navigate('/user-request-2', {
          state: {
            pickup: 'Mi ubicación actual',
            pickupLat: pos.coords.latitude,
            pickupLng: pos.coords.longitude,
          },
        })
      },
      () => {
        setLoading(false)
        setError('No pudimos obtener tu ubicación. Escribí una dirección.')
      },
      { timeout: 6000 }
    )
  }

  async function confirmAddress() {
    setError('')
    if (pickup === 'Mi ubicación actual') {
      useMyLocation()
      return
    }
    // Si eligió una dirección guardada y no la tocó después, ya tenemos lat/lng
    // reales guardados — nos ahorramos volver a geocodificar.
    if (savedCoords) {
      navigate('/user-request-2', {
        state: { pickup: savedCoords.address || pickup, pickupLat: savedCoords.lat, pickupLng: savedCoords.lng },
      })
      return
    }
    setLoading(true)
    try {
      const geo = await geocodeAddress(pickup)
      navigate('/user-request-2', {
        state: { pickup: geo.formattedAddress || pickup, pickupLat: geo.lat, pickupLng: geo.lng },
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      <TopBar title="¿Dónde te buscamos?" onBack={() => navigate('/user-home')} />
      <div className="flex-1 flex flex-col px-4 py-4 gap-4">
        <RealMap height="h-40" showRoute={false}>
          <span className="text-ink-muted text-sm flex items-center gap-1">
            <MapPin size={16} strokeWidth={1.75} /> {pickup}
          </span>
        </RealMap>
        <input
          value={pickup}
          onChange={(e) => {
            setPickup(e.target.value)
            setSavedCoords(null)
          }}
          className="w-full bg-surface-2 border border-subtle rounded-xl px-4 py-3 text-sm text-ink outline-none focus:border-accent"
          placeholder="Dirección de recogida"
        />
        {savedAddresses.length > 0 && (
          <div>
            <p className="tracking-wide uppercase text-xs font-semibold text-ink-muted mb-2">Tus direcciones</p>
            <div className="flex flex-col gap-2">
              {savedAddresses.map((a) => (
                <button
                  key={a.id}
                  onClick={() => elegirGuardada(a)}
                  className="flex items-center gap-3 text-left text-sm bg-surface-2 border border-subtle rounded-xl px-4 py-3 text-ink hover:border-accent"
                >
                  <Star size={16} strokeWidth={1.75} className="text-accent shrink-0" />
                  <span className="min-w-0">
                    <span className="block font-medium">{a.etiqueta}</span>
                    <span className="block text-xs text-ink-muted truncate">{a.direccion}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
        <div>
          <p className="tracking-wide uppercase text-xs font-semibold text-ink-muted mb-2">Sugerencias</p>
          <div className="flex flex-col gap-2">
            {SUGERENCIAS.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setPickup(s)
                  setSavedCoords(null)
                }}
                className="flex items-center gap-2 text-left text-sm bg-surface-2 border border-subtle rounded-xl px-4 py-3 text-ink hover:border-accent"
              >
                <MapPin size={16} strokeWidth={1.75} className="text-ink-muted shrink-0" /> {s}
              </button>
            ))}
          </div>
        </div>
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <Button className="mt-auto" onClick={confirmAddress} disabled={loading}>
          {loading ? 'Ubicando…' : 'Confirmar punto de recogida'}
        </Button>
      </div>
    </div>
  )
}
