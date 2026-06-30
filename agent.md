# Orderly Eats (RestoPOS) - Contexto del Proyecto

## Stack

- Frontend: React 18 + TypeScript + Vite, Tailwind CSS + Shadcn UI, Zustand, React Router Dom, Recharts
- Backend: Supabase (PostgreSQL, Auth, Realtime, Storage)
- Package Manager: npm
- Testing: Vitest

## Supabase

## Repositorio GitHub

- URL: https://github.com/carlmir58-creator/restauranteonline
- Branch: main
- Deploy: Vercel (restauranteonline-iota.vercel.app)

## Sesión: 28 Jun 2026

### Problema: Login roto tras ejecutar fase9

- Usuario ejecutó fase9_fix_login_perfil.sql que reemplazó la política RLS con una subconsulta recursiva
- Política problemática: `usuarios ven perfiles de su restaurante` con `restaurante_id = (SELECT restaurante_id FROM perfiles WHERE id = auth.uid())`
- Esto causaba recursión infinita en PostgreSQL, la consulta del perfil fallaba silenciosamente
- Resultado: `currentUser` se quedaba en null → usuario veía Login page sin poder entrar

### Solución aplicada

1. Se eliminó la política recursiva
2. Se creó política simple: `usuarios ven su propio perfil` con `id = auth.uid()`
3. Se creó función `get_user_restaurante_id()` con SECURITY DEFINER para evitar recursión
4. Se creó política complementaria para que admins vean perfiles de su restaurante usando la función

SQL de corrección:

```sql
DROP POLICY IF EXISTS "usuarios ven perfiles de su restaurante" ON perfiles;
CREATE POLICY "usuarios ven su propio perfil" ON perfiles FOR SELECT
  USING (id = auth.uid());
CREATE OR REPLACE FUNCTION public.get_user_restaurante_id()
RETURNS UUID LANGUAGE SQL STABLE SECURITY DEFINER
AS $$ SELECT restaurante_id FROM public.perfiles WHERE id = auth.uid(); $$;
CREATE POLICY "usuarios ven perfiles de su restaurante" ON perfiles FOR SELECT
  USING (
    get_user_restaurante_id() IS NOT NULL
    AND (
      restaurante_id = get_user_restaurante_id()
      OR (SELECT rol FROM public.perfiles WHERE id = auth.uid()) = 'super_admin'
    )
  );
```

### Archivos SQL ejecutados en BD

- fase9_fix_login_perfil.sql (perfil carlmir58 + RLS)
- fase11_update_trigger.sql (trigger handle_new_user)
- SQL de corrección RLS (get_user_restaurante_id)

### Estado actual

- Local funciona correctamente
- Vercel requirió redeploy manual tras push a GitHub
- Ya funciona en producción

### Pendiente

- Fase 5: Mejoras funcionales (impresión, reportes, inventario, tests)
- Verificar que usuarios nuevos creados via trigger tengan restaurante_id correcto
