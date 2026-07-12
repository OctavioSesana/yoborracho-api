import { useCallback, useEffect, useState } from 'react'
import {
  GoogleMap,
  Marker,
  DirectionsRenderer,
  DirectionsService,
  useJsApiLoader,
} from '@react-google-maps/api'
import { GOOGLE_MAPS_SCRIPT_ID, GOOGLE_MAPS_LIBRARIES, ROSARIO_CENTER } from '../lib/googleMaps'

const mapContainerStyle = { width: '100%', height: '100%' }

// Estilo oscuro simple, coherente con la paleta negro/blanco/gris + acento navy.
const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#1a1a1c' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a1c' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8b8b90' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#3c3c40' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2a2a2d' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#8b8b90' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3a3a3e' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e2233' }] },
]

/**
 * Mapa real de Google Maps (reemplaza MapPlaceholder) con:
 *  - marker de recogida (pickup) y destino (dropoff)
 *  - marker de posición del conductor en vivo (driverPosition), si se provee
 *  - ruta real dibujada entre pickup y dropoff vía Directions API
 *
 * `onRouteComputed(path, leg)` se invoca una vez con el polyline completo
 * (array de {lat,lng}) y el "leg" de Directions (distancia/duración), útil
 * para interpolar el movimiento simulado del conductor en driver-ride.
 */
export default function RealMap({
  height = 'h-56',
  pickup,
  dropoff,
  driverPosition,
  showRoute = true,
  onRouteComputed,
  zoom,
  children,
}) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: GOOGLE_MAPS_SCRIPT_ID,
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  })

  const [directions, setDirections] = useState(null)
  const [routeRequestKey, setRouteRequestKey] = useState(null)

  const routeKey =
    pickup && dropoff
      ? `${pickup.lat.toFixed(5)},${pickup.lng.toFixed(5)}-${dropoff.lat.toFixed(5)},${dropoff.lng.toFixed(5)}`
      : null

  useEffect(() => {
    if (routeKey !== routeRequestKey) {
      setDirections(null)
    }
  }, [routeKey, routeRequestKey])

  const handleDirectionsCallback = useCallback(
    (result, status) => {
      if (status === 'OK' && result) {
        setDirections(result)
        setRouteRequestKey(routeKey)
        if (onRouteComputed) {
          const leg = result.routes[0].legs[0]
          const path = result.routes[0].overview_path.map((p) => ({ lat: p.lat(), lng: p.lng() }))
          onRouteComputed(path, leg)
        }
      }
    },
    [onRouteComputed, routeKey]
  )

  const center = driverPosition || pickup || dropoff || ROSARIO_CENTER

  if (loadError) {
    return (
      <div className={`relative w-full ${height} rounded-xl overflow-hidden border border-subtle bg-surface-2 flex items-center justify-center`}>
        <span className="text-ink-faint text-xs px-4 text-center">
          No se pudo cargar el mapa. Revisá tu conexión o la clave de Google Maps.
        </span>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className={`relative w-full ${height} rounded-xl overflow-hidden border border-subtle bg-surface-2 flex items-center justify-center`}>
        <div className="w-6 h-6 rounded-full border-2 border-surface-3 border-t-accent animate-spin" />
      </div>
    )
  }

  return (
    <div className={`relative w-full ${height} rounded-xl overflow-hidden border border-subtle`}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={zoom || (pickup && dropoff ? 13 : 14)}
        options={{
          styles: DARK_MAP_STYLE,
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
        }}
      >
        {showRoute && pickup && dropoff && !directions && (
          <DirectionsService
            options={{ origin: pickup, destination: dropoff, travelMode: 'DRIVING' }}
            callback={handleDirectionsCallback}
          />
        )}
        {showRoute && directions && (
          <DirectionsRenderer
            options={{
              directions,
              suppressMarkers: true,
              polylineOptions: { strokeColor: '#2E75B6', strokeWeight: 4 },
            }}
          />
        )}
        {pickup && (
          <Marker
            position={pickup}
            label={{ text: 'A', color: '#ffffff', fontSize: '11px', fontWeight: '700' }}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#2E75B6',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            }}
          />
        )}
        {dropoff && (
          <Marker
            position={dropoff}
            label={{ text: 'B', color: '#ffffff', fontSize: '11px', fontWeight: '700' }}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#1a1a1c',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            }}
          />
        )}
        {driverPosition && (
          <Marker
            position={driverPosition}
            icon={{
              path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: 5,
              fillColor: '#F5F5F7',
              fillOpacity: 1,
              strokeColor: '#2E75B6',
              strokeWeight: 2,
              rotation: driverPosition.heading || 0,
            }}
          />
        )}
      </GoogleMap>
      {children && (
        <div className="absolute bottom-2 left-2 right-2 bg-surface/90 backdrop-blur rounded-lg px-3 py-2 pointer-events-none">
          {children}
        </div>
      )}
    </div>
  )
}
