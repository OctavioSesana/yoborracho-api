import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Home, Briefcase, Navigation, Star } from 'lucide-react'
import TopBar from '../../components/TopBar'
import Button from '../../components/Button'
import RealMap from '../../components/RealMap'
import { geocodeAddress } from '../../api/geocoding'
import { addressesApi } from '../../api/client'

const DESTINOS = [
  { label: 'Casa', dir: 'Av. Pellegrini 3200, Rosario', icon: Home },
  { label: 'Trabajo', dir: 'Bv. Avellaneda 900, Rosario', icon: Briefcase },
]

export default function UserRequest2() {
  const navigate = useNavigate()
  const location = useLocation()
  const pickup = location.state?.pickup || 'Mi ubicación actual'
  const pickupLat = location.state?.pickupLat
  const pickupLng = location.state?.pickupLng
  const [destino, setDestino] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [savedCoords, setSavedCoords] = useState(null)
  const [savedAddresses, setSavedAddresses] = useState([])

  useEffect(() => {
    addressesApi
      .list()
      .then(({ addresses }) => setSavedAddresses(addresses))
      .catch(() => {})
  }, [])

  function elegirGuardada(addr) {
    setDestino(addr.etiqueta)
    setSavedCoords(addr.lat != null && addr.lng != null ? { lat: addr.lat, lng: addr.lng, address: addr.direccion } : null)
  }

  async function handleContinue() {
    setError('')
    if (savedCoords) {
      navigate('/user-request-3', {
        state: {
          pickup,
          pickupLat,
          pickupLng,
          destino: savedCoords.address || destino,
          destinoLat: savedCoords.lat,
          destinoLng: savedCoords.lng,
        },
      })
      return
    }
    setLoading(true)
    try {
      const geo = await geocodeAddress(destino)
      navigate('/user-request-3', {
        state: {
          pickup,
          pickupLat,
          pickupLng,
          destino: geo.formattedAddress || destino,
          destinoLat: geo.lat,
          destinoLng: geo.lng,
        },
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const pickupPoint = pickupLat && pickupLng ? { lat: pickupLat, lng: pickupLng } : undefined

  return (
    <div className="flex-1 flex flex-col">
      <TopBar title="¿A dónde vamos?" onBack={() => navigate('/user-request-1')} />
      <div className="flex-1 flex flex-col px-4 py-4 gap-4">
        <RealMap height="h-40" pickup={pickupPoint} showRoute={false}>
          <span className="text-ink-muted text-sm flex items-center gap-1">
            <Navigation size={16} strokeWidth={1.75} /> {pickup} &rarr; {destino || '...'}
          </span>
        </RealMap>
        <input
          value={destino}
          onChange={(e) => {
            setDestino(e.target.value)
            setSavedCoords(null)
          }}
          className="w-full bg-surface-2 border border-subtle rounded-xl px-4 py-3 text-sm text-ink outline-none focus:border-accent"
          placeholder="Dirección de destino (normalmente, tu casa)"
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
          <p className="tracking-wide uppercase text-xs font-semibold text-ink-muted mb-2">Accesos directos</p>
          <div className="flex flex-col gap-2">
            {DESTINOS.map((d) => (
              <button
                key={d.label}
                onClick={() => {
                  setDestino(d.dir)
                  setSavedCoords(null)
                }}
                className="flex items-center gap-3 text-left text-sm bg-surface-2 border border-subtle rounded-xl px-4 py-3 text-ink hover:border-accent"
              >
                <d.icon size={20} strokeWidth={1.5} className="text-accent shrink-0" />
                <span>
                  <span className="block font-medium">{d.label}</span>
                  <span className="block text-xs text-ink-muted">{d.dir}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <Button className="mt-auto" disabled={!destino || loading} onClick={handleContinue}>
          {loading ? 'Ubicando…' : 'Continuar'}
        </Button>
      </div>
    </div>
  )
}
