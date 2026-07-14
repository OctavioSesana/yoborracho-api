import { NavLink } from 'react-router-dom'
import { Home, Clock, Bell, User, Wallet } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const userTabs = [
  { to: '/user-home', label: 'Inicio', Icon: Home },
  { to: '/user-history', label: 'Viajes', Icon: Clock },
  { to: '/user-notifications', label: 'Avisos', Icon: Bell },
  { to: '/user-profile', label: 'Perfil', Icon: User },
]

const driverTabs = [
  { to: '/driver-home', label: 'Inicio', Icon: Home },
  { to: '/driver-history', label: 'Viajes', Icon: Clock },
  { to: '/driver-earnings', label: 'Ganancias', Icon: Wallet },
  { to: '/driver-profile', label: 'Perfil', Icon: User },
]

export default function BottomNav() {
  const { isDriver } = useAuth()
  const tabs = isDriver ? driverTabs : userTabs
  return (
    <div className="sticky bottom-0 z-10 border-t border-subtle bg-surface/95 backdrop-blur flex justify-around pt-2 px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      {tabs.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-[11px] ${
              isActive ? 'text-accent' : 'text-ink-muted'
            }`
          }
        >
          <Icon size={20} strokeWidth={1.75} />
          {label}
        </NavLink>
      ))}
    </div>
  )
}
