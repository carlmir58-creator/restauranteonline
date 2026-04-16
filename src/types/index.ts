export type Role = 'admin' | 'mesero' | 'cajero' | 'cocina' | 'barra';

export type MesaEstado = 'disponible' | 'ocupada' | 'en_cobro' | 'cerrada';

export type ItemEstado = 'pendiente' | 'en_preparacion' | 'listo' | 'entregado' | 'cobrado';

export type AreaProducto = 'cocina' | 'barra';

export type MetodoPago = 'efectivo' | 'transferencia';

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
}

export interface Producto {
  id: string;
  nombre: string;
  precio: number;
  categoriaId: string;
  area: AreaProducto;
  activo: boolean;
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
}

export interface Pago {
  id: string;
  pedidoId: string;
  monto: number;
  impuesto: number;
  propina: number;
  metodo: MetodoPago;
  recibido?: number;
  cambio?: number;
  referencia?: string;
  fecha: string;
}

export interface MovimientoCaja {
  id: string;
  tipo: 'apertura' | 'cierre' | 'ingreso' | 'egreso';
  monto: number;
  descripcion: string;
  fecha: string;
  userId: string;
}
