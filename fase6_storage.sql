-- SCRIPT DE CONFIGURACIÓN DE STORAGE PARA IMÁGENES DE PRODUCTOS
-- Ejecutar en el Editor SQL de Supabase Dashboard

-- 1. Crear bucket para imágenes de productos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'productos',
  'productos',
  true,
  2097152, -- 2MB en bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- 2. Política: Permitir lectura pública de imágenes
CREATE POLICY "Lectura pública de imágenes de productos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'productos');

-- 3. Política: Permitir subida de imágenes para usuarios autenticados
CREATE POLICY "Subida de imágenes para usuarios autenticados"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'productos');

-- 4. Política: Permitir actualizar imágenes para usuarios autenticados
CREATE POLICY "Actualización de imágenes para usuarios autenticados"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'productos')
WITH CHECK (bucket_id = 'productos');

-- 5. Política: Permitir eliminar imágenes para usuarios autenticados
CREATE POLICY "Eliminación de imágenes para usuarios autenticados"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'productos');
