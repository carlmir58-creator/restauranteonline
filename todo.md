# 🚀 Orderly Eats - Plan de Progreso

## 🛠️ Fase 1: Configuración de Supabase (Completado ✅)

- [x] Crear proyecto en Supabase.
- [x] Configurar variables de entorno (`.env.local`).
- [x] Instalar `@supabase/supabase-js`.
- [x] Inicializar el cliente de Supabase en `src/lib/supabase.ts`.

## 🗄️ Fase 2: Diseño de Base de Datos y Migración (Completado ✅)

- [x] Crear tabla de `perfiles`/`usuarios` vinculada a Auth.
- [x] Crear tabla de `mesas` (id, numero, capacidad, estado).
- [x] Crear tabla de `categorias` y `productos`.
- [x] Crear tablas de `pedidos` y `pedido_detalles`.
- [x] Crear tablas de `pagos` y `movimientos_caja`.
- [x] Establecer Relaciones (Foreign Keys) y Políticas RLS. (`fase2_rls_y_ajustes.sql`)
- [x] Trigger para perfiles automáticos.

## 🔄 Fase 3: Integración del Estado Global (Zustand + Supabase) (Completado ✅)

- [x] Migrar `useStore.ts` para que use fetches de Supabase en lugar de `mockData`.
- [x] Implementar suscripciones en tiempo real (Realtime) para:
  - [x] Actualización de estado de mesas.
  - [x] Pedidos nuevos para cocina/barra.
  - [x] Cambios en ítems (preparado/entregado).

## 🔐 Fase 4: Autenticación y Seguridad (Completado ✅)

- [x] Configurar Supabase Auth (Email/Password).
- [x] Proteger rutas en el frontend según el rol del usuario.
- [x] Implementar `setSession` con `onAuthStateChange`.
- [x] Pantalla de cuenta pendiente de activación.
- [x] Branding: Título "Comanda|POS" y favicon.

## 👤 Fase 4.5: Panel de Administración de Usuarios (Completado ✅)

- [x] `updateUser` en el store (activo + rol).
- [x] Tabla de usuarios con búsqueda y filtro por rol.
- [x] Toggle activar/desactivar con diálogo de confirmación.
- [x] Selector de rol inline con protección de cuenta propia.
- [x] Badges de estado y estadísticas (total / activos / pendientes).
- [x] Fix: import `UtensilsCrossed` faltante en `App.tsx`.

## 📝 Fase 4.6: Ajustes de Comandas y Caja (Completado ✅)

- [x] Implementar notas detalladas por producto para cocina/barra.
- [x] Añadir campo de observaciones generales por pedido.
- [x] Mejorar la edición de notas con interfaz inline (sin prompts).
- [x] Habilitar registro de gastos diversos (nómina, transporte, otros) en Caja.
- [x] Sincronizar categorías de egresos entre UI y Base de Datos.

## 📈 Fase 5: Mejoras Funcionales y Pulido (Pendiente ⬜)

- [ ] Sistema de impresión de tickets (`react-to-print`).
- [ ] Reportes/Dashboard con datos reales de la DB (gráficos de ventas).
- [ ] Gestión de inventario vinculada a la venta de productos.
- [ ] Pruebas unitarias de flujo de pedidos con Vitest.

---

_Nota: Este archivo se irá actualizando a medida que avancemos con los puntos listados._
