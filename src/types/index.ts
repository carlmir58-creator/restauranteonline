export type Role = 'admin' | 'mesero' | 'cajero' | 'cocina' | 'barra';
export type MesaEstado = 'disponible' | 'ocupada' | 'en_cobro' | 'cerrada' | 'reservada' | 'mantenimiento';
export type ItemEstado = 'pendiente' | 'en_preparacion' | 'listo' | 'entregado' | 'cobrado' | 'cancelado';
export type AreaProducto = 'cocina' | 'barra';
export type MetodoPago = 'efectivo' | 'tarjeta' | 'transferencia';

export interface User {
  id: string;
  nombre: string;
  rol: Role;
  activo: boolean;
}

export interface Mesa {
  id: string;
  numero: number;
  capacidad: number;
  estado: MesaEstado;
}

export interface Categoria {
  id: string;
  nombre: string;
  color?: string;
  ordenVisual?: number;
  areaProduccion?: AreaProducto;
}

export interface Producto {
  id: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  categoriaId: string;
  area: AreaProducto;
  activo: boolean;
  imagenUrl?: string;
  disponible: boolean;
  tiempoPreparacionMin?: number;
  disponibleHoraInicio?: string;
  disponibleHoraFin?: string;
}

export interface PedidoDetalle {
  id: string;
  pedidoId: string;
  productoId: string;
  cantidad: number;
  notas: string;
  estado: ItemEstado;
  precio: number;
}

export interface Pedido {
  id: string;
  mesaId: string;
  meseroId: string;
  fecha: string;
  cliente?: string;
  observaciones?: string;
  items: PedidoDetalle[];
  pagado?: boolean;
}

export interface Pago {
  id: string;
  pedidoId: string;
  montoTotal: number;
  metodoPago: MetodoPago;
  fecha: string;
}

export interface MovimientoCaja {
  id: string;
  tipo: 'apertura' | 'cierre' | 'ingreso' | 'egreso';
  monto: number;
  descripcion: string;
  fecha: string;
  userId?: string;
  categoria?: string;
}
