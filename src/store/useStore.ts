import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { 
  User, Mesa, Producto, Categoria, Pedido, PedidoDetalle, 
  Pago, MovimientoCaja, ItemEstado, MesaEstado 
} from '@/types';

interface AppState {
  // Auth
  currentUser: User | null;
  session: any | null;
  signIn: (email: string, pass: string) => Promise<{ error: any }>;
  signUp: (email: string, pass: string, name: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  setSession: (session: any) => Promise<void>;

  // Data
  users: User[];
  mesas: Mesa[];
  productos: Producto[];
  categorias: Categoria[];
  pedidos: Pedido[];
  pagos: Pago[];
  movimientosCaja: MovimientoCaja[];
  isLoading: boolean;

  // Actions
  fetchInitialData: () => Promise<void>;
  
  // Mesa actions
  updateMesaEstado: (mesaId: string, estado: MesaEstado) => Promise<void>;

  // Pedido actions
  crearPedido: (mesaId: string, cliente?: string, observaciones?: string) => Promise<string | null>;
  agregarItem: (pedidoId: string, productoId: string, cantidad: number, notas?: string) => Promise<void>;
  eliminarItem: (pedidoId: string, itemId: string) => Promise<boolean>;
  actualizarItemEstado: (pedidoId: string, itemId: string, estado: ItemEstado) => Promise<void>;
  actualizarItemCantidad: (pedidoId: string, itemId: string, cantidad: number) => Promise<boolean>;

  // Pago actions
  procesarPago: (pago: Omit<Pago, 'id' | 'fecha'>) => Promise<void>;

  // Admin actions
  addProducto: (p: Omit<Producto, 'id'>) => Promise<void>;
  updateProducto: (id: string, p: Partial<Producto>) => Promise<void>;
  addMesa: (m: Omit<Mesa, 'id'>) => Promise<void>;
  addUser: (u: Omit<User, 'id'>) => Promise<void>;
  updateUser: (id: string, changes: Partial<Pick<User, 'rol' | 'activo'>>) => Promise<void>;
  addMovimientoCaja: (m: Omit<MovimientoCaja, 'id' | 'fecha'>) => Promise<void>;
  subscribeToChanges: () => () => void;
}

export const useStore = create<AppState>((set, get) => ({
  currentUser: null,
  users: [],
  mesas: [],
  productos: [],
  categorias: [],
  pedidos: [],
  pagos: [],
  movimientosCaja: [],
  isLoading: false,

  subscribeToChanges: () => {
    console.log('%c[Supabase Realtime] Iniciando conexión...', 'color: #3ecf8e; font-weight: bold');
    
    const channel = supabase
      .channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mesas' }, (payload) => {
        console.log('%c[Realtime] Evento en Mesas:', 'color: #3ecf8e', payload);
        if (payload.eventType === 'UPDATE') {
          set(s => ({
            mesas: s.mesas.map(m => m.id === payload.new.id ? { ...m, ...payload.new } : m)
          }));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, (payload) => {
        console.log('%c[Realtime] Evento en Pedidos:', 'color: #3ecf8e', payload);
        if (payload.eventType === 'INSERT') {
          const exists = get().pedidos.some(p => p.id === payload.new.id);
          if (!exists) {
            const newPedido: Pedido = {
              id: payload.new.id,
              mesaId: payload.new.mesa_id,
              meseroId: payload.new.mesero_id,
              fecha: payload.new.fecha,
              cliente: payload.new.cliente,
              observaciones: payload.new.observaciones,
              items: []
            };
            set(s => ({ pedidos: [...s.pedidos, newPedido] }));
          }
        } else if (payload.eventType === 'UPDATE') {
          if (payload.new.pagado) {
            set(s => ({ pedidos: s.pedidos.filter(p => p.id !== payload.new.id) }));
          } else {
            set(s => ({
              pedidos: s.pedidos.map(p => p.id === payload.new.id ? { 
                ...p, 
                mesaId: payload.new.mesa_id, 
                cliente: payload.new.cliente,
                observaciones: payload.new.observaciones
              } : p)
            }));
          }
        } else if (payload.eventType === 'DELETE') {
          set(s => ({ pedidos: s.pedidos.filter(p => p.id !== payload.old.id) }));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedido_detalles' }, (payload) => {
        console.log('%c[Realtime] Evento en Detalles:', 'color: #3ecf8e', payload);
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const itemData = payload.new;
          const newItem: PedidoDetalle = {
            id: itemData.id,
            pedidoId: itemData.pedido_id,
            productoId: itemData.producto_id,
            cantidad: itemData.cantidad,
            notas: itemData.notas,
            estado: itemData.estado,
            precio: Number(itemData.precio_unitario)
          };
          
          set(s => {
            const pedidoIndex = s.pedidos.findIndex(p => p.id === itemData.pedido_id);
            if (pedidoIndex === -1) return s; // Si el pedido no existe aún en el store, ignorar
            
            const nuevoPedidos = [...s.pedidos];
            const pedido = { ...nuevoPedidos[pedidoIndex] };
            const existingItemIndex = pedido.items.findIndex(i => i.id === newItem.id);
            
            if (existingItemIndex > -1) {
              pedido.items[existingItemIndex] = newItem;
            } else {
              pedido.items = [...pedido.items, newItem];
            }
            
            nuevoPedidos[pedidoIndex] = pedido;
            return { pedidos: nuevoPedidos };
          });
        } else if (payload.eventType === 'DELETE') {
          set(s => ({
            pedidos: s.pedidos.map(p => ({
              ...p,
              items: p.items.filter(i => i.id !== payload.old.id)
            }))
          }));
        }
      })
      .subscribe((status) => {
        console.log('%c[Supabase Realtime] Estado:', 'color: #3ecf8e; font-weight: bold', status);
      });

    return () => {
      console.log('%c[Supabase Realtime] Cerrando...', 'color: #ef4444');
      supabase.removeChannel(channel);
    };
  },

  fetchInitialData: async () => {
    set({ isLoading: true });
    try {
      const [
        { data: mesas },
        { data: categorias },
        { data: productos },
        { data: perfiles },
        { data: pagos }
      ] = await Promise.all([
        supabase.from('mesas').select('*').order('numero'),
        supabase.from('categorias').select('*').order('orden_visual'),
        supabase.from('productos').select('*').order('nombre'),
        supabase.from('perfiles').select('*'),
        supabase.from('pagos').select('*').order('fecha', { ascending: false })
      ]);

      set({
        mesas: mesas || [],
        categorias: (categorias || []).map(c => ({
          id: c.id,
          nombre: c.nombre,
          color: c.color,
          ordenVisual: c.orden_visual,
          areaProduccion: c.area_produccion
        })),
        productos: (productos || []).map(p => {
          const cat = (categorias || []).find(c => c.id === p.categoria_id);
          return {
            id: p.id,
            nombre: p.nombre,
            descripcion: p.descripcion,
            precio: Number(p.precio),
            categoriaId: p.categoria_id,
            area: cat?.area_produccion || 'cocina', // Tomar área de la categoría
            activo: p.activo,
            imagenUrl: p.imagen_url,
            disponible: p.disponible,
            tiempoPreparacionMin: p.tiempo_preparacion_min,
            disponibleHoraInicio: p.disponible_hora_inicio,
            disponibleHoraFin: p.disponible_hora_fin
          };
        }),
        users: (perfiles || []).map(u => ({
          id: u.id,
          nombre: u.nombre,
          rol: u.rol,
          activo: u.activo
        })),
        pagos: (pagos || []).map(p => ({
          id: p.id,
          pedidoId: p.pedido_id,
          montoTotal: Number(p.monto_total),
          metodoPago: p.metodo_pago,
          fecha: p.fecha
        }))
      });

      // Fetch active orders (not paid)
      const { data: activePedidos } = await supabase
        .from('pedidos')
        .select('*, pedido_detalles(*)')
        .eq('pagado', false);

      if (activePedidos) {
        set({
          pedidos: activePedidos.map(p => ({
            id: p.id,
            mesaId: p.mesa_id,
            meseroId: p.mesero_id,
            fecha: p.fecha,
            cliente: p.cliente,
            observaciones: p.observaciones,
            items: p.pedido_detalles.map((d: any) => ({
              id: d.id,
              pedidoId: d.pedido_id,
              productoId: d.producto_id,
              cantidad: d.cantidad,
              notas: d.notas,
              estado: d.estado,
              precio: Number(d.precio_unitario)
            }))
          }))
        });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (userId) => {
    // This method is now legacy/unused but kept for temporary compatibility
    const user = get().users.find(u => u.id === userId);
    if (user) set({ currentUser: user });
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error };
    return { error: null };
  },

  signUp: async (email, password, nombre) => {
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: { full_name: nombre }
      }
    });
    if (error) return { error };
    return { error: null };
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ currentUser: null, session: null });
  },

  setSession: async (session) => {
    set({ session });
    if (session?.user) {
      const { data: profile } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (profile) {
        set({
          currentUser: {
            id: profile.id,
            nombre: profile.nombre,
            rol: profile.rol,
            activo: profile.activo
          }
        });
      }
    } else {
      set({ currentUser: null });
    }
  },

  logout: () => get().signOut(),

  updateMesaEstado: async (mesaId, estado) => {
    const { error } = await supabase.from('mesas').update({ estado }).eq('id', mesaId);
    if (!error) {
      set(s => ({ mesas: s.mesas.map(m => m.id === mesaId ? { ...m, estado } : m) }));
    }
  },

  crearPedido: async (mesaId, cliente, observaciones) => {
    console.log('Creando pedido para mesa:', mesaId);
    const { data, error } = await supabase.from('pedidos').insert({
      mesa_id: mesaId,
      mesero_id: get().currentUser?.id,
      cliente,
      observaciones
    }).select().single();

    if (error) {
      console.error('Error al crear pedido:', error);
      toast.error('No se pudo crear el pedido: ' + error.message);
      return null;
    }

    if (!data) return null;

    await get().updateMesaEstado(mesaId, 'ocupada');

    const nuovoPedido: Pedido = {
      id: data.id,
      mesaId: data.mesa_id,
      meseroId: data.mesero_id,
      fecha: data.fecha,
      cliente: data.cliente,
      observaciones: data.observaciones,
      items: []
    };

    set(s => ({ pedidos: [...s.pedidos, nuovoPedido] }));
    return data.id;
  },

  agregarItem: async (pedidoId, productoId, cantidad, notas) => {
    const producto = get().productos.find(p => p.id === productoId);
    if (!producto) {
      toast.error('Producto no encontrado en el catálogo');
      return;
    }

    console.log('Agregando item:', { pedidoId, productoId, cantidad });
    const { data, error } = await supabase.from('pedido_detalles').insert({
      pedido_id: pedidoId,
      producto_id: productoId,
      cantidad,
      notas: notas || '',
      precio_unitario: producto.precio,
      estado: 'pendiente'
    }).select().single();

    if (error) {
      console.error('Error al agregar item:', error);
      toast.error('Error al agregar producto: ' + error.message);
      return;
    }

    if (!data) return;

    const nuovoItem: PedidoDetalle = {
      id: data.id,
      pedidoId: data.pedido_id,
      productoId: data.producto_id,
      cantidad: data.cantidad,
      notas: data.notas,
      estado: data.estado,
      precio: Number(data.precio_unitario)
    };

    set(s => ({
      pedidos: s.pedidos.map(p =>
        p.id === pedidoId ? { ...p, items: [...p.items, nuovoItem] } : p
      ),
    }));
  },

  eliminarItem: async (pedidoId, itemId) => {
    const { error } = await supabase.from('pedido_detalles').delete().eq('id', itemId);
    if (error) return false;

    set(s => ({
      pedidos: s.pedidos.map(p =>
        p.id === pedidoId ? { ...p, items: p.items.filter(i => i.id !== itemId) } : p
      ),
    }));
    return true;
  },

  actualizarItemEstado: async (pedidoId, itemId, estado) => {
    const { error } = await supabase.from('pedido_detalles').update({ estado }).eq('id', itemId);
    if (!error) {
      set(s => ({
        pedidos: s.pedidos.map(p =>
          p.id === pedidoId
            ? { ...p, items: p.items.map(i => i.id === itemId ? { ...i, estado } : i) }
            : p
        ),
      }));
    }
  },

  actualizarItemCantidad: async (pedidoId, itemId, cantidad) => {
    const { error } = await supabase.from('pedido_detalles').update({ cantidad }).eq('id', itemId);
    if (error) return false;

    set(s => ({
      pedidos: s.pedidos.map(p =>
        p.id === pedidoId
          ? { ...p, items: p.items.map(i => i.id === itemId ? { ...i, cantidad } : i) }
          : p
      ),
    }));
    return true;
  },

  procesarPago: async (pagoData) => {
    const { data: pago, error } = await supabase.from('pagos').insert({
      pedido_id: pagoData.pedidoId,
      monto_total: pagoData.montoTotal,
      metodo_pago: pagoData.metodoPago
    }).select().single();

    if (error || !pago) return;

    // Update all items as 'cobrado', mark order as paid, and update mesa
    const { error: updateErrors } = await Promise.all([
      supabase.from('pedidos').update({ pagado: true }).eq('id', pagoData.pedidoId),
      supabase.from('pedido_detalles').update({ estado: 'cobrado' }).eq('pedido_id', pagoData.pedidoId),
    ]).then(([res1, res2]) => ({ error: res1.error || res2.error }));

    if (updateErrors) {
      toast.error('Error al actualizar el estado del pedido');
      return;
    }

    const pedido = get().pedidos.find(p => p.id === pagoData.pedidoId);
    if (pedido) {
      await get().updateMesaEstado(pedido.mesaId, 'disponible');
    }

    // Add to cash flow
    await get().addMovimientoCaja({
      tipo: 'ingreso',
      monto: pagoData.montoTotal,
      descripcion: `Venta Mesa ${mesa?.numero || '?'}, Pedido ${pedido?.id.slice(0,8)}`,
      categoria: 'venta'
    });

    set(s => ({
      pedidos: s.pedidos.filter(p => p.id !== pagoData.pedidoId),
      pagos: [
        {
          id: pago.id,
          pedidoId: pago.pedido_id,
          montoTotal: Number(pago.monto_total),
          metodoPago: pago.metodo_pago,
          fecha: pago.fecha
        },
        ...s.pagos
      ]
    }));
  },

  addProducto: async (p) => {
    const { error } = await supabase.from('productos').insert({
      nombre: p.nombre,
      precio: p.precio,
      categoria_id: p.categoriaId,
      area: p.area,
      activo: p.activo
    });
    if (!error) await get().fetchInitialData();
  },

  updateProducto: async (id, data) => {
    const { error } = await supabase.from('productos').update({
      nombre: data.nombre,
      precio: data.precio,
      categoria_id: data.categoriaId,
      area: data.area,
      activo: data.activo,
      disponible: data.disponible
    }).eq('id', id);
    if (!error) await get().fetchInitialData();
  },

  addMesa: async (m) => {
    const { error } = await supabase.from('mesas').insert(m);
    if (!error) await get().fetchInitialData();
  },

  addUser: async (u) => {
    // This usually requires Auth too, but for perfiles:
    const { error } = await supabase.from('perfiles').insert(u);
    if (!error) await get().fetchInitialData();
  },

  updateUser: async (id, changes) => {
    const { error } = await supabase.from('perfiles').update(changes).eq('id', id);
    if (error) {
      toast.error('Error al actualizar usuario: ' + error.message);
      return;
    }
    set(s => ({
      users: s.users.map(u => u.id === id ? { ...u, ...changes } : u)
    }));
  },

  addMovimientoCaja: async (m) => {
    const { error } = await supabase.from('movimientos_caja').insert({
      tipo: m.tipo,
      monto: m.monto,
      descripcion: m.descripcion,
      categoria: m.categoria,
      usuario_id: get().currentUser?.id
    });
    
    if (error) {
      console.error('Error al registrar movimiento de caja:', error);
    }
  },
}));
