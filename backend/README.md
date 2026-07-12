# YoBorracho — Backend

API REST + WebSocket para YoBorracho: un conductor verificado va hasta donde estás,
te lleva a tu casa **manejando tu propio auto** (no el suyo).

## Stack

- **Node.js + Express** — API REST.
- **PostgreSQL** vía el driver `pg` (SQL crudo, sin ORM) — simple, transparente y suficiente
  para este dominio; se evita la complejidad extra de un ORM/query builder.
- **Socket.io** — tracking en vivo por viaje (rooms).
- **jsonwebtoken** — autenticación stateless con JWT.
- **bcryptjs** — hash de contraseñas (implementación pura en JS, sin compilación nativa,
  para evitar problemas de build en distintos entornos/Docker).
- **zod** — validación de payloads.

## Estructura

```
backend/
  src/
    routes/            rutas Express (una por recurso)
    controllers/        lógica de negocio de cada ruta
    middleware/          auth (JWT), manejo de errores
    db/                   pool de conexión + runner de migraciones
    ws/                   servidor de WebSocket (Socket.io)
    utils/                cálculo de tarifa y máquina de estados del viaje
  migrations/            archivos .sql numerados, se aplican en orden
  seed/                   script de datos de ejemplo
  Dockerfile
  .env.example
```

## Configuración

1. Copiá `.env.example` a `.env` y completá los valores (o dejá los de ejemplo para desarrollo local).

```
DATABASE_URL=postgres://yoborracho:yoborracho@localhost:5432/yoborracho
JWT_SECRET=cambiar-este-secreto-en-produccion
JWT_EXPIRES_IN=7d
PORT=3001
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

2. Instalá dependencias:

```bash
npm install
```

3. Corré las migraciones (crea las tablas):

```bash
npm run migrate
```

4. Cargá los datos de ejemplo (usuarios de prueba, viajes, calificaciones):

```bash
npm run seed
```

5. Arrancá el servidor:

```bash
npm run dev     # con recarga automática (node --watch)
npm start       # sin recarga
```

El servidor **no se cae** si Postgres no está disponible al arrancar: sigue escuchando
en el puerto configurado y las rutas que dependen de la base devuelven `503` hasta
que la conexión esté disponible. Podés chequear el estado con `GET /health`.

## Usuarios de prueba (creados por el seed)

| Email              | Password | Rol       |
|--------------------|----------|-----------|
| sofia@test.com     | 123      | usuario   |
| martin@test.com    | 123      | conductor |

## Modelo de datos (resumen)

- **users** — cuenta base (usuario o conductor).
- **driver_profiles** — datos de verificación/onboarding del conductor (DNI, licencia,
  estado de verificación, zona de operación, disponibilidad).
- **vehicles** — autos de los usuarios (riders); son los autos que termina manejando el conductor.
- **trips** — el viaje en sí, con el flujo de 9 estados y un timestamp por etapa.
- **ratings** — calificaciones con lógica de **doble ciego diferido**: la fila queda
  oculta (`is_visible = false`) hasta que ambas partes del viaje calificaron; en ese
  momento se revelan ambas.
- **notifications** — notificaciones in-app por usuario.
- **trip_locations** — traza de puntos GPS por viaje (usada por el WebSocket y el polling REST).

## Flujo de estados del viaje

```
solicitud → matching → aceptado → traslado_al_punto → verificacion →
en_viaje → llegada → regreso_conductor → completado
```

Cualquier estado (salvo `completado`/`cancelado`) puede pasar a `cancelado`.
La transición se valida en el backend (`src/utils/tripStateMachine.js`); un intento
de saltar pasos devuelve `409`.

## Tarifa y reparto 65/20/10/5

`src/utils/fare.js` calcula una tarifa fija en base a la distancia estimada
(haversine entre origen y destino) y reparte el total:

- 65% conductor
- 20% plataforma
- 10% fondo de seguro
- 5% fondo de daños

## Endpoints

Todas las rutas (salvo `/api/auth/register` y `/api/auth/login`) requieren el header:

```
Authorization: Bearer <token>
```

### Auth

**POST /api/auth/register**
```json
// request
{ "email": "nueva@test.com", "password": "123", "nombre": "Nueva Usuaria", "role": "usuario", "telefono": "341-555-0000", "zona": "Centro" }
// response 201
{ "token": "eyJhbGciOi...", "user": { "id": "...", "email": "nueva@test.com", "nombre": "Nueva Usuaria", "role": "usuario", "calificacion": 0, "viajesTotales": 0, ... } }
```

**POST /api/auth/login**
```json
// request
{ "email": "sofia@test.com", "password": "123" }
// response 200
{ "token": "eyJhbGciOi...", "user": { "id": "...", "email": "sofia@test.com", "nombre": "Sofía Martínez", "role": "usuario", ... } }
```

**POST /api/auth/logout** → `{ "ok": true, "mensaje": "Sesión cerrada." }`

**GET /api/auth/me** → `{ "user": { ... } }`

### Usuarios

**GET /api/users/me** → perfil del usuario autenticado.

**PATCH /api/users/me**
```json
// request
{ "nombre": "Sofía M.", "telefono": "341-000-0000", "zona": "Fisherton" }
// response
{ "user": { ... } }
```

### Conductores (verificación / onboarding, 4 etapas)

**GET /api/drivers/me** → perfil de verificación del conductor.

**POST /api/drivers/verify** — envía datos de una etapa (1 a 4) del onboarding.
El body incluye `step` y los campos propios de esa etapa:

```json
// etapa 1: registro básico
{ "step": 1, "telefono": "341-555-0000", "zona": "Centro, Rosario", "selfieUrl": "https://..." }

// etapa 2: verificación de identidad
{ "step": 2, "dniNumero": "30123456", "dniFrenteUrl": "https://...", "dniDorsoUrl": "https://...",
  "licenciaNumero": "LC-991234", "licenciaVencimiento": "2027-06-01" }

// etapa 3: capacitación obligatoria
{ "step": 3, "capacitacionCompletada": true }

// etapa 4: viaje de prueba supervisado
{ "step": 4, "viajePruebaAprobado": true }
```
Respuesta (todas las etapas): `{ "profile": { "verificationStatus": "activo", "etapaActual": 4, ... } }`

**PATCH /api/drivers/disponibilidad**
```json
{ "disponible": true }
```

### Vehículos (autos de los usuarios)

**GET /api/vehicles** → `{ "vehicles": [ ... ] }`

**POST /api/vehicles**
```json
{ "marca": "Volkswagen", "modelo": "Gol Trend", "anio": 2019, "patente": "AF204XY", "color": "Gris", "transmision": "manual" }
```

### Viajes

**POST /api/trips** — el usuario solicita un viaje.
```json
// request
{ "pickupAddress": "Bv. Oroño 1450", "pickupLat": -32.94, "pickupLng": -60.63,
  "dropoffAddress": "Av. Pellegrini 3200", "dropoffLat": -32.95, "dropoffLng": -60.66,
  "vehicleId": "uuid-del-vehiculo" }
// response 201
{ "trip": { "id": "...", "status": "matching", "fareTotal": 8000,
  "fareBreakdown": { "total": 8000, "conductor": 5200, "plataforma": 1600, "fondoSeguro": 800, "fondoDanos": 400 }, ... } }
```

**GET /api/trips** — historial. Filtros opcionales por query string: `?status=completado&from=2026-01-01&to=2026-12-31`.

**GET /api/trips/available** — (sólo conductor) viajes en estado `matching` sin conductor asignado, filtrados por zona del conductor.

**GET /api/trips/:id** — detalle de un viaje (sólo accesible por el rider o el driver del viaje).

**POST /api/trips/:id/accept** — (sólo conductor) acepta un viaje en `matching`.

**PATCH /api/trips/:id/status** — avanza el estado del viaje según la máquina de estados.
```json
{ "status": "en_viaje" }
// o para cancelar:
{ "status": "cancelado", "cancelReason": "El usuario canceló." }
```

**GET /api/trips/:id/locations** — traza de ubicaciones (fallback REST de polling).

**POST /api/trips/:id/locations** — envía una ubicación puntual (fallback REST, sin WebSocket).
```json
{ "lat": -32.94, "lng": -60.63 }
```

### Calificaciones (doble ciego diferido)

**POST /api/trips/:id/rating**
```json
{ "stars": 5, "criteria": { "manejoDefensivo": 5, "puntualidad": 5, "trato": 5, "estadoAuto": 5 }, "comment": "Excelente" }
```
Respuesta:
```json
{ "rating": { ... }, "bothRated": false, "mensaje": "Calificación enviada. Se mostrará cuando la otra parte también califique." }
```

**GET /api/trips/:id/rating**
```json
{ "myRating": { "stars": 5, ... }, "otherRating": null }
```
`otherRating` sólo viene con datos una vez que ambas partes calificaron.

### Notificaciones

**GET /api/notifications** → `{ "notifications": [ { "id": 1, "tipo": "calificacion", "titulo": "...", "detalle": "...", "leido": false, "createdAt": "..." } ] }`

**PATCH /api/notifications/:id/read** → `{ "notification": { ..., "leido": true } }`

## WebSocket (tracking en vivo + alertas de nuevos pedidos)

Conexión con Socket.io, autenticada con el mismo JWT (vía `auth: { token }` o
`?token=` en el handshake). Cada viaje tiene su propia room: `trip:<tripId>`.
Además, cada socket se une automáticamente (sin pedirlo desde el cliente) a
una room personal `user:<userId>`, que se usa para notificaciones dirigidas a
ese usuario sin importar en qué pantalla de la app esté.

Eventos cliente → servidor:
- `join_trip` `{ tripId }` — se une a la room del viaje.
- `leave_trip` `{ tripId }`
- `location_update` `{ tripId, lat, lng }` — el conductor (o el usuario en una alerta) emite su posición; se persiste en `trip_locations` y se reenvía a la room.
- `safety_alert` `{ tripId, mensaje }` — alerta de seguridad, se reenvía a la room.

Eventos servidor → cliente:
- `location_update` `{ tripId, lat, lng, recordedBy, timestamp }`
- `trip_status_changed` `{ tripId, status, timestamp }` — emitido automáticamente cuando cambia el estado del viaje vía REST.
- `safety_alert` `{ tripId, mensaje, from, timestamp }`
- `new_trip_request` `{ tripId, pickup, dropoff, fareTotal, fareBreakdown, distanceKm, riderNombre, timestamp }` — emitido a la room `user:<driverId>` de cada conductor disponible/activo en la misma ciudad apenas se crea un viaje (`POST /api/trips`). Es lo que dispara la notificación flotante del lado del conductor en el frontend.

## Docker

Ver el `docker-compose.yml` en la raíz del proyecto (`YoBorracho/docker-compose.yml`).

```bash
docker compose up --build
docker compose run --rm backend npm run seed   # una sola vez, para cargar datos de ejemplo
```

## Notas de verificación

Este backend fue verificado en un entorno sandbox sin PostgreSQL ni Docker disponibles:
se comprobó que `npm install` instala sin errores, que todos los módulos son sintácticamente
válidos, y que el servidor arranca y responde correctamente (incluyendo manejo de error 503
cuando la base no está disponible, validación con zod, autenticación JWT y rutas 404) sin
caerse. **No se ejecutaron migraciones ni el seed contra una base real**: hacé eso en tu
máquina siguiendo los pasos de arriba o con `docker compose`.
