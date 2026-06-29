# Plan: Multi-Tenencia para RestauranteOnline

Convertir la app de un solo restaurante a una plataforma multi-restaurante con super admin y admins por restaurante.

---

## Arquitectura

**Modelo:** Base de datos compartida con aislamiento por fila (`restaurante_id` en cada tabla) + RLS policies.

**Roles:**
| Rol | Alcance |
|---|---|
| `super_admin` | Crea y gestiona restaurantes. Ve todo. |
| `admin` | Administra su restaurante: usuarios, productos, config |
| `mesero`, `cajero`, `cocina`, `barra` | Staff del restaurante, datos aislados |

**Frontend:** Un solo deployment. La experiencia cambia según el rol del usuario logueado.

---

## Fase 1: Base de Datos

### 1.1 Nueva tabla `restaurantes`

```sql
CREATE TABLE restaurantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  direccion TEXT,
  telefono TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);
```

### 1.2 Agregar `super_admin` al CHECK de roles

```sql
ALTER TABLE perfiles DROP CONSTRAINT perfiles_rol_check;
ALTER TABLE perfiles ADD CONSTRAINT perfiles_rol_check
  CHECK (rol IN ('super_admin', 'admin', 'mesero', 'cajero', 'cocina', 'barra'));
```

### 1.3 Agregar `restaurante_id` a todas las tablas

| Tabla | Columna |
|---|---|
| perfiles | `restaurante_id UUID REFERENCES restaurantes(id)` |
| categorias | `restaurante_id UUID REFERENCES restaurantes(id)` |
| productos | `restaurante_id UUID REFERENCES restaurantes(id)` |
| mesas | `restaurante_id UUID REFERENCES restaurantes(id)` |
| pedidos | `restaurante_id UUID REFERENCES restaurantes(id)` |
| pedido_detalles | `restaurante_id UUID REFERENCES restaurantes(id)` |
| pagos | `restaurante_id UUID REFERENCES restaurantes(id)` |
| movimientos_caja | `restaurante_id UUID REFERENCES restaurantes(id)` |
| configuraciones | `restaurante_id UUID REFERENCES restaurantes(id)` (PK compuesto: key + restaurante_id) |

### 1.4 Migración de datos existentes

1. Insertar restaurante por defecto: `INSERT INTO restaurantes (id, nombre, slug) VALUES ('default', 'Mi Restaurante', 'mi-restaurante');`
2. Asignar `restaurante_id = 'default'` a todas las filas existentes en cada tabla
3. Agregar `SET NOT NULL` a todas las columnas `restaurante_id`

### 1.5 RLS Policies

Para cada tabla de datos del restaurante (categorias, productos, mesas, pedidos, etc.):

```sql
-- SELECT: solo datos del restaurante del usuario
CREATE POLICY "usuarios ven solo su restaurante" ON productos FOR SELECT
  USING (restaurante_id = (SELECT restaurante_id FROM perfiles WHERE id = auth.uid()));

-- super_admin ve todo
CREATE POLICY "super_admin ve todo" ON productos FOR SELECT
  USING ((SELECT rol FROM perfiles WHERE id = auth.uid()) = 'super_admin');

-- INSERT/UPDATE/DELETE: misma condición + rol admin
CREATE POLICY "admin puede modificar" ON productos FOR INSERT
  WITH CHECK (
    restaurante_id = (SELECT restaurante_id FROM perfiles WHERE id = auth.uid())
    AND (SELECT rol FROM perfiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
  );
```

Para la tabla `restaurantes`:
- `SELECT`: solo super_admin
- `INSERT/UPDATE/DELETE`: solo super_admin

### 1.6 Storage

Ruta de imágenes: `{restaurante_id}/{producto_id}.webp`
Políticas del bucket `productos` filtradas por restaurante_id del usuario autenticado.

---

## Fase 2: Store (Zustand)

### 2.1 Nuevos campos en el state

```typescript
interface AppState {
  currentRestaurant: Restaurante | null;
  restaurantes: Restaurante[];  // solo para super_admin
  // ... resto igual pero scoped
}
```

### 2.2 fetchInitialData() con filtro

Todas las consultas incluyen:

```typescript
const restId = get().currentUser?.restauranteId;
// Según el rol:
if (rol === 'super_admin') {
  // obtener TODOS los restaurantes y datos globales
} else {
  // filtrar por restId
  supabase.from('productos').select('*').eq('restaurante_id', restId);
}
```

### 2.3 Mutaciones

Todos los INSERT incluyen `restaurante_id: currentUser.restauranteId`.

### 2.4 Realtime

Canales filtrados por `restaurante_id`:
```typescript
supabase.channel(`db-changes-${restId}`)
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'mesas',
      filter: `restaurante_id=eq.${restId}` },
    handler)
```

---

## Fase 3: Frontend — Super Admin

### 3.1 Nueva página `SuperAdmin.tsx` (ruta: `/super-admin`)

- Lista de restaurantes con estado (activo/inactivo)
- Crear restaurante: formulario con nombre, dirección, teléfono + creación automática de usuario admin (email + password temporal)
- Editar / desactivar restaurantes
- Estadísticas básicas por restaurante (usuarios, productos, pedidos activos)

### 3.2 Sidebar para super_admin

```
🏠 Dashboard Global
🍽️ Restaurantes
```

---

## Fase 4: Frontend — Login y Routing

### 4.1 Flujo de login

```
Login (email + password)
  → Obtener perfil + restaurante
    ├── super_admin → redirect /super-admin
    ├── admin/mesero/etc con restaurante activo → redirect según rol
    └── restaurante inactivo → pantalla "Restaurante desactivado"
```

### 4.2 Layout

- Header/sidebar muestra el nombre del restaurante actual
- Nav items se generan según el rol (igual que ahora, pero scoped)
- Super admin tiene nav propio

---

## Fase 5: Frontend — Admin de Restaurante

La experiencia del admin de restaurante es casi idéntica a la actual, con estos ajustes:

- Productos, mesas, usuarios, etc. aislados por `restaurante_id`
- `Configuracion.tsx`: settings scoped al restaurante
- `Usuarios.tsx`: al crear usuario, se asigna automáticamente el `restaurante_id` del admin actual
- Opción de editar nombre/dirección/teléfono del restaurante desde configuración

---

## Fase 6: Seed Automático al Crear Restaurante

Cuando el super_admin crea un restaurante nuevo, se genera automáticamente:

1. Usuario admin con email/password proporcionados
2. 14 categorías por defecto (las del seed actual)
3. 12 mesas por defecto (4 de cap. 2, 4 de cap. 4, 4 de cap. 6)
4. Configuraciones por defecto (`impresion_separada_barra: false`, `produccion_digital_habilitada: true`)

Esto puede hacerse con una función PostgreSQL o desde el frontend con llamadas en lote.

---

## Orden de Implementación

| Prioridad | Fase | Descripción | Dependencias |
|---|---|---|---|
| 🔴 Alta | 1 | DB: tabla restaurantes + columna restaurante_id + migración + RLS | Ninguna |
| 🔴 Alta | 2 | Store: filtrado por restaurante en todas las queries | Fase 1 |
| 🔴 Alta | 3 | Super Admin: CRUD de restaurantes | Fase 1, Fase 2 |
| 🟡 Media | 3.2 | Sidebar y nav del super_admin | Fase 3 |
| 🟡 Media | 4 | Login/Routing: flujo multi-rol | Fase 1, Fase 2 |
| 🟡 Media | 5 | Admin rest: config propia del restaurante | Fase 1, Fase 2 |
| 🟢 Baja | 6 | Seed automático al crear restaurante | Fase 3 |

---

## Preguntas Pendientes

1. ¿Seed automático de categorías y mesas al crear restaurante, o desde cero?
2. ¿Super admin puede "entrar" a ver el dashboard de cualquier restaurante?
3. ¿Slug en URL (`/restaurante/mi-resto/mesas`) o rutas planas con filtro por usuario?
4. ¿Storage: un bucket con carpetas por restaurante, o un bucket por restaurante?
