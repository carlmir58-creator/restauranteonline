import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

let _fetchPromise: Promise<void> | null = null;
import { 
  User, Mesa, Producto, Categoria, Pedido, PedidoDetalle, 
  Pago, MovimientoCaja, ItemEstado, MesaEstado, Configuracion,
  Restaurante
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
  restaurantes: Restaurante[];
  currentRestaurant: Restaurante | null;
  users: User[];
  mesas: Mesa[];
  productos: Producto[];
  categorias: Categoria[];
  pedidos: Pedido[];
  pagos: Pago[];
  movimientosCaja: MovimientoCaja[];
  configuraciones: Record<string, any>;
  isLoading: boolean;

  // Actions
  fetchInitialData: () => Promise<void>;
  fetchRestaurantes: () => Promise<void>;
  addRestaurante: (r: Omit<Restaurante, 'id' | 'created_at' | 'slug'> & { slug?: string }) => Promise<string | null>;
  updateRestaurante: (id: string, data: Partial<Restaurante>) => Promise<void>;
  
  // Mesa actions
  updateMesaEstado: (mesaId: string, estado: MesaEstado) => Promise<void>;

  // Pedido actions
  crearPedido: (mesaId: string, cliente?: string, observaciones?: string) => Promise<string | null>;
  agregarItem: (pedidoId: string, productoId: string, cantidad: number, notas?: string) => Promise<void>;
  eliminarItem: (pedidoId: string, itemId: string) => Promise<boolean>;
  actualizarItemEstado: (pedidoId: string, itemId: string, estado: ItemEstado) => Promise<void>;
  actualizarItemCantidad: (pedidoId: string, itemId: string, cantidad: number) => Promise<boolean>;
  actualizarItemNotas: (pedidoId: string, itemId: string, notas: string) => Promise<boolean>;

  // Pago actions
  procesarPago: (pago: Omit<Pago, 'id' | 'fecha'> & { recibido?: number; propina?: number }) => Promise<Pago | undefined>;

  // Admin actions
  addProducto: (p: Omit<Producto, 'id'>) => Promise<void>;
  updateProducto: (id: string, p: Partial<Producto>) => Promise<void>;
  addMesa: (m: Omit<Mesa, 'id'>) => Promise<void>;
  addUser: (u: Omit<User, 'id'>) => Promise<void>;
  updateUser: (id: string, changes: Partial<Pick<User, 'rol' | 'activo'>>) => Promise<void>;
  addMovimientoCaja: (m: Omit<MovimientoCaja, 'id' | 'fecha' | 'userId'>) => Promise<void>;
  updateConfiguracion: (key: string, value: any) => Promise<void>;
  createRestaurantAdmin: (email: string, password: string, nombre: string, restauranteId: string) => Promise<{ error: any }>;
  createStaffUser: (email: string, password: string, nombre: string, rol: Role, restauranteId?: string) => Promise<{ error: any }>;
  subscribeToChanges: () => () => void;
}

export const useStore = create<AppState>((set, get) => ({
  currentUser: null,
  restaurantes: [],
  currentRestaurant: null,
  users: [],
  mesas: [],
  productos: [],
  categorias: [],
  pedidos: [],
  pagos: [],
  movimientosCaja: [],
  configuraciones: {
    impresion_separada_barra: false,
    produccion_digital_habilitada: true,
  },
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'movimientos_caja' }, (payload) => {
        console.log('%c[Realtime] Evento en Movimientos:', 'color: #3ecf8e', payload);
        if (payload.eventType === 'INSERT') {
          const newMov = {
            id: payload.new.id,
            tipo: payload.new.tipo,
            monto: Number(payload.new.monto),
            descripcion: payload.new.descripcion,
            categoria: payload.new.categoria,
            fecha: payload.new.fecha,
            userId: payload.new.usuario_id
          };
          set(s => ({ movimientosCaja: [newMov, ...s.movimientosCaja] }));
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'configuraciones' }, (payload) => {
        console.log('%c[Realtime] Configuración actualizada:', 'color: #3ecf8e', payload);
        set(s => ({
          configuraciones: { ...s.configuraciones, [payload.new.key]: payload.new.value }
        }));
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
    if (_fetchPromise) return _fetchPromise;

    const promise = (async () => {
      const user = get().currentUser;
      if (!user) {
        set({ isLoading: false });
        _fetchPromise = null;
        return;
      }
      set({ isLoading: true });
      try {
        const restId = user?.restauranteId;
        const isSuper = user?.rol === 'super_admin';

        const filterByRest = <T,>(q: T & { eq: (col: string, val: any) => T }) => {
          if (!isSuper && restId) return q.eq('restaurante_id', restId);
          return q;
        };

        const [
          { data: mesas },
          { data: categorias },
          { data: productos },
          { data: perfiles },
          { data: pagos },
          { data: movimientos_caja },
          { data: configuraciones }
        ] = await Promise.all([
          filterByRest(supabase.from('mesas').select('*')).order('numero'),
          filterByRest(supabase.from('categorias').select('*')).order('orden_visual'),
          filterByRest(supabase.from('productos').select('*')).order('nombre'),
          filterByRest(supabase.from('perfiles').select('*')),
          filterByRest(supabase.from('pagos').select('*')).order('fecha', { ascending: false }),
          filterByRest(supabase.from('movimientos_caja').select('*')).order('fecha', { ascending: false }),
          filterByRest(supabase.from('configuraciones').select('*'))
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
              area: (cat?.nombre.toLowerCase().includes('bebida') || cat?.area_produccion === 'barra') ? 'barra' : 'cocina',
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
            activo: u.activo,
            restauranteId: u.restaurante_id,
          })),
          pagos: (pagos || []).map(p => ({
            id: p.id,
            pedidoId: p.pedido_id,
            montoTotal: Number(p.monto_total),
            metodoPago: p.metodo_pago,
            fecha: p.fecha
          })),
          movimientosCaja: (movimientos_caja || []).map(m => ({
            id: m.id,
            tipo: m.tipo,
            monto: Number(m.monto),
            descripcion: m.descripcion,
            categoria: m.categoria,
            fecha: m.fecha,
            userId: m.usuario_id
          })),
          configuraciones: (configuraciones || []).reduce((acc, c) => ({ ...acc, [c.key]: c.value }), {
            impresion_separada_barra: false,
            produccion_digital_habilitada: true,
          })
        });

        // Fetch active orders OR orders from today
        let pedidosQuery = supabase
          .from('pedidos')
          .select('*, pedido_detalles(*)')
          .or(`pagado.eq.false,fecha.gte.${new Date(new Date().setHours(0,0,0,0)).toISOString()}`);
        if (!isSuper && restId) {
          pedidosQuery = pedidosQuery.eq('restaurante_id', restId);
        }
        const { data: recentPedidos } = await pedidosQuery;

        if (recentPedidos) {
          set({
            pedidos: recentPedidos.map(p => ({
              id: p.id,
              mesaId: p.mesa_id,
              meseroId: p.mesero_id,
              fecha: p.fecha,
              cliente: p.cliente,
              observaciones: p.observaciones,
              pagado: p.pagado,
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
        _fetchPromise = null;
      }
    })();

    _fetchPromise = promise;
    return promise;
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
        data: { full_name: nombre },
        emailRedirectTo: window.location.origin
      }
    });
    if (error) return { error };
    return { error: null };
  },

  createRestaurantAdmin: async (email, password, nombre, restauranteId) => {
    const { data, error } = await supabase.auth.signUp({ 
      email, password,
      options: {
        data: { full_name: nombre },
        emailRedirectTo: window.location.origin
      }
    });
    if (error || !data.user) return { error: error || { message: 'Error al crear usuario' } };

    // Esperar a que el trigger cree el perfil
    let profile = null;
    for (let i = 0; i < 10; i++) {
      const { data: p } = await supabase
        .from('perfiles')
        .select('id')
        .eq('id', data.user.id)
        .single();
      if (p) { profile = p; break; }
      await new Promise(r => setTimeout(r, 500));
    }

    if (!profile) {
      // Si el trigger no creó el perfil, crearlo manualmente
      const { error: insertError } = await supabase.from('perfiles').insert({
        id: data.user.id,
        nombre,
        rol: 'admin',
        activo: true,
        restaurante_id: restauranteId,
      });
      if (insertError) return { error: insertError };
    } else {
      // Actualizar el perfil creado por el trigger
      const { error: updateError } = await supabase
        .from('perfiles')
        .update({ rol: 'admin', restaurante_id: restauranteId, nombre })
        .eq('id', data.user.id);
      if (updateError) return { error: updateError };
    }

    await get().fetchRestaurantes();
    return { error: null };
  },

  createStaffUser: async (email, password, nombre, rol, restauranteId) => {
    const restId = restauranteId || get().currentUser?.restauranteId;
    if (!restId) return { error: { message: 'No hay restaurante asignado' } };

    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: {
        data: { full_name: nombre },
        emailRedirectTo: window.location.origin
      }
    });
    if (error || !data.user) return { error: error || { message: 'Error al crear usuario' } };

    const { error: updateError } = await supabase
      .from('perfiles')
      .update({ rol, restaurante_id: restId, nombre })
      .eq('id', data.user.id);

    if (updateError) {
      const { error: insertError } = await supabase.from('perfiles').insert({
        id: data.user.id,
        nombre,
        rol,
        activo: true,
        restaurante_id: restId,
      });
      if (insertError) return { error: insertError };
    }

    await get().fetchInitialData();
    return { error: null };
  },

  signOut: async () => {
    // 1. Cerrar canales Realtime primero (evitar fugas con JWT viejo)
    try { supabase.removeAllChannels(); } catch { /* ignorar */ }
    // 2. Limpiar TODO el estado de Zustand
    set({
      currentUser: null, session: null, currentRestaurant: null,
      restaurantes: [], users: [], mesas: [], productos: [],
      categorias: [], pedidos: [], pagos: [], movimientosCaja: [],
      configuraciones: {}, isLoading: false
    });
    // 3. SignOut local en Supabase (él solo limpia localStorage internamente)
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      // Ignorar errores
    }
    // 4. Re-asegurar (por si el catch anterior falló silenciosamente)
    set({
      currentUser: null, session: null, currentRestaurant: null,
      restaurantes: [], users: [], mesas: [], productos: [],
      categorias: [], pedidos: [], pagos: [], movimientosCaja: [],
      configuraciones: {}, isLoading: false
    });
  },

  setSession: async (session) => {
    set({ session });
    if (session?.user) {
      const { data: profile, error: profileError } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (profile && !profileError) {
        const user: User = {
          id: profile.id,
          nombre: profile.nombre,
          rol: profile.rol,
          activo: profile.activo,
          restauranteId: profile.restaurante_id,
        };
        set({ currentUser: user });

        // If super_admin, fetch restaurants
        if (profile.rol === 'super_admin') {
          get().fetchRestaurantes();
        } else if (profile.restaurante_id) {
          // Fire-and-forget: no bloquear fetchInitialData
          supabase
            .from('restaurantes')
            .select('*')
            .eq('id', profile.restaurante_id)
            .single()
            .then(({ data: restaurant }) => {
              if (restaurant) set({ currentRestaurant: restaurant });
            });
        }
      } else {
        // Perfil no encontrado → limpiar sesión local (sin llamar a signOut para evitar deadlock del lock interno)
        set({ currentUser: null, currentRestaurant: null });
        try { supabase.removeAllChannels(); } catch { /* ignorar */ }
      }
    } else {
      set({ currentUser: null, currentRestaurant: null });
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
      observaciones,
      restaurante_id: get().currentUser?.restauranteId,
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
      estado: 'pendiente',
      restaurante_id: get().currentUser?.restauranteId,
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

  actualizarItemNotas: async (pedidoId, itemId, notas) => {
    const { error } = await supabase.from('pedido_detalles').update({ notas }).eq('id', itemId);
    if (error) return false;

    set(s => ({
      pedidos: s.pedidos.map(p =>
        p.id === pedidoId
          ? { ...p, items: p.items.map(i => i.id === itemId ? { ...i, notas } : i) }
          : p
      ),
    }));
    return true;
  },

  procesarPago: async (pagoData) => {
    const { data: pago, error } = await supabase.from('pagos').insert({
      pedido_id: pagoData.pedidoId,
      monto_total: pagoData.montoTotal,
      metodo_pago: pagoData.metodoPago,
      restaurante_id: get().currentUser?.restauranteId,
    }).select().single();

    if (error || !pago) {
      toast.error('Error al registrar el pago');
      return;
    }

    // Update all items as 'cobrado' and mark order as paid
    await Promise.all([
      supabase.from('pedidos').update({ pagado: true }).eq('id', pagoData.pedidoId),
      supabase.from('pedido_detalles').update({ estado: 'cobrado' }).eq('pedido_id', pagoData.pedidoId),
    ]);

    // Get pedido & mesa from store BEFORE removing from state
    const pedido = get().pedidos.find(p => p.id === pagoData.pedidoId);
    const mesa   = pedido ? get().mesas.find(m => m.id === pedido.mesaId) : null;

    if (pedido) {
      await get().updateMesaEstado(pedido.mesaId, 'disponible');
    }

    // Register in movimientos_caja
    await get().addMovimientoCaja({
      tipo: 'ingreso',
      monto: pagoData.montoTotal,
      descripcion: `Venta Mesa #${mesa?.numero ?? '?'} — Pedido ${pedido?.id.slice(0, 8).toUpperCase() ?? ''}`,
      categoria: 'venta'
    });

    const nuevoPago: Pago = {
      id: pago.id,
      pedidoId: pago.pedido_id,
      montoTotal: Number(pago.monto_total),
      metodoPago: pago.metodo_pago,
      fecha: pago.fecha
    };

    set(s => ({
      // No eliminamos el pedido, solo lo marcamos como pagado en el estado local 
      // para que aparezca en los historiales de los roles
      pedidos: s.pedidos.map(p => p.id === pagoData.pedidoId ? { ...p, pagado: true } : p),
      pagos: [nuevoPago, ...s.pagos]
    }));

    return nuevoPago;
  },

  addProducto: async (p) => {
    const { error } = await supabase.from('productos').insert({
      nombre: p.nombre,
      precio: p.precio,
      categoria_id: p.categoriaId,
      activo: p.activo,
      imagen_url: p.imagenUrl,
      restaurante_id: get().currentUser?.restauranteId,
    });
    if (!error) await get().fetchInitialData();
  },

  updateProducto: async (id, data) => {
    const { error } = await supabase.from('productos').update({
      nombre: data.nombre,
      precio: data.precio,
      categoria_id: data.categoriaId,
      activo: data.activo,
      disponible: data.disponible,
      imagen_url: data.imagenUrl
    }).eq('id', id);
    if (!error) await get().fetchInitialData();
  },

  addMesa: async (m) => {
    const { error } = await supabase.from('mesas').insert({
      ...m,
      restaurante_id: get().currentUser?.restauranteId,
    });
    if (!error) await get().fetchInitialData();
  },

  addUser: async (u) => {
    const { error } = await supabase.from('perfiles').insert({
      ...u,
      restaurante_id: get().currentUser?.restauranteId,
    });
    if (!error) await get().fetchInitialData();
  },

  updateUser: async (id, changes) => {
    const { error } = await supabase.from('perfiles').update(changes).eq('id', id);
    
    if (error) {
      console.error('Error Supabase:', error);
      toast.error('Error al actualizar: ' + (error.message || 'No tienes permisos suficientes'));
      return;
    }

    // Actualizar localmente en la lista de todos los usuarios
    set(s => ({
      users: s.users.map(u => u.id === id ? { ...u, ...changes } : u)
    }));

    // CRITICO: Si el usuario que estamos cambiando es el que tiene la sesión iniciada,
    // debemos actualizar su estado de currentUser también
    if (get().currentUser?.id === id) {
      set(s => ({
        currentUser: s.currentUser ? { ...s.currentUser, ...changes } : null
      }));
    }
    
    toast.success('Cambio guardado en la base de datos');
  },

  addMovimientoCaja: async (m) => {
    const { data, error } = await supabase.from('movimientos_caja').insert({
      tipo: m.tipo,
      monto: m.monto,
      descripcion: m.descripcion,
      categoria: m.categoria,
      usuario_id: get().currentUser?.id,
      restaurante_id: get().currentUser?.restauranteId,
    }).select().single();
    
    if (error) {
      console.error('Error al registrar movimiento de caja:', error);
      toast.error('Error al registrar gasto');
      return;
    }

    if (data) {
      const nuevoMov = {
        id: data.id,
        tipo: data.tipo,
        monto: Number(data.monto),
        descripcion: data.descripcion,
        categoria: data.categoria,
        fecha: data.fecha,
        userId: data.usuario_id
      };
      
      set(s => ({
        movimientosCaja: [nuevoMov, ...s.movimientosCaja]
      }));
      return nuevoMov;
    }
  },

  updateConfiguracion: async (key, value) => {
    const restId = get().currentUser?.restauranteId;
    let query = supabase.from('configuraciones').update({ value, updated_at: new Date().toISOString() }).eq('key', key);
    if (restId) query = query.eq('restaurante_id', restId);
    const { error } = await query;
    if (error) {
      toast.error('Error al actualizar configuración');
      return;
    }
    set(s => ({ configuraciones: { ...s.configuraciones, [key]: value } }));
  },

  // Restaurant actions
  fetchRestaurantes: async () => {
    const { data } = await supabase
      .from('restaurantes')
      .select('*')
      .order('nombre');
    if (data) {
      set({ restaurantes: data });
    }
  },

  addRestaurante: async (r) => {
    const slug = r.slug || r.nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const { data, error } = await supabase
      .from('restaurantes')
      .insert({
        nombre: r.nombre,
        slug,
        direccion: r.direccion,
        telefono: r.telefono,
        logo_url: r.logo_url,
        activo: r.activo ?? true,
      })
      .select()
      .single();

    if (error) {
      toast.error('Error al crear restaurante: ' + error.message);
      return null;
    }

    await get().fetchRestaurantes();
    return data?.id ?? null;
  },

  updateRestaurante: async (id, data) => {
    const { error } = await supabase
      .from('restaurantes')
      .update(data)
      .eq('id', id);

    if (error) {
      toast.error('Error al actualizar restaurante: ' + error.message);
      return;
    }

    await get().fetchRestaurantes();

    // Also update currentRestaurant if it's the same
    if (get().currentRestaurant?.id === id) {
      set(s => ({
        currentRestaurant: s.currentRestaurant ? { ...s.currentRestaurant, ...data } : null,
      }));
    }
  },
}));
