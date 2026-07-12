-- YoBorracho — esquema inicial
-- Convenciones: nombres de columna en español para alinear con el dominio del negocio.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================================================
-- USERS
-- =========================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  nombre TEXT NOT NULL,
  telefono TEXT,
  role TEXT NOT NULL CHECK (role IN ('usuario', 'conductor')),
  zona TEXT,
  calificacion_avg NUMERIC(2,1) NOT NULL DEFAULT 0,
  viajes_totales INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- =========================================================
-- DRIVER_PROFILES — datos de verificación / onboarding del conductor
-- =========================================================
CREATE TABLE IF NOT EXISTS driver_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  verification_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'en_capacitacion', 'activo', 'suspendido')),
  etapa_actual INTEGER NOT NULL DEFAULT 1, -- 1..4, ver DRIVER_ONBOARDING del frontend
  dni_numero TEXT,
  dni_frente_url TEXT,
  dni_dorso_url TEXT,
  selfie_url TEXT,
  licencia_numero TEXT,
  licencia_vencimiento DATE,
  antecedentes_ok BOOLEAN NOT NULL DEFAULT false,
  capacitacion_completada BOOLEAN NOT NULL DEFAULT false,
  viaje_prueba_aprobado BOOLEAN NOT NULL DEFAULT false,
  zona_operacion TEXT,
  disponible BOOLEAN NOT NULL DEFAULT false,
  vehiculo_habilitado BOOLEAN NOT NULL DEFAULT false, -- puede trasladarse (uber/remis/propio) hasta el punto
  rating_avg NUMERIC(2,1) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================================================
-- VEHICLES — autos de los riders (los que el conductor termina manejando)
-- =========================================================
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  marca TEXT NOT NULL,
  modelo TEXT NOT NULL,
  anio INTEGER,
  patente TEXT NOT NULL,
  color TEXT,
  transmision TEXT CHECK (transmision IN ('manual', 'automatica')) DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vehicles_rider ON vehicles(rider_id);

-- =========================================================
-- TRIPS
-- =========================================================
CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id UUID NOT NULL REFERENCES users(id),
  driver_id UUID REFERENCES users(id),
  vehicle_id UUID REFERENCES vehicles(id),

  pickup_address TEXT NOT NULL,
  pickup_lat DOUBLE PRECISION,
  pickup_lng DOUBLE PRECISION,
  dropoff_address TEXT NOT NULL,
  dropoff_lat DOUBLE PRECISION,
  dropoff_lng DOUBLE PRECISION,
  distance_km NUMERIC(6,2),

  status TEXT NOT NULL DEFAULT 'solicitud' CHECK (status IN (
    'solicitud',
    'matching',
    'aceptado',
    'traslado_al_punto',
    'verificacion',
    'en_viaje',
    'llegada',
    'regreso_conductor',
    'completado',
    'cancelado'
  )),

  fare_total NUMERIC(10,2) NOT NULL DEFAULT 0,
  fare_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb, -- {conductor, plataforma, fondoSeguro, fondoDanos}

  cancel_reason TEXT,

  -- timestamps por etapa del flujo de 9 pasos
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  matched_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  traslado_al_punto_at TIMESTAMPTZ,
  verificacion_at TIMESTAMPTZ,
  en_viaje_at TIMESTAMPTZ,
  llegada_at TIMESTAMPTZ,
  regreso_conductor_at TIMESTAMPTZ,
  completado_at TIMESTAMPTZ,
  cancelado_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trips_rider ON trips(rider_id);
CREATE INDEX IF NOT EXISTS idx_trips_driver ON trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);

-- =========================================================
-- RATINGS — doble ciego diferido: visible recién cuando ambas partes calificaron
-- =========================================================
CREATE TABLE IF NOT EXISTS ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  rater_id UUID NOT NULL REFERENCES users(id),
  rated_id UUID NOT NULL REFERENCES users(id),
  stars SMALLINT NOT NULL CHECK (stars BETWEEN 1 AND 5),
  criteria JSONB NOT NULL DEFAULT '{}'::jsonb, -- claves como manejoDefensivo, puntualidad, etc.
  comment TEXT,
  is_visible BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (trip_id, rater_id)
);

CREATE INDEX IF NOT EXISTS idx_ratings_trip ON ratings(trip_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rated ON ratings(rated_id);

-- =========================================================
-- NOTIFICATIONS
-- =========================================================
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL, -- 'calificacion' | 'viaje' | 'promo' | 'sistema' | 'pedido' | 'pago'
  titulo TEXT NOT NULL,
  detalle TEXT,
  leido BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, leido);

-- =========================================================
-- TRIP_LOCATIONS — traza de GPS por viaje (polling / replay de WebSocket)
-- =========================================================
CREATE TABLE IF NOT EXISTS trip_locations (
  id BIGSERIAL PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  recorded_by TEXT NOT NULL CHECK (recorded_by IN ('conductor', 'usuario')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trip_locations_trip ON trip_locations(trip_id, created_at);
