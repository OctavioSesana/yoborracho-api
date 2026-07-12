// Crea los dos usuarios de prueba (sofia@test.com / martin@test.com, password "123")
// más algunos viajes y calificaciones pasadas, para que la app no arranque vacía.
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import { pool } from '../src/db/pool.js'
import { calcularTarifa, calcularDesglose } from '../src/utils/fare.js'

dotenv.config()

const SALT_ROUNDS = 10

async function upsertUser({ email, password, nombre, telefono, role, zona, calificacion, viajesTotales }) {
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
  const { rows } = await pool.query(
    `INSERT INTO users (email, password_hash, nombre, telefono, role, zona, calificacion_avg, viajes_totales)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT (email) DO UPDATE SET
       password_hash = EXCLUDED.password_hash,
       nombre = EXCLUDED.nombre,
       telefono = EXCLUDED.telefono,
       zona = EXCLUDED.zona
     RETURNING *`,
    [email, passwordHash, nombre, telefono, role, zona, calificacion, viajesTotales]
  )
  return rows[0]
}

async function run() {
  console.log('[seed] Insertando usuarios de prueba...')

  const sofia = await upsertUser({
    email: 'sofia@test.com',
    password: '123',
    nombre: 'Sofía Martínez',
    telefono: '341-555-0198',
    role: 'usuario',
    zona: 'Centro, Rosario',
    calificacion: 4.8,
    viajesTotales: 23,
  })

  const martin = await upsertUser({
    email: 'martin@test.com',
    password: '123',
    nombre: 'Martín Gómez',
    telefono: '341-555-0244',
    role: 'conductor',
    zona: 'Pichincha, Rosario',
    calificacion: 4.9,
    viajesTotales: 187,
  })

  const laura = await upsertUser({
    email: 'laura.fernandez@test.com',
    password: '123',
    nombre: 'Laura Fernández',
    telefono: '341-555-0301',
    role: 'conductor',
    zona: 'Fisherton, Rosario',
    calificacion: 4.7,
    viajesTotales: 96,
  })

  console.log('[seed] Insertando perfil de conductor verificado para Martín...')
  await pool.query(
    `INSERT INTO driver_profiles (
        user_id, verification_status, etapa_actual, dni_numero, licencia_numero,
        licencia_vencimiento, antecedentes_ok, capacitacion_completada, viaje_prueba_aprobado,
        zona_operacion, disponible, vehiculo_habilitado, rating_avg
      ) VALUES ($1,'activo',4,'30123456','LC-991234','2027-06-01',true,true,true,$2,true,true,$3)
      ON CONFLICT (user_id) DO UPDATE SET
        verification_status = EXCLUDED.verification_status,
        etapa_actual = EXCLUDED.etapa_actual,
        disponible = EXCLUDED.disponible,
        vehiculo_habilitado = EXCLUDED.vehiculo_habilitado`,
    [martin.id, 'Pichincha, Rosario', 4.9]
  )

  await pool.query(
    `INSERT INTO driver_profiles (
        user_id, verification_status, etapa_actual, dni_numero, licencia_numero,
        licencia_vencimiento, antecedentes_ok, capacitacion_completada, viaje_prueba_aprobado,
        zona_operacion, disponible, vehiculo_habilitado, rating_avg
      ) VALUES ($1,'activo',4,'31456789','LC-882211','2026-11-15',true,true,true,$2,true,true,$3)
      ON CONFLICT (user_id) DO UPDATE SET
        verification_status = EXCLUDED.verification_status`,
    [laura.id, 'Fisherton, Rosario', 4.7]
  )

  console.log('[seed] Insertando vehículo de Sofía...')
  const { rows: existingVehicle } = await pool.query('SELECT id FROM vehicles WHERE rider_id = $1', [sofia.id])
  let vehicleId = existingVehicle[0]?.id
  if (!vehicleId) {
    const { rows: v } = await pool.query(
      `INSERT INTO vehicles (rider_id, marca, modelo, anio, patente, color, transmision)
       VALUES ($1,'Volkswagen','Gol Trend',2019,'AF204XY','Gris','manual') RETURNING id`,
      [sofia.id]
    )
    vehicleId = v[0].id
  }

  console.log('[seed] Insertando viajes pasados...')

  async function crearViajeCompletado({ driverId, distanciaKm, fecha, origen, destino, calificarAmbos }) {
    const total = calcularTarifa(distanciaKm)
    const breakdown = calcularDesglose(total)
    const { rows } = await pool.query(
      `INSERT INTO trips (
          rider_id, driver_id, vehicle_id, pickup_address, dropoff_address, distance_km,
          status, fare_total, fare_breakdown,
          requested_at, matched_at, accepted_at, traslado_al_punto_at, verificacion_at,
          en_viaje_at, llegada_at, regreso_conductor_at, completado_at
        ) VALUES (
          $1,$2,$3,$4,$5,$6,'completado',$7,$8,
          $9,$9,$9,$9,$9,$9,$9,$9,$9
        ) RETURNING id`,
      [sofia.id, driverId, vehicleId, origen, destino, distanciaKm, total, breakdown, fecha]
    )
    const tripId = rows[0].id

    if (calificarAmbos) {
      await pool.query(
        `INSERT INTO ratings (trip_id, rater_id, rated_id, stars, criteria, is_visible)
         VALUES
           ($1,$2,$3,5,'{"manejoDefensivo":5,"puntualidad":5,"trato":5,"estadoAuto":5}'::jsonb, true),
           ($1,$3,$2,5,'{"comportamiento":5,"estadoInterior":5,"disponibilidad":5,"infoCorrecta":5}'::jsonb, true)
         ON CONFLICT DO NOTHING`,
        [tripId, sofia.id, driverId]
      )
    }
    return tripId
  }

  await crearViajeCompletado({
    driverId: martin.id,
    distanciaKm: 6.5,
    fecha: '2026-07-05 02:14:00-03',
    origen: 'Bv. Oroño 1450',
    destino: 'Av. Pellegrini 3200',
    calificarAmbos: true,
  })

  await crearViajeCompletado({
    driverId: laura.id,
    distanciaKm: 11,
    fecha: '2026-06-28 01:40:00-03',
    origen: 'Zona Rosario Centro',
    destino: 'Fisherton',
    calificarAmbos: true,
  })

  await crearViajeCompletado({
    driverId: martin.id,
    distanciaKm: 4.2,
    fecha: '2026-06-20 23:55:00-03',
    origen: 'Peatonal Córdoba',
    destino: 'Barrio Echesortu',
    calificarAmbos: false,
  })

  console.log('[seed] Insertando un viaje cancelado...')
  await pool.query(
    `INSERT INTO trips (rider_id, pickup_address, dropoff_address, status, fare_total, fare_breakdown, cancel_reason, cancelado_at)
     VALUES ($1,'Puerto Norte','Barrio Martin','cancelado',0,'{}'::jsonb,'El usuario canceló antes de la asignación.', now())`,
    [sofia.id]
  )

  console.log('[seed] Insertando notificaciones de ejemplo...')
  await pool.query(
    `INSERT INTO notifications (user_id, tipo, titulo, detalle, leido) VALUES
       ($1,'calificacion','Calificá tu último viaje','Contanos cómo fue tu experiencia con Martín anoche.', false),
       ($1,'viaje','Conductor en camino','Martín llega en 6 minutos.', true),
       ($1,'promo','20% OFF en tu próximo viaje','Válido los fines de semana hasta fin de mes.', true),
       ($1,'sistema','Actualizamos nuestros Términos','Revisá los cambios en la sección legal.', true),
       ($2,'pedido','Nuevo pedido disponible','Hay una solicitud cerca de tu zona.', false),
       ($2,'pago','Pago acreditado','Recibiste $5.200 por tu último viaje.', true),
       ($2,'calificacion','Calificá a Sofía','Contanos cómo fue el viaje de anoche.', false),
       ($2,'sistema','Recordatorio de capacitación','Repasá el protocolo de emergencias.', true)`,
    [sofia.id, martin.id]
  )

  console.log('[seed] Listo. Usuarios de prueba:')
  console.log('  - sofia@test.com  / 123  (usuario)')
  console.log('  - martin@test.com / 123  (conductor)')
}

run()
  .then(() => pool.end())
  .catch((err) => {
    console.error('[seed] Falló el seed:', err)
    pool.end().finally(() => process.exit(1))
  })
