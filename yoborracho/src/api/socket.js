// Cliente WebSocket (Socket.io) para el tracking en vivo de un viaje y para las
// alertas de nuevos pedidos del conductor.
// Contrato del backend (ver backend/README.md):
//   - conexión autenticada con el JWT vía `auth: { token }`
//   - room por viaje: `trip:<tripId>`; room personal: `user:<userId>` (se une
//     sola al autenticarse, no hace falta pedirlo desde el cliente)
//   - cliente -> servidor: join_trip, leave_trip, location_update, safety_alert
//   - servidor -> cliente: location_update, trip_status_changed, safety_alert,
//     new_trip_request (a la room personal del conductor)

import { io } from 'socket.io-client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { getAuthToken } from './client'

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001'

let socketSingleton = null

export function getSocket() {
  if (!socketSingleton) {
    socketSingleton = io(WS_URL, {
      autoConnect: false,
      auth: (cb) => cb({ token: getAuthToken() }),
    })
  }
  return socketSingleton
}

/**
 * Hook de tracking en vivo para un viaje. Se une a la room `trip:<tripId>`
 * mientras el componente está montado y expone la última ubicación, el
 * último cambio de estado y la última alerta de seguridad recibidos.
 */
export function useTripSocket(tripId) {
  const [location, setLocation] = useState(null)
  const [status, setStatus] = useState(null)
  const [safetyAlert, setSafetyAlert] = useState(null)
  const [connected, setConnected] = useState(false)
  const socketRef = useRef(null)

  useEffect(() => {
    if (!tripId) return undefined

    const socket = getSocket()
    socketRef.current = socket

    function handleConnect() {
      setConnected(true)
      socket.emit('join_trip', { tripId })
    }
    function handleDisconnect() {
      setConnected(false)
    }
    function handleLocation(payload) {
      if (payload?.tripId === tripId) setLocation(payload)
    }
    function handleStatus(payload) {
      if (payload?.tripId === tripId) setStatus(payload.status)
    }
    function handleSafety(payload) {
      if (payload?.tripId === tripId) setSafetyAlert(payload)
    }

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('location_update', handleLocation)
    socket.on('trip_status_changed', handleStatus)
    socket.on('safety_alert', handleSafety)

    if (!socket.connected) socket.connect()
    else handleConnect()

    return () => {
      if (socket.connected) socket.emit('leave_trip', { tripId })
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.off('location_update', handleLocation)
      socket.off('trip_status_changed', handleStatus)
      socket.off('safety_alert', handleSafety)
    }
  }, [tripId])

  const sendLocation = useCallback(
    (lat, lng) => {
      if (tripId && socketRef.current) {
        socketRef.current.emit('location_update', { tripId, lat, lng })
      }
    },
    [tripId]
  )

  const sendSafetyAlert = useCallback(
    (mensaje) => {
      if (tripId && socketRef.current) {
        socketRef.current.emit('safety_alert', { tripId, mensaje })
      }
    },
    [tripId]
  )

  return { location, status, safetyAlert, connected, sendLocation, sendSafetyAlert }
}

const ALERT_AUTO_DISMISS_MS = 20000

/**
 * Alertas flotantes de "nuevo pedido" para el conductor. No está atado a un
 * viaje puntual: mientras `enabled` sea true (el conductor tiene sesión
 * iniciada), escucha el evento `new_trip_request` en su room personal sin
 * importar en qué pantalla de la app esté. Cada alerta se auto-descarta a
 * los 20s si el conductor no la cierra ni la abre antes.
 */
export function useDriverTripAlerts(enabled) {
  const [alerts, setAlerts] = useState([])
  const timersRef = useRef({})

  const dismiss = useCallback((key) => {
    setAlerts((prev) => prev.filter((a) => a.key !== key))
    clearTimeout(timersRef.current[key])
    delete timersRef.current[key]
  }, [])

  useEffect(() => {
    if (!enabled) return undefined
    const socket = getSocket()

    function handleNewTrip(payload) {
      const key = `${payload.tripId}-${payload.timestamp}`
      setAlerts((prev) => [...prev, { ...payload, key }])
      timersRef.current[key] = setTimeout(() => dismiss(key), ALERT_AUTO_DISMISS_MS)
    }

    socket.on('new_trip_request', handleNewTrip)
    if (!socket.connected) socket.connect()

    return () => {
      socket.off('new_trip_request', handleNewTrip)
    }
  }, [enabled, dismiss])

  useEffect(() => {
    const timers = timersRef.current
    return () => {
      Object.values(timers).forEach(clearTimeout)
    }
  }, [])

  return { alerts, dismiss }
}
