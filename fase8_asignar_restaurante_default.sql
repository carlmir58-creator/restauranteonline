-- FASE 8: ASIGNAR DATOS EXISTENTES AL PRIMER RESTAURANTE + ADMIN
-- Ejecutar DESPUÉS de fase7_multi_tenant.sql
-- 1. Agregar restaurante_id a todas las tablas de datos
ALTER TABLE categorias ADD COLUMN IF NOT EXISTS restaurante_id UUID REFERENCES restaurantes(id);
ALTER TABLE productos ADD COLUMN IF NOT EXISTS restaurante_id UUID REFERENCES restaurantes(id);
ALTER TABLE mesas ADD COLUMN IF NOT EXISTS restaurante_id UUID REFERENCES restaurantes(id);
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS restaurante_id UUID REFERENCES restaurantes(id);
ALTER TABLE pedido_detalles ADD COLUMN IF NOT EXISTS restaurante_id UUID REFERENCES restaurantes(id);
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS restaurante_id UUID REFERENCES restaurantes(id);
ALTER TABLE movimientos_caja ADD COLUMN IF NOT EXISTS restaurante_id UUID REFERENCES restaurantes(id);
ALTER TABLE configuraciones ADD COLUMN IF NOT EXISTS restaurante_id UUID REFERENCES restaurantes(id);

-- 2. Asignar todos los datos existentes al restaurante por defecto
UPDATE categorias SET restaurante_id = '00000000-0000-0000-0000-000000000000' WHERE restaurante_id IS NULL;
UPDATE productos SET restaurante_id = '00000000-0000-0000-0000-000000000000' WHERE restaurante_id IS NULL;
UPDATE mesas SET restaurante_id = '00000000-0000-0000-0000-000000000000' WHERE restaurante_id IS NULL;
UPDATE pedidos SET restaurante_id = '00000000-0000-0000-0000-000000000000' WHERE restaurante_id IS NULL;
UPDATE pedido_detalles SET restaurante_id = '00000000-0000-0000-0000-000000000000' WHERE restaurante_id IS NULL;
UPDATE pagos SET restaurante_id = '00000000-0000-0000-0000-000000000000' WHERE restaurante_id IS NULL;
UPDATE movimientos_caja SET restaurante_id = '00000000-0000-0000-0000-000000000000' WHERE restaurante_id IS NULL;
UPDATE configuraciones SET restaurante_id = '00000000-0000-0000-0000-000000000000' WHERE restaurante_id IS NULL;

-- 3. Hacer restaurante_id NOT NULL en todas las tablas
ALTER TABLE categorias ALTER COLUMN restaurante_id SET NOT NULL;
ALTER TABLE productos ALTER COLUMN restaurante_id SET NOT NULL;
ALTER TABLE mesas ALTER COLUMN restaurante_id SET NOT NULL;
ALTER TABLE pedidos ALTER COLUMN restaurante_id SET NOT NULL;
ALTER TABLE pedido_detalles ALTER COLUMN restaurante_id SET NOT NULL;
ALTER TABLE pagos ALTER COLUMN restaurante_id SET NOT NULL;
ALTER TABLE movimientos_caja ALTER COLUMN restaurante_id SET NOT NULL;
ALTER TABLE configuraciones ALTER COLUMN restaurante_id SET NOT NULL;

-- 4. Hacer que configuraciones tenga PK compuesto (key + restaurante_id)
-- Primero eliminar la PK existente (si es solo key)
ALTER TABLE configuraciones DROP CONSTRAINT IF EXISTS configuraciones_pkey;
-- Agregar nueva PK compuesta
ALTER TABLE configuraciones ADD PRIMARY KEY (key, restaurante_id);

-- 5. Actualizar el trigger para nuevos usuarios (asignar restaurante_id)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  default_rest_id UUID := '00000000-0000-0000-0000-000000000000';
BEGIN
  INSERT INTO public.perfiles (id, nombre, rol, activo, restaurante_id)
  VALUES (new.id, split_part(new.email, '@', 1), 'mesero', true, default_rest_id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Actualizar perfil de jorgelozano@gmail.com a admin del restaurante default
UPDATE perfiles
SET rol = 'admin', activo = true, restaurante_id = '00000000-0000-0000-0000-000000000000'
WHERE id IN (SELECT id FROM auth.users WHERE email = 'jorgelozano@gmail.com');

-- 7. Eliminar todos los perfiles que NO sean super_admin ni jorgelozano@gmail.com
DELETE FROM perfiles
WHERE id NOT IN (
  SELECT id FROM auth.users WHERE email IN (
    SELECT email FROM auth.users WHERE id IN (
      SELECT id FROM perfiles WHERE rol = 'super_admin'
    )
  )
  OR email = 'jorgelozano@gmail.com'
);
-- Nota: Si aún no hay un super_admin, esta línea no eliminará nada.
-- Primero asegúrate de tener un usuario con rol super_admin antes de ejecutar.

-- 8. Actualizar RLS - Políticas multi-tenant para todas las tablas
-- Drop policies existentes (de fase2_rls_y_ajustes.sql)
DROP POLICY IF EXISTS "Permitir lectura de categorias a todos" ON categorias;
DROP POLICY IF EXISTS "Permitir lectura de productos a todos" ON productos;
DROP POLICY IF EXISTS "Permitir lectura de mesas a todos" ON mesas;
DROP POLICY IF EXISTS "Permitir actualización de mesas a todos" ON mesas;
DROP POLICY IF EXISTS "Permitir lectura de perfiles a todos" ON perfiles;
DROP POLICY IF EXISTS "Permitir todo en pedidos a todos" ON pedidos;
DROP POLICY IF EXISTS "Permitir todo en pedido_detalles a todos" ON pedido_detalles;
DROP POLICY IF EXISTS "Permitir todo en pagos a todos" ON pagos;
DROP POLICY IF EXISTS "Permitir todo en movimientos_caja a todos" ON movimientos_caja;
DROP POLICY IF EXISTS "Permitir lectura de configuraciones a todos" ON configuraciones;
DROP POLICY IF EXISTS "Permitir actualización de configuraciones a admins" ON configuraciones;

-- Nuevas políticas multi-tenant
-- Cada usuario ve solo los datos de su restaurante

-- CATEGORIAS
CREATE POLICY "usuarios ven categorias de su restaurante" ON categorias FOR SELECT
  USING (restaurante_id = (SELECT restaurante_id FROM perfiles WHERE id = auth.uid()));
CREATE POLICY "super_admin ve todas las categorias" ON categorias FOR SELECT
  USING ((SELECT rol FROM perfiles WHERE id = auth.uid()) = 'super_admin');
CREATE POLICY "admin puede modificar categorias" ON categorias FOR INSERT
  WITH CHECK (
    restaurante_id = (SELECT restaurante_id FROM perfiles WHERE id = auth.uid())
    AND (SELECT rol FROM perfiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
  );
CREATE POLICY "admin puede actualizar categorias" ON categorias FOR UPDATE
  USING (
    restaurante_id = (SELECT restaurante_id FROM perfiles WHERE id = auth.uid())
    AND (SELECT rol FROM perfiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
  );
CREATE POLICY "admin puede eliminar categorias" ON categorias FOR DELETE
  USING (
    restaurante_id = (SELECT restaurante_id FROM perfiles WHERE id = auth.uid())
    AND (SELECT rol FROM perfiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
  );

-- PRODUCTOS
CREATE POLICY "usuarios ven productos de su restaurante" ON productos FOR SELECT
  USING (restaurante_id = (SELECT restaurante_id FROM perfiles WHERE id = auth.uid()));
CREATE POLICY "super_admin ve todos los productos" ON productos FOR SELECT
  USING ((SELECT rol FROM perfiles WHERE id = auth.uid()) = 'super_admin');
CREATE POLICY "admin puede modificar productos" ON productos FOR INSERT
  WITH CHECK (
    restaurante_id = (SELECT restaurante_id FROM perfiles WHERE id = auth.uid())
    AND (SELECT rol FROM perfiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
  );
CREATE POLICY "admin puede actualizar productos" ON productos FOR UPDATE
  USING (
    restaurante_id = (SELECT restaurante_id FROM perfiles WHERE id = auth.uid())
    AND (SELECT rol FROM perfiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
  );
CREATE POLICY "admin puede eliminar productos" ON productos FOR DELETE
  USING (
    restaurante_id = (SELECT restaurante_id FROM perfiles WHERE id = auth.uid())
    AND (SELECT rol FROM perfiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
  );

-- MESAS
CREATE POLICY "usuarios ven mesas de su restaurante" ON mesas FOR SELECT
  USING (restaurante_id = (SELECT restaurante_id FROM perfiles WHERE id = auth.uid()));
CREATE POLICY "super_admin ve todas las mesas" ON mesas FOR SELECT
  USING ((SELECT rol FROM perfiles WHERE id = auth.uid()) = 'super_admin');
CREATE POLICY "staff puede actualizar mesas" ON mesas FOR UPDATE
  USING (restaurante_id = (SELECT restaurante_id FROM perfiles WHERE id = auth.uid()));
CREATE POLICY "admin puede modificar mesas" ON mesas FOR INSERT
  WITH CHECK (
    restaurante_id = (SELECT restaurante_id FROM perfiles WHERE id = auth.uid())
    AND (SELECT rol FROM perfiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
  );
CREATE POLICY "admin puede eliminar mesas" ON mesas FOR DELETE
  USING (
    restaurante_id = (SELECT restaurante_id FROM perfiles WHERE id = auth.uid())
    AND (SELECT rol FROM perfiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
  );

-- PEDIDOS
CREATE POLICY "usuarios ven pedidos de su restaurante" ON pedidos FOR SELECT
  USING (restaurante_id = (SELECT restaurante_id FROM perfiles WHERE id = auth.uid()));
CREATE POLICY "super_admin ve todos los pedidos" ON pedidos FOR SELECT
  USING ((SELECT rol FROM perfiles WHERE id = auth.uid()) = 'super_admin');
CREATE POLICY "staff puede crear pedidos" ON pedidos FOR INSERT
  WITH CHECK (restaurante_id = (SELECT restaurante_id FROM perfiles WHERE id = auth.uid()));
CREATE POLICY "staff puede actualizar pedidos" ON pedidos FOR UPDATE
  USING (restaurante_id = (SELECT restaurante_id FROM perfiles WHERE id = auth.uid()));

-- PEDIDO_DETALLES
CREATE POLICY "usuarios ven detalles de su restaurante" ON pedido_detalles FOR SELECT
  USING (restaurante_id = (SELECT restaurante_id FROM perfiles WHERE id = auth.uid()));
CREATE POLICY "super_admin ve todos los detalles" ON pedido_detalles FOR SELECT
  USING ((SELECT rol FROM perfiles WHERE id = auth.uid()) = 'super_admin');
CREATE POLICY "staff puede crear detalles" ON pedido_detalles FOR INSERT
  WITH CHECK (restaurante_id = (SELECT restaurante_id FROM perfiles WHERE id = auth.uid()));
CREATE POLICY "staff puede actualizar detalles" ON pedido_detalles FOR UPDATE
  USING (restaurante_id = (SELECT restaurante_id FROM perfiles WHERE id = auth.uid()));
CREATE POLICY "staff puede eliminar detalles" ON pedido_detalles FOR DELETE
  USING (restaurante_id = (SELECT restaurante_id FROM perfiles WHERE id = auth.uid()));

-- PAGOS
CREATE POLICY "usuarios ven pagos de su restaurante" ON pagos FOR SELECT
  USING (restaurante_id = (SELECT restaurante_id FROM perfiles WHERE id = auth.uid()));
CREATE POLICY "super_admin ve todos los pagos" ON pagos FOR SELECT
  USING ((SELECT rol FROM perfiles WHERE id = auth.uid()) = 'super_admin');
CREATE POLICY "staff puede crear pagos" ON pagos FOR INSERT
  WITH CHECK (restaurante_id = (SELECT restaurante_id FROM perfiles WHERE id = auth.uid()));

-- MOVIMIENTOS_CAJA
CREATE POLICY "usuarios ven movimientos de su restaurante" ON movimientos_caja FOR SELECT
  USING (restaurante_id = (SELECT restaurante_id FROM perfiles WHERE id = auth.uid()));
CREATE POLICY "super_admin ve todos los movimientos" ON movimientos_caja FOR SELECT
  USING ((SELECT rol FROM perfiles WHERE id = auth.uid()) = 'super_admin');
CREATE POLICY "staff puede crear movimientos" ON movimientos_caja FOR INSERT
  WITH CHECK (restaurante_id = (SELECT restaurante_id FROM perfiles WHERE id = auth.uid()));

-- PERFILES
CREATE POLICY "usuarios ven perfiles de su restaurante" ON perfiles FOR SELECT
  USING (restaurante_id = (SELECT restaurante_id FROM perfiles WHERE id = auth.uid()) OR id = auth.uid());
CREATE POLICY "super_admin ve todos los perfiles" ON perfiles FOR SELECT
  USING ((SELECT rol FROM perfiles WHERE id = auth.uid()) = 'super_admin');
CREATE POLICY "admin puede gestionar perfiles" ON perfiles FOR INSERT
  WITH CHECK (
    restaurante_id = (SELECT restaurante_id FROM perfiles WHERE id = auth.uid())
    AND (SELECT rol FROM perfiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
  );
CREATE POLICY "admin puede actualizar perfiles" ON perfiles FOR UPDATE
  USING (
    restaurante_id = (SELECT restaurante_id FROM perfiles WHERE id = auth.uid())
    AND (SELECT rol FROM perfiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
  );

-- CONFIGURACIONES
CREATE POLICY "usuarios ven config de su restaurante" ON configuraciones FOR SELECT
  USING (restaurante_id = (SELECT restaurante_id FROM perfiles WHERE id = auth.uid()));
CREATE POLICY "super_admin ve todas las configs" ON configuraciones FOR SELECT
  USING ((SELECT rol FROM perfiles WHERE id = auth.uid()) = 'super_admin');
CREATE POLICY "admin puede modificar config" ON configuraciones FOR INSERT
  WITH CHECK (
    restaurante_id = (SELECT restaurante_id FROM perfiles WHERE id = auth.uid())
    AND (SELECT rol FROM perfiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
  );
CREATE POLICY "admin puede actualizar config" ON configuraciones FOR UPDATE
  USING (
    restaurante_id = (SELECT restaurante_id FROM perfiles WHERE id = auth.uid())
    AND (SELECT rol FROM perfiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
  );

-- 9. Políticas para la tabla restaurantes (solo super_admin)
DROP POLICY IF EXISTS "super_admin gestiona restaurantes" ON restaurantes;
CREATE POLICY "super_admin ve restaurantes" ON restaurantes FOR SELECT
  USING ((SELECT rol FROM perfiles WHERE id = auth.uid()) = 'super_admin');
CREATE POLICY "super_admin crea restaurantes" ON restaurantes FOR INSERT
  WITH CHECK ((SELECT rol FROM perfiles WHERE id = auth.uid()) = 'super_admin');
CREATE POLICY "super_admin actualiza restaurantes" ON restaurantes FOR UPDATE
  USING ((SELECT rol FROM perfiles WHERE id = auth.uid()) = 'super_admin');
CREATE POLICY "super_admin elimina restaurantes" ON restaurantes FOR DELETE
  USING ((SELECT rol FROM perfiles WHERE id = auth.uid()) = 'super_admin');

-- 10. Actualizar políticas de storage para productos (multi-tenant)
-- NOTA: Esto asume que ya existe la política "Lectura pública de imágenes de productos"
DROP POLICY IF EXISTS "Lectura pública de imágenes de productos" ON storage.objects;
DROP POLICY IF EXISTS "Subida de imágenes para usuarios autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Actualización de imágenes para usuarios autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Eliminación de imágenes para usuarios autenticados" ON storage.objects;

-- Recrear con scoping por restaurante
CREATE POLICY "Lectura pública de imágenes de productos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'productos');

CREATE POLICY "Subida de imágenes para admins del restaurante"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'productos'
  AND (SELECT rol FROM perfiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
);

CREATE POLICY "Actualización de imágenes para admins del restaurante"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'productos')
WITH CHECK (
  bucket_id = 'productos'
  AND (SELECT rol FROM perfiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
);

CREATE POLICY "Eliminación de imágenes para admins del restaurante"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'productos'
  AND (SELECT rol FROM perfiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
);

-- 11. Agregar RLS a la tabla restaurantes
ALTER TABLE restaurantes ENABLE ROW LEVEL SECURITY;
