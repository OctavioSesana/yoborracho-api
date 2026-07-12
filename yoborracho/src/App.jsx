import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import PhoneFrame from './components/PhoneFrame'

import Splash from './pages/auth/Splash'
import Login from './pages/auth/Login'
import RegisterSelect from './pages/auth/RegisterSelect'
import RegisterUser from './pages/auth/RegisterUser'
import RegisterDriver from './pages/auth/RegisterDriver'

import Verify1 from './pages/verify/Verify1'
import Verify2 from './pages/verify/Verify2'
import Verify3 from './pages/verify/Verify3'
import Verify4 from './pages/verify/Verify4'
import VerifyPending from './pages/verify/VerifyPending'
import VerifyApproved from './pages/verify/VerifyApproved'

import UserHome from './pages/user/UserHome'
import UserRequest1 from './pages/user/UserRequest1'
import UserRequest2 from './pages/user/UserRequest2'
import UserRequest3 from './pages/user/UserRequest3'
import UserWaiting from './pages/user/UserWaiting'
import UserTrackingArrive from './pages/user/UserTrackingArrive'
import UserTrackingRide from './pages/user/UserTrackingRide'
import UserArrived from './pages/user/UserArrived'
import UserRate from './pages/user/UserRate'
import UserHistory from './pages/user/UserHistory'
import UserHistoryDetail from './pages/user/UserHistoryDetail'
import UserNotifications from './pages/user/UserNotifications'
import UserProfile from './pages/user/UserProfile'
import UserProfileEdit from './pages/user/UserProfileEdit'
import UserSettings from './pages/user/UserSettings'

import DriverHome from './pages/driver/DriverHome'
import DriverRequest from './pages/driver/DriverRequest'
import DriverApproach from './pages/driver/DriverApproach'
import DriverCheckin from './pages/driver/DriverCheckin'
import DriverRide from './pages/driver/DriverRide'
import DriverDropoff from './pages/driver/DriverDropoff'
import DriverReturn from './pages/driver/DriverReturn'
import DriverRate from './pages/driver/DriverRate'
import DriverHistory from './pages/driver/DriverHistory'
import DriverHistoryDetail from './pages/driver/DriverHistoryDetail'
import DriverNotifications from './pages/driver/DriverNotifications'
import DriverProfile from './pages/driver/DriverProfile'
import DriverProfileEdit from './pages/driver/DriverProfileEdit'
import DriverEarnings from './pages/driver/DriverEarnings'
import DriverSettings from './pages/driver/DriverSettings'

import LogoutConfirm from './pages/shared/LogoutConfirm'
import TripTrack from './pages/shared/TripTrack'
import DriverTripAlerts from './components/DriverTripAlerts'

function Protected({ children }) {
  const { user, authLoading } = useAuth()
  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-surface">
        <div className="w-8 h-8 rounded-full border-2 border-surface-3 border-t-accent animate-spin" />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      {/* Auth */}
      <Route path="/" element={<Navigate to="/splash" replace />} />
      <Route path="/splash" element={<Splash />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register-select" element={<RegisterSelect />} />
      <Route path="/register-user" element={<RegisterUser />} />
      <Route path="/register-driver" element={<RegisterDriver />} />

      {/* Verificación */}
      <Route path="/verify-1" element={<Verify1 />} />
      <Route path="/verify-2" element={<Verify2 />} />
      <Route path="/verify-3" element={<Verify3 />} />
      <Route path="/verify-4" element={<Verify4 />} />
      <Route path="/verify-pending" element={<VerifyPending />} />
      <Route path="/verify-approved" element={<VerifyApproved />} />

      {/* Usuario */}
      <Route path="/user-home" element={<Protected><UserHome /></Protected>} />
      <Route path="/user-request-1" element={<Protected><UserRequest1 /></Protected>} />
      <Route path="/user-request-2" element={<Protected><UserRequest2 /></Protected>} />
      <Route path="/user-request-3" element={<Protected><UserRequest3 /></Protected>} />
      <Route path="/user-waiting" element={<Protected><UserWaiting /></Protected>} />
      <Route path="/user-tracking-arrive" element={<Protected><UserTrackingArrive /></Protected>} />
      <Route path="/user-tracking-ride" element={<Protected><UserTrackingRide /></Protected>} />
      <Route path="/user-arrived" element={<Protected><UserArrived /></Protected>} />
      <Route path="/user-rate" element={<Protected><UserRate /></Protected>} />
      <Route path="/user-history" element={<Protected><UserHistory /></Protected>} />
      <Route path="/user-history-detail" element={<Protected><UserHistoryDetail /></Protected>} />
      <Route path="/user-notifications" element={<Protected><UserNotifications /></Protected>} />
      <Route path="/user-profile" element={<Protected><UserProfile /></Protected>} />
      <Route path="/user-profile-edit" element={<Protected><UserProfileEdit /></Protected>} />
      <Route path="/user-settings" element={<Protected><UserSettings /></Protected>} />

      {/* Conductor */}
      <Route path="/driver-home" element={<Protected><DriverHome /></Protected>} />
      <Route path="/driver-request" element={<Protected><DriverRequest /></Protected>} />
      <Route path="/driver-approach" element={<Protected><DriverApproach /></Protected>} />
      <Route path="/driver-checkin" element={<Protected><DriverCheckin /></Protected>} />
      <Route path="/driver-ride" element={<Protected><DriverRide /></Protected>} />
      <Route path="/driver-dropoff" element={<Protected><DriverDropoff /></Protected>} />
      <Route path="/driver-return" element={<Protected><DriverReturn /></Protected>} />
      <Route path="/driver-rate" element={<Protected><DriverRate /></Protected>} />
      <Route path="/driver-history" element={<Protected><DriverHistory /></Protected>} />
      <Route path="/driver-history-detail" element={<Protected><DriverHistoryDetail /></Protected>} />
      <Route path="/driver-notifications" element={<Protected><DriverNotifications /></Protected>} />
      <Route path="/driver-profile" element={<Protected><DriverProfile /></Protected>} />
      <Route path="/driver-profile-edit" element={<Protected><DriverProfileEdit /></Protected>} />
      <Route path="/driver-earnings" element={<Protected><DriverEarnings /></Protected>} />
      <Route path="/driver-settings" element={<Protected><DriverSettings /></Protected>} />

      {/* Compartido */}
      <Route path="/logout-confirm" element={<Protected><LogoutConfirm /></Protected>} />

      {/* Pública — sin login, es el link que se comparte por WhatsApp */}
      <Route path="/track/:tripId" element={<TripTrack />} />

      <Route path="*" element={<Navigate to="/splash" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <PhoneFrame>
          <AppRoutes />
          {/* Fuera de <Routes>: sigue montado sin importar a qué pantalla navegue
              el conductor, así no se pierde la conexión de alertas de nuevos pedidos. */}
          <DriverTripAlerts />
        </PhoneFrame>
      </BrowserRouter>
    </AuthProvider>
  )
}
