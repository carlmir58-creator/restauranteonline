-- FASE 9: DIAGNÓSTICO Y CORRECCIÓN - PERFIL NO ENCONTRADO
-- 1. DIAGNÓSTICO - Verificar si carlmir58 tiene perfil
SELECT '1. Usuario en auth.users:' AS diagnose;
SELECT id, email, created_at FROM auth.users WHERE email = 'carlmir58@gmail.com';

SELECT '2. Perfil en perfiles:' AS diagnose;
SELECT * FROM perfiles WHERE id IN (SELECT id FROM auth.users WHERE email = 'carlmir58@gmail.com');

SELECT '3. Políticas RLS actuales en perfiles:' AS diagnose;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies WHERE tablename = 'perfiles';

-- 4. CORRECCIÓN - Si no existe el perfil, crearlo
INSERT INTO perfiles (id, nombre, rol, activo, restaurante_id)
SELECT id, 'Carlos Miranda', 'super_admin', true, '00000000-0000-0000-0000-000000000000'
FROM auth.users WHERE email = 'carlmir58@gmail.com'
AND NOT EXISTS (SELECT 1 FROM perfiles WHERE id IN (SELECT id FROM auth.users WHERE email = 'carlmir58@gmail.com'));

-- 5. Asegurar que la política permite lectura del propio perfil
-- (Reemplazar policy problemática si existe)
DROP POLICY IF EXISTS "usuarios ven perfiles de su restaurante" ON perfiles;

-- Policy simple: cada usuario ve su propio perfil + los de su restaurante
CREATE POLICY "usuarios ven perfiles de su restaurante" ON perfiles FOR SELECT
  USING (
    id = auth.uid()  -- Siempre puede verse a sí mismo
    OR
    restaurante_id = (SELECT restaurante_id FROM perfiles WHERE id = auth.uid())  -- Los de su restaurante
  );

SELECT '4. Corrección aplicada. Verificar perfil:' AS diagnose;
SELECT * FROM perfiles WHERE id IN (SELECT id FROM auth.users WHERE email = 'carlmir58@gmail.com');
