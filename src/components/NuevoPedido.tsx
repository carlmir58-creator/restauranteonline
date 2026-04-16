import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { X, Plus, Minus, Trash2, Send, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  mesaId: string;
  onClose: () => void;
}

const NuevoPedido = ({ mesaId, onClose }: Props) => {
  const {
    mesas, productos, categorias, pedidos,
    crearPedido, agregarItem, eliminarItem, actualizarItemCantidad, actualizarItemEstado
  } = useStore();

  const mesa = mesas.find(m => m.id === mesaId)!;
  const pedidoActivo = pedidos.find(p => p.mesaId === mesaId && p.items.some(i => i.estado !== 'cobrado'));

  const [filtroCategoria, setFiltroCategoria] = useState<string>('all');
  const [notas, setNotas] = useState('');
  const [cliente, setCliente] = useState('');

  // Temp cart for new items
  const [cart, setCart] = useState<{ productoId: string; cantidad: number; notas: string }[]>([]);

  const productosFiltrados = productos.filter(p =>
    p.activo && (filtroCategoria === 'all' || p.categoriaId === filtroCategoria)
  );

  const addToCart = (productoId: string) => {
    setCart(c => {
      const existing = c.find(i => i.productoId === productoId);
      if (existing) return c.map(i => i.productoId === productoId ? { ...i, cantidad: i.cantidad + 1 } : i);
      return [...c, { productoId, cantidad: 1, notas: '' }];
    });
  };

  const updateCartQty = (productoId: string, delta: number) => {
    setCart(c => c.map(i => {
      if (i.productoId !== productoId) return i;
      const newQty = i.cantidad + delta;
      return newQty > 0 ? { ...i, cantidad: newQty } : i;
    }).filter(i => i.cantidad > 0));
  };

  const removeFromCart = (productoId: string) => {
    setCart(c => c.filter(i => i.productoId !== productoId));
  };

  const handleEnviar = async () => {
    if (cart.length === 0 && !pedidoActivo) return;
    
    let pedidoId = pedidoActivo?.id;
    
    try {
      if (!pedidoId) {
        // AHORA ESPERAMOS a que Supabase nos devuelva el ID real
        pedidoId = await crearPedido(mesaId, cliente || undefined, notas || undefined) || undefined;
      }
      
      if (!pedidoId) {
        toast.error('No se pudo obtener un ID de pedido válido');
        return;
      }

      // Enviamos cada item uno por uno esperando su confirmación
      for (const item of cart) {
        await agregarItem(pedidoId, item.productoId, item.cantidad, item.notas);
      }

      setCart([]);
      onClose(); // Cerrar al terminar con éxito
      toast.success('Pedido enviado con éxito');
    } catch (error) {
      console.error('Error al procesar el envío:', error);
      toast.error('Hubo un error al procesar el pedido');
    }
  };

  const handleEliminarItem = (itemId: string) => {
    if (!pedidoActivo) return;
    const success = eliminarItem(pedidoActivo.id, itemId);
    if (!success) {
      toast.error('Este producto ya está en preparación y no puede modificarse');
    }
  };

  const handleModificarCantidad = (itemId: string, newQty: number) => {
    if (!pedidoActivo) return;
    if (newQty < 1) return;
    const success = actualizarItemCantidad(pedidoActivo.id, itemId, newQty);
    if (!success) {
      toast.error('Este producto ya está en preparación y no puede modificarse');
    }
  };

  const cartTotal = cart.reduce((s, i) => {
    const p = productos.find(pr => pr.id === i.productoId);
    return s + (p?.precio || 0) * i.cantidad;
  }, 0);

  const existingTotal = pedidoActivo?.items.reduce((s, i) => s + i.precio * i.cantidad, 0) || 0;

  const estadoColors: Record<string, string> = {
    pendiente: 'bg-muted text-muted-foreground',
    en_preparacion: 'status-preparation text-black',
    listo: 'status-ready text-white',
    entregado: 'status-delivered text-white',
    cobrado: 'status-billed text-white',
  };

  const estadoLabels: Record<string, string> = {
    pendiente: 'Pendiente',
    en_preparacion: 'Preparando',
    listo: 'Listo',
    entregado: 'Entregado',
    cobrado: 'Cobrado',
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-foreground">Mesa #{mesa.numero}</h2>
            <p className="text-xs text-muted-foreground">{pedidoActivo ? 'Pedido activo' : 'Nuevo pedido'}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden max-md:flex-col">
          {/* Product selection */}
          <div className="flex-1 flex flex-col overflow-hidden border-r border-border max-md:border-r-0 max-md:border-b">
            {/* Category filter */}
            <div className="flex gap-2 p-3 overflow-x-auto shrink-0 border-b border-border">
              <button
                onClick={() => setFiltroCategoria('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  filtroCategoria === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'
                }`}
              >
                Todos
              </button>
              {categorias.map(c => (
                <button
                  key={c.id}
                  onClick={() => setFiltroCategoria(c.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    filtroCategoria === c.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'
                  }`}
                >
                  {c.nombre}
                </button>
              ))}
            </div>

            {/* Products grid */}
            <div className="flex-1 overflow-auto p-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {productosFiltrados.map(p => {
                  const inCart = cart.find(i => i.productoId === p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => addToCart(p.id)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        inCart ? 'border-primary bg-primary/10' : 'border-border hover:border-muted-foreground/30 bg-muted/30'
                      }`}
                    >
                      <p className="text-sm font-medium text-foreground truncate">{p.nombre}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-sm font-bold text-primary">${p.precio.toFixed(2)}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${p.area === 'cocina' ? 'bg-orange-500/20 text-orange-400' : 'bg-purple-500/20 text-purple-400'}`}>
                          {p.area}
                        </span>
                      </div>
                      {inCart && (
                        <span className="text-xs text-primary font-semibold mt-1 block">×{inCart.cantidad}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Order summary */}
          <div className="w-full md:w-[320px] flex flex-col overflow-hidden">
            <div className="flex-1 overflow-auto p-3 space-y-2">
              {!pedidoActivo && (
                <input
                  type="text"
                  placeholder="Cliente (opcional)"
                  value={cliente}
                  onChange={e => setCliente(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground mb-2"
                />
              )}

              {/* Existing items */}
              {pedidoActivo?.items.map(item => {
                const prod = productos.find(p => p.id === item.productoId);
                const canEdit = item.estado === 'pendiente';
                return (
                  <div key={item.id} className="flex items-center gap-2 py-2 px-2 rounded-lg bg-muted/50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{prod?.nombre}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${estadoColors[item.estado]}`}>
                          {estadoLabels[item.estado]}
                        </span>
                        <span className="text-xs text-muted-foreground">${(item.precio * item.cantidad).toFixed(2)}</span>
                      </div>
                    </div>
                    {canEdit ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleModificarCantidad(item.id, item.cantidad - 1)} className="p-1 rounded bg-muted hover:bg-accent">
                          <Minus className="w-3 h-3 text-muted-foreground" />
                        </button>
                        <span className="text-sm font-medium text-foreground w-6 text-center">{item.cantidad}</span>
                        <button onClick={() => handleModificarCantidad(item.id, item.cantidad + 1)} className="p-1 rounded bg-muted hover:bg-accent">
                          <Plus className="w-3 h-3 text-muted-foreground" />
                        </button>
                        <button onClick={() => handleEliminarItem(item.id)} className="p-1 rounded hover:bg-destructive/20 ml-1">
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <AlertCircle className="w-3 h-3" />
                        ×{item.cantidad}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Cart items (new) */}
              {cart.length > 0 && (
                <>
                  {pedidoActivo && <div className="border-t border-border my-2" />}
                  <p className="text-xs text-muted-foreground font-medium">Nuevos items</p>
                  {cart.map(item => {
                    const prod = productos.find(p => p.id === item.productoId);
                    return (
                      <div key={item.productoId} className="flex items-center gap-2 py-2 px-2 rounded-lg bg-primary/5 border border-primary/20">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{prod?.nombre}</p>
                          <span className="text-xs text-muted-foreground">${((prod?.precio || 0) * item.cantidad).toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => updateCartQty(item.productoId, -1)} className="p-1 rounded bg-muted hover:bg-accent">
                            <Minus className="w-3 h-3 text-muted-foreground" />
                          </button>
                          <span className="text-sm font-medium text-foreground w-6 text-center">{item.cantidad}</span>
                          <button onClick={() => updateCartQty(item.productoId, 1)} className="p-1 rounded bg-muted hover:bg-accent">
                            <Plus className="w-3 h-3 text-muted-foreground" />
                          </button>
                          <button onClick={() => removeFromCart(item.productoId)} className="p-1 rounded hover:bg-destructive/20 ml-1">
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-border space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Existente</span>
                <span className="text-foreground font-medium">${existingTotal.toFixed(2)}</span>
              </div>
              {cartTotal > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Nuevos</span>
                  <span className="text-primary font-medium">+${cartTotal.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold border-t border-border pt-2">
                <span className="text-foreground">Total</span>
                <span className="text-foreground">${(existingTotal + cartTotal).toFixed(2)}</span>
              </div>
              <button
                onClick={handleEnviar}
                disabled={cart.length === 0}
                className="pos-btn-primary w-full"
              >
                <Send className="w-4 h-4" />
                Enviar Pedido
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NuevoPedido;
