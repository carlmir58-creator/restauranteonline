-- FASE 5: CONFIGURACIONES DEL SISTEMA
-- 1. Crear tabla de configuraciones
CREATE TABLE IF NOT EXISTS configuraciones (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  descripcion TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Insertar valores por defecto para los requerimientos de impresión y pantallas
INSERT INTO configuraciones (key, value, descripcion)
VALUES 
  ('impresion_separada_barra', 'false', 'Si es true, las bebidas se imprimen en un ticket separado de la cocina'),
  ('produccion_digital_habilitada', 'true', 'Si es false, se deshabilitan las pantallas de Cocina/Barra y el mesero marca "Listo" manualmente')
ON CONFLICT (key) DO NOTHING;

-- 3. Habilitar RLS
ALTER TABLE configuraciones ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS (Lectura para todos, Edición solo para admin)
CREATE POLICY "Permitir lectura de configuraciones a todos" ON configuraciones FOR SELECT USING (true);
CREATE POLICY "Permitir actualización de configuraciones a admins" ON configuraciones FOR UPDATE 
USING (EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin'));
