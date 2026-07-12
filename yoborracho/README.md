# YoBorracho — Frontend

Frontend (React + Vite) de YoBorracho. Para la descripción del producto, arquitectura completa y cómo levantar todo el stack con Docker, ver el [README de la raíz del proyecto](../README.md).

Este paquete solo trae la app React; los datos (usuarios, viajes, notificaciones, direcciones, contactos) vienen todos de la API real del backend — no hay datos mock.

## Cómo correrlo (solo este paquete, requiere el backend corriendo aparte)

```bash
npm install
npm run dev
```

Luego abrí la URL que indique la terminal (por defecto `http://localhost:5173`).

Para generar el build de producción:

```bash
npm run build
npm run preview
```

## Usuarios de prueba

| Email | Contraseña | Rol |
|---|---|---|
| sofia@test.com | 123 | Usuario (pasajera) |
| martin@test.com | 123 | Conductor |

En la pantalla de Login hay botones de "acceso rápido" que completan estas credenciales automáticamente.

## Stack

- React 19 + Vite
- React Router v7
- Tailwind CSS (dark mode, fuente DM Sans, color primario `#2E75B6`)
- `@react-google-maps/api` (mapa real, geocoding, ruta) y `socket.io-client` (tracking en vivo)
- Sin librerías de UI externas (todo con clases de Tailwind)

## Estructura

```
src/
  components/   Botones, Cards, StarRating, BottomNav, PhoneFrame, Toggle, TopBar,
                RealMap, ConfirmDialog, ShareTripCard, etc.
  context/      AuthContext.jsx (login/logout real contra la API, JWT)
  api/          client.js (llamadas REST) y socket.js (WebSocket por viaje)
  data/         mockData.js — solo quedan las etiquetas fijas del formulario de
                calificación; todo lo demás sale de la API
  pages/
    auth/       Splash, Login, RegisterSelect, RegisterUser, RegisterDriver
    verify/     Verify1-4, VerifyPending, VerifyApproved
    user/       Flujo de pasajero (pedido, tracking, calificación, historial, settings)
    driver/     Flujo de conductor (pedidos disponibles, viaje, regreso, ganancias, settings)
    shared/     LogoutConfirm, TripTrack (página pública de seguimiento)
```

## Rutas

**Auth**
- `/splash`
- `/login`
- `/register-select`
- `/register-user`
- `/register-driver`

**Verificación**
- `/verify-1`
- `/verify-2`
- `/verify-3`
- `/verify-4` (solo conductores — los usuarios saltan directo al paso siguiente)
- `/verify-pending`
- `/verify-approved`

**Flujo usuario**
- `/user-home`
- `/user-request-1`
- `/user-request-2`
- `/user-request-3`
- `/user-waiting`
- `/user-tracking-arrive`
- `/user-tracking-ride`
- `/user-arrived`
- `/user-rate`
- `/user-history`
- `/user-history-detail`
- `/user-notifications`
- `/user-profile`
- `/user-profile-edit`
- `/user-settings`

**Flujo conductor**
- `/driver-home`
- `/driver-request`
- `/driver-approach`
- `/driver-checkin`
- `/driver-ride`
- `/driver-dropoff`
- `/driver-return` — deep link a Uber para el regreso + confirmación "Ya volví a casa"
- `/driver-rate`
- `/driver-history`
- `/driver-history-detail`
- `/driver-notifications`
- `/driver-profile`
- `/driver-profile-edit`
- `/driver-earnings`
- `/driver-settings`

**Compartido**
- `/logout-confirm`
- `/track/:tripId` — **pública, sin login**: seguimiento en vivo del viaje para compartir por WhatsApp

## Notas de diseño

- Precio fijo mostrado **antes** de confirmar el viaje (nunca dinámico ni sorpresivo).
- El usuario que pide el viaje solo *observa* su estado (WebSocket + polling de respaldo); quien lo hace avanzar de verdad es siempre el conductor, para que las dos puntas no puedan pisarse entre sí.
- Calificación diferida y doble ciego: cada parte puede calificar apenas termina el viaje, pero ninguna ve la calificación de la otra hasta que ambas calificaron (lógica en el backend, columna `is_visible`).
- El desglose de tarifa (65% conductor / 20% plataforma / 10% fondo de seguro / 5% fondo de daños) se muestra en el detalle de viaje de ambos roles.
- Botón SOS visible durante el viaje activo.
