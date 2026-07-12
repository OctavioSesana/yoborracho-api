-- Contactos de confianza del usuario (rider), a quienes puede compartirles su
-- viaje en tiempo real (link público, sin necesidad de la app) mientras viaja.

CREATE TABLE IF NOT EXISTS trusted_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  parentesco TEXT,
  telefono TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trusted_contacts_rider ON trusted_contacts(rider_id);
