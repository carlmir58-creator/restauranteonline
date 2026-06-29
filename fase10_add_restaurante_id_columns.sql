-- FASE 10: AGREGAR COLUMNA restaurante_id A TABLAS DE DATOS
-- Ejecutar DESPUÉS de tener la tabla restaurantes y la columna en perfiles

-- 1. Agregar columna a tablas que aún no la tienen
ALTER TABLE categorias ADD COLUMN IF NOT EXISTS restaurante_id UUID REFERENCES restaurantes(id);
ALTER TABLE productos ADD COLUMN IF NOT EXISTS restaurante_id UUID REFERENCES restaurantes(id);
ALTER TABLE mesas ADD COLUMN IF NOT EXISTS restaurante_id UUID REFERENCES restaurantes(id);
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS restaurante_id UUID REFERENCES restaurantes(id);
ALTER TABLE pedido_detalles ADD COLUMN IF NOT EXISTS restaurante_id UUID REFERENCES restaurantes(id);
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS restaurante_id UUID REFERENCES restaurantes(id);
ALTER TABLE movimientos_caja ADD COLUMN IF NOT EXISTS restaurante_id UUID REFERENCES restaurantes(id);
ALTER TABLE configuraciones ADD COLUMN IF NOT EXISTS restaurante_id UUID REFERENCES restaurantes(id);

-- 2. Asignar el restaurante default a todas las filas existentes
UPDATE categorias SET restaurante_id = '00000000-0000-0000-0000-000000000000' WHERE restaurante_id IS NULL;
UPDATE productos SET restaurante_id = '00000000-0000-0000-0000-000000000000' WHERE restaurante_id IS NULL;
UPDATE mesas SET restaurante_id = '00000000-0000-0000-0000-000000000000' WHERE restaurante_id IS NULL;
UPDATE pedidos SET restaurante_id = '00000000-0000-0000-0000-000000000000' WHERE restaurante_id IS NULL;
UPDATE pedido_detalles SET restaurante_id = '00000000-0000-0000-0000-000000000000' WHERE restaurante_id IS NULL;
UPDATE pagos SET restaurante_id = '00000000-0000-0000-0000-000000000000' WHERE restaurante_id IS NULL;
UPDATE movimientos_caja SET restaurante_id = '00000000-0000-0000-0000-000000000000' WHERE restaurante_id IS NULL;
UPDATE configuraciones SET restaurante_id = '00000000-0000-0000-0000-000000000000' WHERE restaurante_id IS NULL;

-- 3. Hacer NOT NULL
ALTER TABLE categorias ALTER COLUMN restaurante_id SET NOT NULL;
ALTER TABLE productos ALTER COLUMN restaurante_id SET NOT NULL;
ALTER TABLE mesas ALTER COLUMN restaurante_id SET NOT NULL;
ALTER TABLE pedidos ALTER COLUMN restaurante_id SET NOT NULL;
ALTER TABLE pedido_detalles ALTER COLUMN restaurante_id SET NOT NULL;
ALTER TABLE pagos ALTER COLUMN restaurante_id SET NOT NULL;
ALTER TABLE movimientos_caja ALTER COLUMN restaurante_id SET NOT NULL;
ALTER TABLE configuraciones ALTER COLUMN restaurante_id SET NOT NULL;
