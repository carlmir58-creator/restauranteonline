import { User, Mesa, Categoria, Producto, Pedido } from '@/types';

export const mockUsers: User[] = [
  { id: 'u1', nombre: 'Admin Principal', rol: 'admin', activo: true },
  { id: 'u2', nombre: 'Carlos Mesero', rol: 'mesero', activo: true },
  { id: 'u3', nombre: 'María Cajera', rol: 'cajero', activo: true },
  { id: 'u4', nombre: 'Chef Pedro', rol: 'cocina', activo: true },
  { id: 'u5', nombre: 'Ana Barista', rol: 'barra', activo: true },
];

export const mockMesas: Mesa[] = Array.from({ length: 12 }, (_, i) => ({
  id: `m${i + 1}`,
  numero: i + 1,
  capacidad: i < 4 ? 2 : i < 8 ? 4 : 6,
  estado: 'disponible' as const,
}));

export const mockCategorias: Categoria[] = [
  { id: 'c1', nombre: 'Entradas' },
  { id: 'c2', nombre: 'Platos Fuertes' },
  { id: 'c3', nombre: 'Postres' },
  { id: 'c4', nombre: 'Bebidas' },
  { id: 'c5', nombre: 'Cervezas' },
  { id: 'c6', nombre: 'Cócteles' },
];

export const mockProductos: Producto[] = [
  { id: 'p1', nombre: 'Hamburguesa Clásica', precio: 12.50, categoriaId: 'c2', area: 'cocina', activo: true },
  { id: 'p2', nombre: 'Papas Fritas', precio: 5.00, categoriaId: 'c1', area: 'cocina', activo: true },
  { id: 'p3', nombre: 'Alitas BBQ', precio: 10.00, categoriaId: 'c1', area: 'cocina', activo: true },
  { id: 'p4', nombre: 'Pizza Margarita', precio: 14.00, categoriaId: 'c2', area: 'cocina', activo: true },
  { id: 'p5', nombre: 'Ensalada César', precio: 9.00, categoriaId: 'c1', area: 'cocina', activo: true },
  { id: 'p6', nombre: 'Filete de Res', precio: 22.00, categoriaId: 'c2', area: 'cocina', activo: true },
  { id: 'p7', nombre: 'Brownie', precio: 6.00, categoriaId: 'c3', area: 'cocina', activo: true },
  { id: 'p8', nombre: 'Gaseosa', precio: 3.00, categoriaId: 'c4', area: 'barra', activo: true },
  { id: 'p9', nombre: 'Jugo Natural', precio: 4.50, categoriaId: 'c4', area: 'barra', activo: true },
  { id: 'p10', nombre: 'Cerveza Nacional', precio: 4.00, categoriaId: 'c5', area: 'barra', activo: true },
  { id: 'p11', nombre: 'Cerveza Importada', precio: 6.50, categoriaId: 'c5', area: 'barra', activo: true },
  { id: 'p12', nombre: 'Mojito', precio: 8.00, categoriaId: 'c6', area: 'barra', activo: true },
  { id: 'p13', nombre: 'Margarita', precio: 9.00, categoriaId: 'c6', area: 'barra', activo: true },
  { id: 'p14', nombre: 'Agua Mineral', precio: 2.50, categoriaId: 'c4', area: 'barra', activo: true },
  { id: 'p15', nombre: 'Tacos al Pastor', precio: 11.00, categoriaId: 'c2', area: 'cocina', activo: true },
];
