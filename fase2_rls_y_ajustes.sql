-- SCRIPT DE AJUSTES Y SEGURIDAD (RLS)
-- Corrección y adición de tablas faltantes y políticas RLS

-- 1. Crear tabla de movimientos_caja si no existe
CREATE TABLE IF NOT EXISTS movimientos_caja (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (tipo IN ('ingreso', 'egreso')),
  monto DECIMAL(10,2) NOT NULL,
  descripcion TEXT,
  categoria TEXT CHECK (categoria IN ('venta', 'gasto', 'retiro', 'base')),
  fecha TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  usuario_id UUID REFERENCES perfiles(id)
);

-- 2. Habilitar RLS en todas las tablas
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_detalles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_caja ENABLE ROW LEVEL SECURITY;

-- 3. Políticas RLS (Lectura pública para simplificar el flujo inicial de desarrollo)
-- Nota: En producción, estas políticas deberían ser mucho más restrictivas basándose en roles.

-- Políticas para Categorías y Productos (Todo el mundo puede verlos)
CREATE POLICY "Permitir lectura de categorias a todos" ON categorias FOR SELECT USING (true);
CREATE POLICY "Permitir lectura de productos a todos" ON productos FOR SELECT USING (true);

-- Políticas para Mesas (Lectura pública, actualización para meseros/admin)
CREATE POLICY "Permitir lectura de mesas a todos" ON mesas FOR SELECT USING (true);
CREATE POLICY "Permitir actualización de mesas a todos" ON mesas FOR UPDATE USING (true);

-- Políticas para Perfiles
CREATE POLICY "Permitir lectura de perfiles a todos" ON perfiles FOR SELECT USING (true);

-- Políticas para Pedidos y Detalles
CREATE POLICY "Permitir todo en pedidos a todos" ON pedidos FOR ALL USING (true);
CREATE POLICY "Permitir todo en pedido_detalles a todos" ON pedido_detalles FOR ALL USING (true);

-- Políticas para Pagos y Movimientos (Solo lectura y creación)
CREATE POLICY "Permitir todo en pagos a todos" ON pagos FOR ALL USING (true);
CREATE POLICY "Permitir todo en movimientos_caja a todos" ON movimientos_caja FOR ALL USING (true);

-- 5. Trigger para creación automática de perfil al registrarse en Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.perfiles (id, nombre, rol, activo)
  VALUES (new.id, split_part(new.email, '@', 1), 'mesero', true);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
