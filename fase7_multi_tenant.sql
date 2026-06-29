-- FASE 7: MULTI-TENANCY - TABLA RESTAURANTES + MIGRACIÓN
-- Ejecutar en el Editor SQL de Supabase Dashboard

-- 1. Crear tabla restaurantes con campo logo_url
CREATE TABLE IF NOT EXISTS restaurantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  direccion TEXT,
  telefono TEXT,
  logo_url TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- 2. Agregar super_admin al CHECK de roles
ALTER TABLE perfiles DROP CONSTRAINT IF EXISTS perfiles_rol_check;
ALTER TABLE perfiles ADD CONSTRAINT perfiles_rol_check
  CHECK (rol IN ('super_admin', 'admin', 'mesero', 'cajero', 'cocina', 'barra'));

-- 3. Agregar restaurante_id a perfiles
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS restaurante_id UUID REFERENCES restaurantes(id);

-- 4. Insertar restaurante por defecto para datos existentes
INSERT INTO restaurantes (id, nombre, slug, direccion, telefono, activo)
VALUES ('00000000-0000-0000-0000-000000000000', 'Mi Restaurante', 'mi-restaurante', '', '', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Asignar restaurante_id = default a todos los perfiles existentes
UPDATE perfiles SET restaurante_id = '00000000-0000-0000-0000-000000000000' WHERE restaurante_id IS NULL;

-- 6. Hacer restaurante_id NOT NULL en perfiles
ALTER TABLE perfiles ALTER COLUMN restaurante_id SET NOT NULL;

-- 7. Crear bucket de storage para logos de restaurantes
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'restaurantes',
  'restaurantes',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- 8. Políticas de storage para logos
CREATE POLICY "Lectura pública de logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'restaurantes');

CREATE POLICY "Subida de logos para super_admin"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'restaurantes');

CREATE POLICY "Actualización de logos para super_admin"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'restaurantes')
WITH CHECK (bucket_id = 'restaurantes');

CREATE POLICY "Eliminación de logos para super_admin"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'restaurantes');
