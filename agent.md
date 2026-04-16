# Agent Context: Orderly Eats (RestoPOS)

## 📋 Descripción del Proyecto
**Orderly Eats** es un sistema moderno de Punto de Venta (POS) diseñado específicamente para el sector gastronómico (restaurantes, bares, cafeterías). El objetivo principal es digitalizar y optimizar todo el flujo de trabajo de un establecimiento, desde la toma de pedidos en mesa hasta la gestión en cocina/barra y el cobro final.

## 🛠 Stack Tecnológico
- **Frontend**: React 18 + TypeScript + Vite.
- **Estilos**: Tailwind CSS + Shadcn UI (Componentes de alta calidad).
- **Estado**: Zustand (Gestión fluida del estado global).
- **Rutas**: React Router Dom.
- **Gráficos**: Recharts (Para la sección de reportes).
- **Pruebas**: Vitest.

## 🏗 Arquitectura del Proyecto
La aplicación cuenta con diferentes vistas según el rol del usuario:
- **Admin**: Gestión total de productos, usuarios, mesas y visualización de reportes económicos.
- **Mesero**: Mapa interactivo de mesas, toma de pedidos y gestión de estados de mesa.
- **Caja**: Procesamiento de pagos, control de movimientos de caja y cierre de pedidos.
- **Cocina/Barra**: Visualización en tiempo real de los ítems pendientes por preparar, divididos por área de trabajo.

## 🚦 Estado Actual
- **Frontend**: La interfaz de usuario está desarrollada en un ~90%. Las pantallas principales (Caja, Mesas, Cocina, Dashboard) son totalmente funcionales con datos simulados.
- **Backend/DB**: Integrado con **Supabase** para persistencia de datos (PostgreSQL), autenticación real (Auth) y actualizaciones en tiempo real (Realtime).
- **Pendiente**: Refinamiento de políticas RLS avanzadas y personalización de roles en el dashboard.

## 📂 Estructura de Archivos Clave
- `src/pages/`: Contiene las vistas principales (Mesas, Caja, Cocina, etc.).
- `src/store/useStore.ts`: Estado global centralizado. Es el punto neurálgico para la migración a Supabase.
- `src/components/`: Componentes reutilizables (Botones, Modales, Tarjetas de pedidos).
- `src/data/mockData.ts`: Estructura de datos actual que debe replicarse en la base de datos SQL.
