import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { X, Plus, Minus, Trash2, Send, AlertCircle, Printer, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { printComanda } from '@/utils/print';

interface Props {
  mesaId: string;
  onClose: () => void;
}

const NuevoPedido = ({ mesaId, onClose }: Props) => {
  const {
    mesas, productos, categorias, pedidos, currentUser, configuraciones,
    crearPedido, agregarItem, eliminarItem, actualizarItemCantidad, actualizarItemEstado
  } = useStore();

  const mesa = mesas.find(m => m.id === mesaId)!;
  const pedidoActivo = pedidos.find(p =>
    p.mesaId === mesaId && p.items.some(i => i.estado !== 'cobrado')
  );

  const [filtroCategoria, setFiltroCategoria] = useState<string>('all');
  const [notas, setNotas]     = useState('');
  const [cliente, setCliente] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [lastSentIds, setLastSentIds] = useState<string[]>([]); // IDs recién enviados
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState('');

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

  const removeFromCart = (productoId: string) => setCart(c => c.filter(i => i.productoId !== productoId));

  const cartTotal    = cart.reduce((s, i) => s + (productos.find(p => p.id === i.productoId)?.precio || 0) * i.cantidad, 0);
  const existingTotal = pedidoActivo?.items.reduce((s, i) => s + i.precio * i.cantidad, 0) || 0;

  // ── Enviar / agregar ítems ─────────────────────────────────────────────────
  const handleEnviar = async () => {
    if (cart.length === 0) return;
    setEnviando(true);

    try {
      let pedidoId = pedidoActivo?.id;

      if (!pedidoId) {
        pedidoId = await crearPedido(mesaId, cliente || undefined, notas || undefined) || undefined;
      }

      if (!pedidoId) {
        toast.error('No se pudo crear el pedido');
        setEnviando(false);
        return;
      }

      const insertedIds: string[] = [];
      for (const item of cart) {
        await agregarItem(pedidoId, item.productoId, item.cantidad, item.notas);
      }

      // Refresh pedidoActivo from store to get new item IDs
      const updatedPedido = useStore.getState().pedidos.find(p => p.id === pedidoId);
      if (updatedPedido) {
        // IDs recién añadidos = los que no existían antes en pedidoActivo
        const oldIds = new Set(pedidoActivo?.items.map(i => i.id) ?? []);
        const newIds = updatedPedido.items.filter(i => !oldIds.has(i.id)).map(i => i.id);
        setLastSentIds(newIds);

        // Auto‑imprimir comanda
        printComanda({
          pedido: updatedPedido,
          mesa,
          productos,
          meseroNombre: currentUser?.nombre,
          nuevosIds: newIds,
        }, configuraciones.impresion_separada_barra);
      }

      setCart([]);
      toast.success('✅ Pedido enviado — imprimiendo comanda…');
    } catch (err) {
      console.error(err);
      toast.error('Error al procesar el pedido');
    } finally {
      setEnviando(false);
    }
  };

  // ── Reimprimir comanda ────────────────────────────────────────────────────
  const handleReimprimir = () => {
    if (!pedidoActivo) return;
    printComanda({
      pedido: pedidoActivo,
      mesa,
      productos,
      meseroNombre: currentUser?.nombre,
    }, configuraciones.impresion_separada_barra);
    toast.success('Reimprimiendo comanda…');
  };

  const handleEliminarItem = async (itemId: string) => {
    if (!pedidoActivo) return;
    const ok = await eliminarItem(pedidoActivo.id, itemId);
    if (!ok) toast.error('Este producto ya está en preparación');
  };

  const handleModificarCantidad = async (itemId: string, newQty: number) => {
    if (!pedidoActivo || newQty < 1) return;
    const ok = await actualizarItemCantidad(pedidoActivo.id, itemId, newQty);
    if (!ok) toast.error('Este producto ya está en preparación');
  };

  const estadoColors: Record<string, string> = {
    pendiente:       'bg-muted text-muted-foreground',
    en_preparacion:  'bg-amber-500/20 text-amber-400',
    listo:           'bg-emerald-500/20 text-emerald-400',
    entregado:       'bg-sky-500/20 text-sky-400',
    cobrado:         'bg-zinc-500/20 text-zinc-400',
  };

  const estadoLabels: Record<string, string> = {
    pendiente:       'Pendiente',
    en_preparacion:  'Preparando',
    listo:           '¡Listo!',
    entregado:       'Entregado',
    cobrado:         'Cobrado',
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-foreground">Mesa #{mesa.numero}</h2>
            <p className="text-xs text-muted-foreground">
              {pedidoActivo ? `Pedido activo · ${pedidoActivo.items.length} items` : 'Nuevo pedido'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {pedidoActivo && (
              <button
                onClick={handleReimprimir}
                title="Reimprimir comanda"
                className="p-2 rounded-lg hover:bg-muted text-muted-foreground flex items-center gap-1 text-xs"
              >
                <Printer className="w-4 h-4" />
                Comanda
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>
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
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                          p.area === 'cocina' ? 'bg-orange-500/20 text-orange-400' : 'bg-purple-500/20 text-purple-400'
                        }`}>
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

              {/* Client input (solo pedido nuevo) */}
              {/* Client & Observations (solo pedido nuevo) */}
              {!pedidoActivo && (
                <div className="space-y-2 mb-3 bg-muted/20 p-2 rounded-lg border border-border/50">
                  <input
                    type="text"
                    placeholder="Cliente (opcional)"
                    value={cliente}
                    onChange={e => setCliente(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground"
                  />
                  <textarea
                    placeholder="Observaciones generales (Ej: Llevar todo al tiempo, sin cubiertos...)"
                    value={notas}
                    onChange={e => setNotas(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground h-16 resize-none focus:ring-1 ring-primary/30"
                  />
                </div>
              )}

              {/* Existing items */}
              {pedidoActivo?.items.map(item => {
                const prod = productos.find(p => p.id === item.productoId);
                const canEdit = item.estado === 'pendiente';
                const isNew   = lastSentIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-2 py-2 px-2 rounded-lg transition-all ${
                      isNew ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-muted/50'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate flex items-center gap-1">
                        {isNew && <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />}
                        {prod?.nombre}
                      </p>
                      {editingNoteId === item.id ? (
                        <div className="flex items-center gap-1 mt-1 animate-in fade-in slide-in-from-top-1">
                          <input 
                            autoFocus
                            type="text" 
                            className="text-[10px] bg-background border border-primary/50 rounded px-1.5 py-0.5 flex-1 focus:outline-none"
                            value={tempNote}
                            onChange={e => setTempNote(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                useStore.getState().actualizarItemNotas(pedidoActivo.id, item.id, tempNote);
                                setEditingNoteId(null);
                              }
                              if (e.key === 'Escape') setEditingNoteId(null);
                            }}
                          />
                          <button 
                            onClick={() => {
                              useStore.getState().actualizarItemNotas(pedidoActivo.id, item.id, tempNote);
                              setEditingNoteId(null);
                            }}
                            className="bg-primary/20 text-primary p-0.5 rounded"
                          >
                            <Send className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <>
                          {item.notas ? (
                            <p 
                              onClick={() => {
                                setEditingNoteId(item.id);
                                setTempNote(item.notas);
                              }}
                              className="text-[10px] text-amber-500 italic bg-amber-500/10 px-1 rounded cursor-pointer hover:bg-amber-500/20 transition-colors"
                            >
                              📝 {item.notas}
                            </p>
                          ) : canEdit && (
                            <button 
                              onClick={() => {
                                setEditingNoteId(item.id);
                                setTempNote('');
                              }}
                              className="text-[10px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                            >
                              + agregar nota
                            </button>
                          )}
                        </>
                      )}
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
                       <div className="flex items-center gap-3">
                         {!configuraciones.produccion_digital_habilitada && (item.estado === 'pendiente' || item.estado === 'en_preparacion') && (
                           <button
                             onClick={() => actualizarItemEstado(pedidoActivo.id, item.id, 'listo')}
                             className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded hover:bg-emerald-500/20 transition-all font-bold uppercase"
                           >
                             Listo
                           </button>
                         )}
                         <div className="flex items-center gap-1 text-xs text-muted-foreground">
                           <AlertCircle className="w-3 h-3" />
                           ×{item.cantidad}
                         </div>
                       </div>
                     )}
                   </div>
                );
              })}

              {/* New cart items */}
              {cart.length > 0 && (
                <>
                  {pedidoActivo && <div className="border-t border-border my-2" />}
                  <p className="text-xs text-muted-foreground font-medium">Nuevos items</p>
                  {cart.map((item, index) => {
                    const prod = productos.find(p => p.id === item.productoId);
                    return (
                      <div key={`${item.productoId}-${index}`} className="flex flex-col gap-2 py-2 px-2 rounded-lg bg-primary/5 border border-primary/20">
                        <div className="flex items-center gap-2">
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
                        <input
                          type="text"
                          placeholder="Notas o modificaciones..."
                          value={item.notas}
                          onChange={e => {
                            const newNotas = e.target.value;
                            setCart(c => c.map((i, idx) => idx === index ? { ...i, notas: newNotas } : i));
                          }}
                          className="text-xs bg-card/50 border-border/50 border rounded px-2 py-1 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                        />
                      </div>
                    );
                  })}
                </>
              )}

              {!pedidoActivo && cart.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Selecciona productos del menú
                </div>
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
                disabled={cart.length === 0 || enviando}
                className="pos-btn-primary w-full disabled:opacity-40"
              >
                {enviando ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Enviar + Imprimir Comanda
                  </>
                )}
              </button>

              {/* Botón auxiliar: solo cerrar */}
              <button
                onClick={onClose}
                className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
              >
                Cerrar ventana
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NuevoPedido;
