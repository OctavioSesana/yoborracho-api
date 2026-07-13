# Deploy en Render

Guía para desplegar el stack completo (Postgres + backend + frontend) en [Render](https://render.com/), pensada para tener una demo en vivo del proyecto.

## Antes de empezar

- El código tiene que estar en un repo de GitHub (Render se conecta a GitHub, no sirve subir un zip). Ver los pasos de git más abajo si todavía no lo subiste.
- Necesitás tu propia API key de Google Maps (Maps JavaScript API + Geocoding API + Directions API habilitadas en Google Cloud Console).
- Una cuenta en Render (podés crearla con tu cuenta de GitHub, sin tarjeta).

### Aviso importante sobre el plan gratuito

Con el plan Free de Render:

- **Postgres gratis se borra a los 30 días** de creado (14 días de gracia después para pasarlo a un plan pago antes de que se elimine con todos los datos). Para una demo que quieras mantener viva más de un mes, vas a tener que pasar la base a un plan pago (~$7/mes el más chico) antes de que se cumplan los 30 días, o recrearla y correr el seed de nuevo.
- **El backend (Web Service gratis) se "duerme" a los 15 minutos sin tráfico** y tarda ~1 minuto en despertar con la primera request. Es normal que la primera carga de la demo tarde — no es que esté roto.
- El **frontend (Static Site) no tiene este problema**: es gratis, no duerme y no expira.

*(Fuentes: [Render Docs — Free tier](https://render.com/docs/free), [changelog de Postgres free](https://render.com/changelog/free-postgresql-instances-now-expire-after-30-days-previously-90).)*

## Paso 0: subir el código a GitHub

```bash
cd "ruta al proyecto"
cp .env.example .env      # completá JWT_SECRET con uno generado (ver el archivo)
git init
git add -A
git status                 # confirmá que NO aparezcan .env, "APIS keys.txt" ni node_modules
git commit -m "YoBorracho: frontend + backend"
```

Creá un repo vacío en GitHub (sin README, sin .gitignore — ya los tenés) y conectalo:

```bash
git remote add origin https://github.com/<tu-usuario>/yoborracho.git
git branch -M main
git push -u origin main
```

## Paso 1: Postgres

1. En el dashboard de Render: **New +** → **PostgreSQL**.
2. Nombre `yoborracho-db`, plan **Free**, región la que te quede más cerca.
3. Una vez creada, copiá la **Internal Database URL** (no la External) — vas a usarla en el backend si el backend también corre en Render, es más rápida y no cuenta contra tu ancho de banda.

## Paso 2: Backend (Web Service)

1. **New +** → **Web Service** → conectá el repo de GitHub.
2. **Root Directory:** `backend`
3. Render va a detectar el `Dockerfile` de esa carpeta solo y va a mostrar **Runtime: Docker** — dejalo así. Cuando el runtime es Docker, los campos "Build Command" y "Start Command" de la UI **no se usan** (Render corre el `CMD` del Dockerfile directo), así que no hace falta tocarlos — el `CMD` ya corre `npm run migrate && npm start` en ese orden.
4. **Plan:** Free
5. Variables de entorno (**Environment** → Add Environment Variable):

| Variable | Valor |
|---|---|
| `DATABASE_URL` | la Internal Database URL del Paso 1 |
| `DATABASE_SSL` | `false` si usaste la Internal Database URL (la red interna de Render no exige SSL); `true` si en cambio usaste la External |
| `JWT_SECRET` | generá uno nuevo — `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` — **no reutilices el de tu `.env` local** |
| `JWT_EXPIRES_IN` | `7d` |
| `NODE_ENV` | `production` |
| `CORS_ORIGIN` | dejalo vacío por ahora, lo completás en el Paso 4 |
| `REGRESO_RECORDATORIO_MS` | `180000` (o el valor que prefieras) |

Si en algún momento cambiás el backend para que Render lo buildee sin Docker (por ejemplo, borrando el Dockerfile), ahí sí volvés a necesitar completar Build Command (`npm install`) y Start Command (`npm run migrate && npm start`) en la UI.

8. Deploy. Cuando termine, copiá la URL que te asigna Render (algo como `https://yoborracho-backend.onrender.com`).
9. Corré el seed una sola vez: en la pestaña **Shell** del servicio, ejecutá `npm run seed`.

## Paso 3: Frontend (Static Site)

1. **New +** → **Static Site** → mismo repo.
2. **Root Directory:** `yoborracho`
3. **Build Command:** `npm install && npm run build`
4. **Publish Directory:** `dist`
5. Variables de entorno:

| Variable | Valor |
|---|---|
| `VITE_API_BASE_URL` | la URL del backend del Paso 2 |
| `VITE_WS_URL` | la misma URL del backend |
| `VITE_GOOGLE_MAPS_API_KEY` | tu API key de Google Maps |

6. **Redirects/Rewrites** (pestaña del Static Site): agregá una regla `/*` → `/index.html`, tipo **Rewrite**. Es necesario porque la app usa rutas del lado del cliente (React Router) — sin esto, refrescar la página en cualquier ruta que no sea `/` te tira un 404 de Render.
7. Deploy. Copiá la URL que te asigna (`https://yoborracho.onrender.com` o similar).

## Paso 4: cerrar el círculo — CORS

Volvé al Web Service del backend → **Environment** → editá `CORS_ORIGIN` con la URL exacta del frontend del Paso 3 (sin barra final), por ejemplo:

```
CORS_ORIGIN=https://yoborracho.onrender.com
```

Guardá — Render redeploya el backend solo con la variable nueva.

## Paso 5: restringir la API key de Google Maps

En Google Cloud Console → Credenciales → tu API key → **Restricciones de la aplicación** → agregá el dominio del Static Site (`yoborracho.onrender.com/*`) a la lista de referrers permitidos, además de `localhost` si todavía la usás en desarrollo.

## Verificación

1. Abrí la URL del frontend en dos sesiones (una normal, una incógnito).
2. Entrá como `sofia@test.com` en una y `martin@test.com` en la otra (contraseña `123` en ambas).
3. Pedí un viaje desde la sesión de usuario — el conductor debería ver el banner flotante de nuevo pedido (puede tardar ~1 min la primera vez si el backend estaba dormido).
4. Aceptalo y avanzá el viaje desde la sesión de conductor, confirmá que el tracking en vivo y el link público de `/track/:tripId` funcionen.

## Actualizar el deploy

Cada `git push` a `main` dispara un redeploy automático tanto del backend como del frontend (Render los conecta al repo por default). No hace falta hacer nada manual salvo que cambies variables de entorno.
