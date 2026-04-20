-- FASE 3: AJUSTES DE NOTAS Y GASTOS DIVERSOS
-- 1. Asegurar columna de notas en detalles (por si acaso no se aplicó antes)
ALTER TABLE pedido_detalles ADD COLUMN IF NOT EXISTS notas TEXT;

-- 2. Actualizar tabla de movimientos_caja para aceptar más categorías de gastos
-- Eliminamos el check anterior para actualizarlo
ALTER TABLE movimientos_caja DROP CONSTRAINT IF EXISTS movimientos_caja_categoria_check;

-- Añadimos las categorías que coincidan con la interfaz de Caja.tsx
ALTER TABLE movimientos_caja ADD CONSTRAINT movimientos_caja_categoria_check 
CHECK (categoria IN ('venta', 'gasto', 'retiro', 'base', 'nomina', 'transporte', 'otros'));

-- 3. Asegurar que las observaciones del pedido existan (ya estaban pero reforzamos)
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS observaciones TEXT;
