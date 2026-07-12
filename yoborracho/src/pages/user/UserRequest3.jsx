import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Circle, Square, Car } from 'lucide-react'
import TopBar from '../../components/TopBar'
import Button from '../../components/Button'
import Card from '../../components/Card'
import RealMap from '../../components/RealMap'
import { tripsApi, vehiclesApi } from '../../api/client'
import { distanciaHaversineKm, calcularTarifaEstimada, calcularDesglose } from '../../lib/fareEstimate'

export default function UserRequest3() {
  const navigate = useNavigate()
  const location = useLocation()
  const pickup = location.state?.pickup || 'Mi ubicación actual'
  const destino = location.state?.destino || 'Av. Pellegrini 3200, Rosario'
  const pickupLat = location.state?.pickupLat
  const pickupLng = location.state?.pickupLng
  const destinoLat = location.state?.destinoLat
  const destinoLng = location.state?.destinoLng

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const distanciaEstimada = distanciaHaversineKm(pickupLat, pickupLng, destinoLat, destinoLng)
  const desglose = calcularDesglose(calcularTarifaEstimada(distanciaEstimada))

  const pickupPoint = pickupLat && pickupLng ? { lat: pickupLat, lng: pickupLng } : undefined
  const dropoffPoint = destinoLat && destinoLng ? { lat: destinoLat, lng: destinoLng } : undefined

  async function getOrCreateDefaultVehicle() {
    const { vehicles } = await vehiclesApi.list()
    if (vehicles.length > 0) return vehicles[0].id
    // El diseño original no incluye una pantalla de alta de vehículo, así que
    // se aprovisiona un vehículo por defecto en el primer pedido.
    const { vehicle } = await vehiclesApi.create({
      marca: 'Mi',
      modelo: 'Auto',
      patente: 'AA000AA',
      color: 'Gris',
      transmision: 'manual',
    })
    return vehicle.id
  }

  async function confirmarPedido() {
    setError('')
    setLoading(true)
    try {
      const vehicleId = await getOrCreateDefaultVehicle()
      const { trip } = await tripsApi.create({
        pickupAddress: pickup,
        pickupLat,
        pickupLng,
        dropoffAddress: destino,
        dropoffLat: destinoLat,
        dropoffLng: destinoLng,
        vehicleId,
      })
      navigate('/user-waiting', { state: { tripId: trip.id } })
    } catch (err) {
      setError(err.message || 'No pudimos crear tu pedido. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      <TopBar title="Confirmá tu viaje" onBack={() => navigate('/user-request-2')} />
      <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col px-4 py-4 gap-4">
        {(pickupPoint || dropoffPoint) && (
          <RealMap height="h-40" pickup={pickupPoint} dropoff={dropoffPoint} />
        )}
        <Card>
          <div className="flex flex-col gap-3">
            <div className="flex gap-3 items-start">
              <Circle size={12} strokeWidth={2} className="text-accent fill-accent mt-1" />
              <div>
                <p className="text-xs text-ink-muted">Recogida</p>
                <p className="text-sm font-medium text-ink">{pickup}</p>
              </div>
            </div>
            <div className="border-l border-dashed border-subtle ml-[5px] h-4" />
            <div className="flex gap-3 items-start">
              <Square size={12} strokeWidth={2} className="text-ink-muted fill-ink-muted mt-1" />
              <div>
                <p className="text-xs text-ink-muted">Destino</p>
                <p className="text-sm font-medium text-ink">{destino}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <p className="text-sm font-semibold mb-2 text-ink">Precio fijo — sin sorpresas</p>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold text-accent">${desglose.total.toLocaleString('es-AR')}</span>
            <span className="text-xs text-ink-muted">incluye el regreso del conductor</span>
          </div>
          <p className="text-[11px] text-ink-muted mt-2">
            Estimado según la distancia. El precio final lo confirma el servidor al crear el pedido y no cambia después, sin importar demoras o tráfico.
          </p>
        </Card>

        <Card>
          <p className="text-sm font-semibold mb-2 text-ink flex items-center gap-2">
            <Car size={16} strokeWidth={1.75} className="text-accent" /> Un conductor manejará tu propio auto
          </p>
          <p className="text-xs text-ink-muted">
            El conductor llega hasta vos en Uber/remis, verifica tu identidad y el estado del auto, y lo maneja hasta tu destino. El costo de su regreso ya está incluido en el precio.
          </p>
        </Card>

        {error && <p className="text-red-500 text-xs">{error}</p>}
        <Button className="mt-auto" disabled={loading} onClick={confirmarPedido}>
          {loading ? 'Enviando pedido…' : `Confirmar y pedir conductor — $${desglose.total.toLocaleString('es-AR')}`}
        </Button>
      </div>
    </div>
  )
}
