import { create } from 'zustand';
import { User, Mesa, Producto, Categoria, Pedido, PedidoDetalle, Pago, MovimientoCaja, ItemEstado } from '@/types';
import { mockUsers, mockMesas, mockProductos, mockCategorias } from '@/data/mockData';

interface AppState {
  // Auth
  currentUser: User | null;
  login: (userId: string) => void;
  logout: () => void;

  // Data
  users: User[];
  mesas: Mesa[];
  productos: Producto[];
  categorias: Categoria[];
  pedidos: Pedido[];
  pagos: Pago[];
  movimientosCaja: MovimientoCaja[];

  // Mesa actions
  updateMesaEstado: (mesaId: string, estado: Mesa['estado']) => void;

  // Pedido actions
  crearPedido: (mesaId: string, cliente?: string, observaciones?: string) => string;
  agregarItem: (pedidoId: string, productoId: string, cantidad: number, notas?: string) => void;
  eliminarItem: (pedidoId: string, itemId: string) => boolean;
  actualizarItemEstado: (pedidoId: string, itemId: string, estado: ItemEstado) => void;
  actualizarItemCantidad: (pedidoId: string, itemId: string, cantidad: number) => boolean;

  // Pago actions
  procesarPago: (pago: Omit<Pago, 'id' | 'fecha'>) => void;

  // Admin actions
  addProducto: (p: Omit<Producto, 'id'>) => void;
  updateProducto: (id: string, p: Partial<Producto>) => void;
  addMesa: (m: Omit<Mesa, 'id'>) => void;
  addUser: (u: Omit<User, 'id'>) => void;
  addMovimientoCaja: (m: Omit<MovimientoCaja, 'id' | 'fecha'>) => void;
}

let counter = 100;
const uid = () => `gen_${++counter}`;

export const useStore = create<AppState>((set, get) => ({
  currentUser: null,
  users: mockUsers,
  mesas: mockMesas,
  productos: mockProductos,
  categorias: mockCategorias,
  pedidos: [],
  pagos: [],
  movimientosCaja: [],

  login: (userId) => {
    const user = get().users.find(u => u.id === userId);
    if (user) set({ currentUser: user });
  },

  logout: () => set({ currentUser: null }),

  updateMesaEstado: (mesaId, estado) => {
    set(s => ({ mesas: s.mesas.map(m => m.id === mesaId ? { ...m, estado } : m) }));
  },

  crearPedido: (mesaId, cliente, observaciones) => {
    const id = uid();
    const pedido: Pedido = {
      id,
      mesaId,
      meseroId: get().currentUser?.id || '',
      fecha: new Date().toISOString(),
      cliente,
      observaciones,
      items: [],
    };
    set(s => ({
      pedidos: [...s.pedidos, pedido],
      mesas: s.mesas.map(m => m.id === mesaId ? { ...m, estado: 'ocupada' as const } : m),
    }));
    return id;
  },

  agregarItem: (pedidoId, productoId, cantidad, notas) => {
    const producto = get().productos.find(p => p.id === productoId);
    if (!producto) return;
    const item: PedidoDetalle = {
      id: uid(),
      pedidoId,
      productoId,
      cantidad,
      notas: notas || '',
      estado: 'pendiente',
      precio: producto.precio,
    };
    set(s => ({
      pedidos: s.pedidos.map(p =>
        p.id === pedidoId ? { ...p, items: [...p.items, item] } : p
      ),
    }));
  },

  eliminarItem: (pedidoId, itemId) => {
    const pedido = get().pedidos.find(p => p.id === pedidoId);
    const item = pedido?.items.find(i => i.id === itemId);
    if (!item || item.estado !== 'pendiente') return false;
    set(s => ({
      pedidos: s.pedidos.map(p =>
        p.id === pedidoId ? { ...p, items: p.items.filter(i => i.id !== itemId) } : p
      ),
    }));
    return true;
  },

  actualizarItemEstado: (pedidoId, itemId, estado) => {
    set(s => ({
      pedidos: s.pedidos.map(p =>
        p.id === pedidoId
          ? { ...p, items: p.items.map(i => i.id === itemId ? { ...i, estado } : i) }
          : p
      ),
    }));
  },

  actualizarItemCantidad: (pedidoId, itemId, cantidad) => {
    const pedido = get().pedidos.find(p => p.id === pedidoId);
    const item = pedido?.items.find(i => i.id === itemId);
    if (!item || item.estado !== 'pendiente') return false;
    set(s => ({
      pedidos: s.pedidos.map(p =>
        p.id === pedidoId
          ? { ...p, items: p.items.map(i => i.id === itemId ? { ...i, cantidad } : i) }
          : p
      ),
    }));
    return true;
  },

  procesarPago: (pagoData) => {
    const pago: Pago = { ...pagoData, id: uid(), fecha: new Date().toISOString() };
    const pedido = get().pedidos.find(p => p.id === pagoData.pedidoId);
    set(s => ({
      pagos: [...s.pagos, pago],
      pedidos: s.pedidos.map(p =>
        p.id === pagoData.pedidoId
          ? { ...p, items: p.items.map(i => ({ ...i, estado: 'cobrado' as const })) }
          : p
      ),
      mesas: pedido
        ? s.mesas.map(m => m.id === pedido.mesaId ? { ...m, estado: 'disponible' as const } : m)
        : s.mesas,
    }));
  },

  addProducto: (p) => set(s => ({ productos: [...s.productos, { ...p, id: uid() }] })),
  updateProducto: (id, data) => set(s => ({
    productos: s.productos.map(p => p.id === id ? { ...p, ...data } : p),
  })),
  addMesa: (m) => set(s => ({ mesas: [...s.mesas, { ...m, id: uid() }] })),
  addUser: (u) => set(s => ({ users: [...s.users, { ...u, id: uid() }] })),
  addMovimientoCaja: (m) => set(s => ({
    movimientosCaja: [...s.movimientosCaja, { ...m, id: uid(), fecha: new Date().toISOString() }],
  })),
}));
