-- Direcciones frecuentes del usuario (rider), con una etiqueta para distinguirlas
-- (ej. "Casa", "Trabajo de mi hermana"). Se usan como accesos directos al pedir un viaje.

CREATE TABLE IF NOT EXISTS saved_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  etiqueta TEXT NOT NULL,
  direccion TEXT NOT NULL,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_saved_addresses_rider ON saved_addresses(rider_id);
