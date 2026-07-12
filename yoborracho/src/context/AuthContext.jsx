import { createContext, useContext, useEffect, useState } from 'react'
import { authApi, getAuthToken, setAuthToken } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [pendingRole, setPendingRole] = useState(null) // rol elegido durante registro, antes de tener user
  const [verificationStep, setVerificationStep] = useState(0)
  const [authLoading, setAuthLoading] = useState(true)

  // Rehidrata la sesión al cargar la app: si hay un JWT guardado, confirma
  // que sigue siendo válido pidiendo el perfil actual.
  useEffect(() => {
    let cancelled = false
    async function rehydrate() {
      const token = getAuthToken()
      if (!token) {
        setAuthLoading(false)
        return
      }
      try {
        const { user: me } = await authApi.me()
        if (!cancelled) setUser(me)
      } catch {
        setAuthToken(null)
      } finally {
        if (!cancelled) setAuthLoading(false)
      }
    }
    rehydrate()
    return () => {
      cancelled = true
    }
  }, [])

  async function login(email, password) {
    try {
      const { token, user: loggedUser } = await authApi.login({ email, password })
      setAuthToken(token)
      setUser(loggedUser)
      return { ok: true, user: loggedUser }
    } catch (err) {
      return { ok: false, error: err.message || 'Email o contraseña incorrectos.' }
    }
  }

  function logout() {
    authApi.logout().catch(() => {})
    setAuthToken(null)
    setUser(null)
    setVerificationStep(0)
  }

  // Registro real contra el backend. Se conserva el nombre `registerMock` para
  // no tener que tocar todas las pantallas que ya lo consumen — ahora crea una
  // cuenta real (POST /api/auth/register) en vez de un usuario en memoria.
  async function registerMock(role, data) {
    try {
      const { token, user: newUser } = await authApi.register({
        email: data.email,
        password: data.password || '123',
        nombre: data.nombre,
        telefono: data.telefono || undefined,
        role,
        zona: data.zona || undefined,
      })
      setAuthToken(token)
      setUser(newUser)
      return { ok: true, user: newUser }
    } catch (err) {
      return { ok: false, error: err.message || 'No se pudo completar el registro.' }
    }
  }

  const value = {
    user,
    setUser,
    login,
    logout,
    pendingRole,
    setPendingRole,
    verificationStep,
    setVerificationStep,
    registerMock,
    authLoading,
    isDriver: user?.role === 'conductor',
    isRider: user?.role === 'usuario',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
