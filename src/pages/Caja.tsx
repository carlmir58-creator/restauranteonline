import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { CreditCard, DollarSign, ArrowRightLeft, CheckCircle } from 'lucide-react';
import { MetodoPago } from '@/types';
import { toast } from 'sonner';

const IMPUESTO_RATE = 0.16;

const Caja = () => {
  const { pedidos, mesas, productos, procesarPago } = useStore();
  const [selectedPedido, setSelectedPedido] = useState<string | null>(null);
  const [metodo, setMetodo] = useState<MetodoPago>('efectivo');
  const [recibido, setRecibido] = useState('');
  const [propina, setPropina] = useState('');
  const [referencia, setReferencia] = useState('');

  const pedidosActivos = pedidos.filter(p => p.items.some(i => i.estado !== 'cobrado'));

  const pedido = pedidosActivos.find(p => p.id === selectedPedido);
  const mesa = pedido ? mesas.find(m => m.id === pedido.mesaId) : null;

  const subtotal = pedido?.items.reduce((s, i) => s + i.precio * i.cantidad, 0) || 0;
  const impuesto = subtotal * IMPUESTO_RATE;
  const propinaVal = parseFloat(propina) || 0;
  const total = subtotal + impuesto + propinaVal;
  const recibidoVal = parseFloat(recibido) || 0;
  const cambio = recibidoVal - total;

  const handleCobrar = () => {
    if (!pedido) return;
    if (metodo === 'efectivo' && recibidoVal < total) {
      toast.error('El monto recibido es menor al total');
      return;
    }
    procesarPago({
      pedidoId: pedido.id,
      monto: total,
      impuesto,
      propina: propinaVal,
      metodo,
      recibido: metodo === 'efectivo' ? recibidoVal : undefined,
      cambio: metodo === 'efectivo' ? cambio : undefined,
      referencia: metodo === 'transferencia' ? referencia : undefined,
    });
    toast.success('Pago procesado exitosamente');
    setSelectedPedido(null);
    setRecibido('');
    setPropina('');
    setReferencia('');
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <CreditCard className="w-7 h-7 text-amber-400" />
        <h1 className="text-2xl font-bold text-foreground">Caja</h1>
      </div>

      <div className="flex gap-6 max-lg:flex-col">
        {/* Pedidos list */}
        <div className="flex-1">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Mesas con consumo</h2>
          {pedidosActivos.length === 0 ? (
            <div className="pos-card text-center py-8">
              <p className="text-muted-foreground">No hay mesas por cobrar</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {pedidosActivos.map(p => {
                const m = mesas.find(me => me.id === p.mesaId);
                const t = p.items.reduce((s, i) => s + i.precio * i.cantidad, 0);
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPedido(p.id)}
                    className={`pos-card text-left transition-all ${
                      selectedPedido === p.id ? 'border-primary ring-1 ring-primary' : 'hover:border-muted-foreground/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-foreground">Mesa #{m?.numero}</span>
                      <span className="text-lg font-bold text-primary">${t.toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{p.items.length} items</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Payment form */}
        {pedido && (
          <div className="w-full lg:w-[380px]">
            <div className="pos-card space-y-4">
              <h2 className="text-lg font-bold text-foreground">Mesa #{mesa?.numero}</h2>

              {/* Items detail */}
              <div className="space-y-1 max-h-40 overflow-auto">
                {pedido.items.map(item => {
                  const prod = productos.find(p => p.id === item.productoId);
                  return (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{prod?.nombre} ×{item.cantidad}</span>
                      <span className="text-foreground">${(item.precio * item.cantidad).toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-border pt-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">IVA (16%)</span>
                  <span className="text-foreground">${impuesto.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span className="text-muted-foreground">Propina</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={propina}
                    onChange={e => setPropina(e.target.value)}
                    className="w-20 text-right px-2 py-1 rounded bg-muted border border-border text-sm text-foreground"
                  />
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-border pt-2">
                  <span className="text-foreground">Total</span>
                  <span className="text-primary">${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment method */}
              <div className="flex gap-2">
                <button
                  onClick={() => setMetodo('efectivo')}
                  className={`flex-1 pos-btn text-sm ${metodo === 'efectivo' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                >
                  <DollarSign className="w-4 h-4" />
                  Efectivo
                </button>
                <button
                  onClick={() => setMetodo('transferencia')}
                  className={`flex-1 pos-btn text-sm ${metodo === 'transferencia' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  Transferencia
                </button>
              </div>

              {metodo === 'efectivo' ? (
                <div>
                  <label className="text-xs text-muted-foreground">Monto recibido</label>
                  <input
                    type="number"
                    value={recibido}
                    onChange={e => setRecibido(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-lg font-bold"
                    placeholder="0.00"
                  />
                  {recibidoVal > 0 && (
                    <div className={`mt-2 text-lg font-bold ${cambio >= 0 ? 'text-emerald-400' : 'text-destructive'}`}>
                      Cambio: ${cambio >= 0 ? cambio.toFixed(2) : '—'}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="text-xs text-muted-foreground">Referencia (opcional)</label>
                  <input
                    type="text"
                    value={referencia}
                    onChange={e => setReferencia(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm"
                    placeholder="Nro de referencia"
                  />
                </div>
              )}

              <button onClick={handleCobrar} className="pos-btn-primary w-full text-base">
                <CheckCircle className="w-5 h-5" />
                Cobrar ${total.toFixed(2)}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Caja;
