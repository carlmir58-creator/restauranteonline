-- SCRIPT DE IMPORTACIÓN FINAL (VERSIÓN UUID) PARA SUPABASE
-- Este script habilita UUIDs y usa identificadores únicos y seguros.

-- 1. Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Limpieza de tablas existentes (si aplica)
DROP TABLE IF EXISTS pedido_detalles;
DROP TABLE IF EXISTS pagos;
DROP TABLE IF EXISTS pedidos;
DROP TABLE IF EXISTS productos;
DROP TABLE IF EXISTS categorias;
DROP TABLE IF EXISTS perfiles;

-- 3. Crear tabla de categorías con UUID
CREATE TABLE categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  color TEXT DEFAULT '#3498db',
  orden_visual INTEGER DEFAULT 0,
  area_produccion TEXT CHECK (area_produccion IN ('cocina', 'barra')) DEFAULT 'cocina'
);

-- 4. Crear tabla de productos con UUID
CREATE TABLE productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria_id UUID REFERENCES categorias(id),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10,2) NOT NULL,
  imagen_url TEXT,
  disponible BOOLEAN DEFAULT true,
  tiempo_preparacion_min INTEGER DEFAULT 15,
  activo BOOLEAN DEFAULT true,
  disponible_hora_inicio TIME,
  disponible_hora_fin TIME
);

-- 5. Crear tabla de perfiles (vínculo con Auth)
CREATE TABLE perfiles (
  id UUID PRIMARY KEY, -- Se vincula al id de auth.users
  nombre TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('admin', 'mesero', 'cajero', 'cocina', 'barra')),
  activo BOOLEAN DEFAULT true,
  creado_el TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. Insertar Categorías y capturar IDs (Usando identificadores temporales)
-- Nota: Para facilitar la importación manual, generamos UUIDs determinísticos basados en el ID original de Jorge Lozano.
INSERT INTO categorias (id, nombre, color, orden_visual, area_produccion) VALUES
('00000000-0000-0000-0000-000000000001', 'Especialidades Santandereanas', '#8B0000', 1, 'cocina'),
('00000000-0000-0000-0000-000000000002', 'Carnes a la Plancha', '#CD853F', 2, 'cocina'),
('00000000-0000-0000-0000-000000000003', 'Pescados', '#4682B4', 3, 'cocina'),
('00000000-0000-0000-0000-000000000004', 'Desayunos y Caldos', '#F4A460', 4, 'cocina'),
('00000000-0000-0000-0000-000000000005', 'Sándwiches', '#DAA520', 5, 'cocina'),
('00000000-0000-0000-0000-000000000006', 'Hamburguesas', '#FF6347', 6, 'cocina'),
('00000000-0000-0000-0000-000000000007', 'Perros Calientes', '#FF4500', 7, 'cocina'),
('00000000-0000-0000-0000-000000000008', 'Adicionales', '#808080', 8, 'cocina'),
('00000000-0000-0000-0000-000000000009', 'Jugos en Agua', '#90EE90', 9, 'barra'),
('00000000-0000-0000-0000-000000000010', 'Jugos en Leche', '#F5F5DC', 10, 'barra'),
('00000000-0000-0000-0000-000000000011', 'Granizados', '#00CED1', 11, 'cocina'),
('00000000-0000-0000-0000-000000000012', 'Frappés', '#8B4513', 12, 'cocina'),
('00000000-0000-0000-0000-000000000013', 'Bebidas Calientes', '#722F37', 13, 'barra'),
('00000000-0000-0000-0000-000000000014', 'Gaseosas', '#FF69B4', 14, 'cocina');

-- 7. Insertar Productos vinculados por los nuevos UUIDs de categoría
INSERT INTO productos (categoria_id, nombre, descripcion, precio, imagen_url, disponible, tiempo_preparacion_min, activo) VALUES
('00000000-0000-0000-0000-000000000001', 'Bandeja Mixta Completa', 'Cabro asado, carne oreada, pernil de pollo, chorizo de cerdo, pepitoria, yuca al vapor, arepa santandereana y ensalada', 47000.00, NULL, true, 25, true),
('00000000-0000-0000-0000-000000000001', 'Bandeja Mixta', 'Cabro asado o carne oreada, pernil de pollo, chorizo de cerdo, pepitoria, yuca al vapor, arepa santandereana y ensalada', 40000.00, '/uploads/productos/prod-1776293478073-519713961.jpg', true, 25, true),
('00000000-0000-0000-0000-000000000001', 'Cabro Asado', 'Cabro asado, pepitoria, yuca al vapor, arepa santandereana y ensalada', 32000.00, '/uploads/productos/prod-1776297345502-446523116.webp', true, 20, true),
('00000000-0000-0000-0000-000000000001', 'Cabro Sudado', 'Cabro sudado, pepitoria, yuca al vapor, arepa santandereana y ensalada', 32000.00, NULL, true, 25, true),
('00000000-0000-0000-0000-000000000001', 'Carne Oreada', 'Carne oreada, pepitoria, yuca al vapor, arepa santandereana y ensalada', 32000.00, NULL, true, 15, true),
('00000000-0000-0000-0000-000000000001', 'Mute Santandereano', 'Carne oreada, arroz, yuca al vapor y ensalada', 32000.00, NULL, true, 20, true),
('00000000-0000-0000-0000-000000000001', 'Picada para 2', 'Carne oreada, pechuga, chorizo, rellena, salchicha, papas fritas y arepa santandereana', 50000.00, NULL, true, 15, true),
('00000000-0000-0000-0000-000000000001', 'Picada para 3', 'Carne oreada, carne fresca, pechuga, chorizo, rellena, salchicha, papas fritas y arepa santandereana', 60000.00, NULL, true, 15, true),
('00000000-0000-0000-0000-000000000002', 'Chatas', 'Yuca al vapor, arepa santandereana y ensalada', 34000.00, NULL, true, 15, true),
('00000000-0000-0000-0000-000000000002', 'Carne Fresca', 'Yuca al vapor, arepa santandereana y ensalada', 28000.00, NULL, true, 15, true),
('00000000-0000-0000-0000-000000000002', 'Sobrebarrriga', 'Yuca al vapor, arepa santandereana y ensalada', 32000.00, NULL, true, 20, true),
('00000000-0000-0000-0000-000000000002', 'Pechuga a la Plancha', 'Papas a la francesa y ensalada', 28000.00, NULL, true, 12, true),
('00000000-0000-0000-0000-000000000002', 'Pechuga Gratinada', 'Papas a la francesa y ensalada', 30000.00, NULL, true, 15, true),
('00000000-0000-0000-0000-000000000002', 'Costillas de Cerdo BBQ', 'Con papas a la francesa y ensalada', 28000.00, NULL, true, 18, true),
('00000000-0000-0000-0000-000000000002', 'Lomo de Cerdo BBQ', 'Con papas a la francesa y ensalada', 28000.00, NULL, true, 18, true),
('00000000-0000-0000-0000-000000000002', 'Alitas de Pollo BBQ', 'Con papas a la francesa y ensalada', 26000.00, NULL, true, 15, true),
('00000000-0000-0000-0000-000000000002', 'Alitas Miel Mostaza', 'Con papas a la francesa y ensalada', 26000.00, NULL, true, 15, true),
('00000000-0000-0000-0000-000000000003', 'Mojarra Asada', 'Con patacones y ensalada', 32000.00, NULL, true, 20, true),
('00000000-0000-0000-0000-000000000003', 'Trucha', 'Con papas a la francesa y ensalada', 30000.00, NULL, true, 18, true),
('00000000-0000-0000-0000-000000000003', 'Cazuela de Mariscos', 'Con arroz y patacones', 36000.00, NULL, true, 25, true),
('00000000-0000-0000-0000-000000000004', 'Caldo de Carne', 'Acompañado de arepa santandereana y pan', 15000.00, NULL, true, 10, true),
('00000000-0000-0000-0000-000000000004', 'Huevos al Gusto', 'Acompañado de arepa santandereana y pan', 13000.00, NULL, true, 10, true),
('00000000-0000-0000-0000-000000000004', 'Tamal Santandereano', 'Acompañado de pan', 14000.00, NULL, true, 5, true),
('00000000-0000-0000-0000-000000000004', 'Chorizos Organizados', 'Acompañado de arepa santandereana o yuca al vapor', 14000.00, NULL, true, 12, true),
('00000000-0000-0000-0000-000000000004', 'Sopa del Día', 'Plato del día', 6000.00, NULL, true, 10, true),
('00000000-0000-0000-0000-000000000005', 'Sándwich Frío', 'Pollo, jamón, queso, tomate y lechuga', 16000.00, NULL, true, 5, true),
('00000000-0000-0000-0000-000000000006', 'Hamburguesa Clásica', 'Pan brioche, carne de res, jamón, queso mozzarella, vegetales frescos, cebolla grille y papa a la francesa', 18000.00, NULL, true, 15, true),
('00000000-0000-0000-0000-000000000006', 'Corazón del Chicamocha', 'Pan brioche, carne de res, pollo crispy, aros de cebolla, tocineta, queso mozzarella con maíz, vegetales frescos, cebolla grille y papa a la francesa', 30000.00, NULL, true, 20, true),
('00000000-0000-0000-0000-000000000006', 'La Arrecha', 'Pan brioche, doble carne de res, tocineta, queso cheddar, jalapeños, vegetales frescos, cebolla grille y papa a la francesa', 30000.00, NULL, true, 18, true),
('00000000-0000-0000-0000-000000000006', 'Olé Pingo', 'Pan brioche, carne de res, chorizos en guarapo, queso costeño frito, vegetales frescos, cebolla grille y papa a la francesa', 24000.00, NULL, true, 18, true),
('00000000-0000-0000-0000-000000000006', 'Sabores de Mi Tierra (Hamburguesa)', 'Pan brioche, carne de res, carne oreada, pollo desmechado bañado en tártara de la casa, tocineta, queso mozzarella, vegetales frescos, cebolla grille y papa a la francesa', 27000.00, NULL, true, 20, true),
('00000000-0000-0000-0000-000000000007', 'Perro Clásico', 'Pan brioche, salchicha Zenu, jamón, queso mozzarella, cebolla grille y papa a la francesa', 18000.00, NULL, true, 10, true),
('00000000-0000-0000-0000-000000000007', 'El Atembado', 'Pan brioche, chorizo casero, tocineta, aros de cebolla, queso mozzarella, cebolla grille y papa a la francesa', 19000.00, NULL, true, 12, true),
('00000000-0000-0000-0000-000000000007', 'Sabores de Mi Tierra (Perro)', 'Pan brioche, salchicha Zenu, pollo desmechado, carne oreada, queso mozzarella, cebolla grille y papa a la francesa', 25000.00, NULL, true, 15, true),
('00000000-0000-0000-0000-000000000007', 'El Zurron', 'Pan brioche, salchicha americana, pollo, carne en trozos, tocineta, queso mozzarella, cebolla grille y papa a la francesa', 25000.00, NULL, true, 15, true),
('00000000-0000-0000-0000-000000000007', 'Corazón del Chicamocha (Perro)', 'Pan brioche, salchicha Zenu, pollo, carne en trozos, queso mozzarella, cebolla grille y papa a la francesa', 28000.00, NULL, true, 15, true),
('00000000-0000-0000-0000-000000000008', 'Arepa Santandereana', 'Unidad', 4000.00, NULL, true, 3, true),
('00000000-0000-0000-0000-000000000008', 'Porción de Pepitoria', 'Unidad', 7000.00, NULL, true, 3, true),
('00000000-0000-0000-0000-000000000008', 'Porción de Arroz', 'Unidad', 4000.00, NULL, true, 5, true),
('00000000-0000-0000-0000-000000000008', 'Papa a la Francesa', 'Porción', 8000.00, NULL, true, 8, true),
('00000000-0000-0000-0000-000000000008', 'Pan', 'Unidad', 1000.00, NULL, true, 1, true),
('00000000-0000-0000-0000-000000000008', 'Porción de Huevos', 'Unidad', 8000.00, NULL, true, 5, true),
('00000000-0000-0000-0000-000000000009', 'Jugo de Fresa en Agua', 'Jugo natural de fresa en agua, sin azúcar añadida', 7000.00, NULL, true, 3, true),
('00000000-0000-0000-0000-000000000009', 'Jugo de Mora en Agua', 'Jugo natural de mora en agua, sin azúcar añadida', 7000.00, NULL, true, 3, true),
('00000000-0000-0000-0000-000000000009', 'Jugo de Maracuyá en Agua', 'Jugo natural de maracuyá en agua', 7000.00, NULL, true, 3, true),
('00000000-0000-0000-0000-000000000009', 'Jugo de Guanábana en Agua', 'Jugo natural de guanábana en agua', 7000.00, NULL, true, 3, true),
('00000000-0000-0000-0000-000000000009', 'Jugo de Lulo en Agua', 'Jugo natural de lulo en agua', 7000.00, NULL, true, 3, true),
('00000000-0000-0000-0000-000000000010', 'Jugo de Fresa en Leche', 'Jugo natural de fresa con leche entera', 8000.00, NULL, true, 4, true),
('00000000-0000-0000-0000-000000000010', 'Jugo de Mora en Leche', 'Jugo natural de mora con leche entera', 8000.00, NULL, true, 4, true),
('00000000-0000-0000-0000-000000000010', 'Jugo de Maracuyá en Leche', 'Jugo natural de maracuyá con leche entera', 8000.00, NULL, true, 4, true),
('00000000-0000-0000-0000-000000000010', 'Jugo de Guanábana en Leche', 'Jugo natural de guanábana con leche entera', 8000.00, NULL, true, 4, true),
('00000000-0000-0000-0000-000000000010', 'Jugo de Lulo en Leche', 'Jugo natural de lulo con leche entera', 8000.00, NULL, true, 4, true),
('00000000-0000-0000-0000-000000000011', 'Granizado de Limón', 'Hielo raspado con sirope de limón natural', 10000.00, NULL, true, 5, true),
('00000000-0000-0000-0000-000000000011', 'Granizado de Maracuyá', 'Hielo raspado con sirope de maracuyá', 10000.00, NULL, true, 5, true),
('00000000-0000-0000-0000-000000000011', 'Granizado de Mora', 'Hielo raspado con sirope de mora', 10000.00, NULL, true, 5, true),
('00000000-0000-0000-0000-000000000012', 'Frappé de Café', 'Café espresso, hielo y leche batidos', 14000.00, NULL, true, 5, true),
('00000000-0000-0000-0000-000000000012', 'Frappé de Milo', 'Milo, hielo y leche batidos', 14000.00, NULL, true, 5, true),
('00000000-0000-0000-0000-000000000012', 'Frappé de Oreo', 'Galleta Oreo, hielo y leche batidos con crema', 14000.00, NULL, true, 5, true),
('00000000-0000-0000-0000-000000000013', 'Aromática', 'Infusión tradicional de hierbas', 3000.00, NULL, true, 3, true),
('00000000-0000-0000-0000-000000000013', 'Aromática de Frutas', 'Infusión con trozos de fruta fresca', 8000.00, NULL, true, 4, true),
('00000000-0000-0000-0000-000000000013', 'Café Negro', 'Café tradicional filtrado', 3000.00, NULL, true, 3, true),
('00000000-0000-0000-0000-000000000013', 'Café con Leche', 'Café tradicional con leche caliente', 4000.00, NULL, true, 3, true),
('00000000-0000-0000-0000-000000000013', 'Chocolate Caliente', 'Chocolate de mesa caliente', 4000.00, NULL, true, 4, true),
('00000000-0000-0000-0000-000000000013', 'Capuchino', 'Café espresso con espuma de leche', 8000.00, NULL, true, 5, true),
('00000000-0000-0000-0000-000000000014', 'Sirope de Soda Frutos Rojos', 'Soda con sirope artesanal de frutos rojos', 15000.00, NULL, true, 2, true),
('00000000-0000-0000-0000-000000000014', 'Sirope de Soda Maracuyá', 'Soda con sirope artesanal de maracuyá', 15000.00, NULL, true, 2, true),
('00000000-0000-0000-0000-000000000014', 'COCA COLA X 1 LITRO', 'GASEOSA', 5000.00, '/uploads/productos/prod-1776293818279-721128472.jpg', true, 1, true);

-- 8. Otros Tablas (Mesas, Pedidos, etc.)
CREATE TABLE mesas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero INTEGER UNIQUE NOT NULL,
  capacidad INTEGER NOT NULL DEFAULT 2,
  estado TEXT NOT NULL CHECK (estado IN ('disponible', 'ocupada', 'reservada', 'mantenimiento')) DEFAULT 'disponible'
);

CREATE TABLE pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mesa_id UUID REFERENCES mesas(id),
  mesero_id UUID REFERENCES perfiles(id),
  fecha TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  cliente TEXT,
  observaciones TEXT,
  pagado BOOLEAN DEFAULT false
);

CREATE TABLE pedido_detalles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id UUID REFERENCES productos(id),
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  precio_unitario DECIMAL(10,2) NOT NULL,
  notas TEXT,
  estado TEXT NOT NULL CHECK (estado IN ('pendiente', 'en_preparacion', 'listo', 'entregado', 'cobrado', 'cancelado')) DEFAULT 'pendiente'
);

CREATE TABLE pagos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID REFERENCES pedidos(id),
  monto_total DECIMAL(10,2) NOT NULL,
  metodo_pago TEXT NOT NULL CHECK (metodo_pago IN ('efectivo', 'tarjeta', 'transferencia')),
  fecha TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 9. Insertar Mesas por defecto
INSERT INTO mesas (numero, capacidad) VALUES
(1, 2), (2, 2), (3, 2), (4, 2),
(5, 4), (6, 4), (7, 4), (8, 4),
(9, 6), (10, 6), (11, 6), (12, 6);
