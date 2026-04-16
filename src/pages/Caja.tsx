import { useState } from 'react';
import { useStore } from '@/store/useStore';
import {
  CreditCard, DollarSign, ArrowRightLeft, CheckCircle,
  History, Printer, Clock, Receipt
} from 'lucide-react';
import { MetodoPago, Pago } from '@/types';
import { toast } from 'sonner';
import { printReceipt } from '@/utils/print';

const IMPUESTO_RATE = 0.16;

type Tab = 'cobrar' | 'historial';

const Caja = () => {
  const { pedidos, mesas, productos, pagos, procesarPago, currentUser } = useStore();
  const [tab, setTab]                     = useState<Tab>('cobrar');
  const [selectedPedido, setSelectedPedido] = useState<string | null>(null);
  const [metodo, setMetodo]               = useState<MetodoPago>('efectivo');
  const [recibido, setRecibido]           = useState('');
  const [propina, setPropina]             = useState('');
  const [procesando, setProcesando]       = useState(false);

  // Pedidos activos (no pagados)
  const pedidosActivos = pedidos.filter(p => !p.pagado);

  const pedido = pedidosActivos.find(p => p.id === selectedPedido);
  const mesa   = pedido ? mesas.find(m => m.id === pedido.mesaId) : null;

  const subtotal    = pedido?.items.reduce((s, i) => s + i.precio * i.cantidad, 0) || 0;
  const impuesto    = subtotal * IMPUESTO_RATE;
  const propinaVal  = parseFloat(propina) || 0;
  const total       = subtotal + impuesto + propinaVal;
  const recibidoVal = parseFloat(recibido) || 0;
  const cambio      = recibidoVal - total;

  // Historial del día (pedidos ya pagados)
  const hoy = new Date().toDateString();
  const misPagosHoy = pagos.filter(p => new Date(p.fecha).toDateString() === hoy);
  const totalHoy = misPagosHoy.reduce((s, p) => s + p.montoTotal, 0);

  const handleCobrar = async () => {
    if (!pedido || !mesa) return;
    if (metodo === 'efectivo' && recibidoVal < total) {
      toast.error('Monto recibido insuficiente');
      return;
    }
    setProcesando(true);
    try {
      const nuevoPago = await procesarPago({
        pedidoId:   pedido.id,
        montoTotal: total,
        metodoPago: metodo,
        recibido:   recibidoVal,
        propina:    propinaVal,
      });

      if (nuevoPago) {
        printReceipt({
          pedido,
          mesa,
          productos,
          pago: { ...nuevoPago, recibido: recibidoVal, propina: propinaVal },
        });
      }

      toast.success('Cobro exitoso');
      setSelectedPedido(null);
      setRecibido('');
      setPropina('');
      setTab('historial');
    } catch (err) {
      toast.error('Error al cobrar');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="text-amber-400" /> Caja
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {currentUser?.nombre} · Hoy: <span className="text-emerald-400 font-bold">${totalHoy.toFixed(2)}</span>
          </p>
        </div>

        <div className="flex bg-muted rounded-lg p-1 gap-1">
          <button
            onClick={() => setTab('cobrar')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              tab === 'cobrar' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Receipt className="w-4 h-4" /> Cobrar
          </button>
          <button
            onClick={() => setTab('historial')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              tab === 'historial' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <History className="w-4 h-4" /> Historial
          </button>
        </div>
      </div>

      {tab === 'cobrar' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {pedidosActivos.length === 0 ? (
              <div className="pos-card text-center py-20 text-muted-foreground">
                No hay mesas pendientes de cobro
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {pedidosActivos.map(p => {
                  const m = mesas.find(me => me.id === p.mesaId);
                  const t = p.items.reduce((s, i) => s + i.precio * i.cantidad, 0);
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPedido(p.id)}
                      className={`pos-card text-left transition-all ${selectedPedido === p.id ? 'border-primary ring-1 ring-primary' : ''}`}
                    >
                      <div className="flex justify-between items-center decoration-primary">
                        <span className="text-lg font-bold">Mesa #{m?.numero}</span>
                        <span className="text-lg font-bold text-primary">${(t * 1.16).toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {p.items.length} items {p.cliente ? `· ${p.cliente}` : ''}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {pedido && (
            <div className="pos-card space-y-4 h-fit sticky top-6">
              <h2 className="text-xl font-bold border-b border-border pb-2">Mesa #{mesa?.numero}</h2>
              <div className="space-y-1 max-h-40 overflow-auto">
                {pedido.items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.cantidad}x {productos.find(pr => pr.id === item.productoId)?.nombre}</span>
                    <span>${(item.precio * item.cantidad).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-3 space-y-1">
                <div className="flex justify-between text-sm"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm"><span>IVA (16%)</span><span>${impuesto.toFixed(2)}</span></div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Propina</span>
                  <input type="number" value={propina} onChange={e=>setPropina(e.target.value)} className="w-20 bg-muted border border-border rounded px-2 text-right" placeholder="0" />
                </div>
                <div className="flex justify-between text-xl font-bold text-primary pt-2"><span>Total</span><span>${total.toFixed(2)}</span></div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {(['efectivo', 'tarjeta', 'transferencia'] as MetodoPago[]).map(m => (
                  <button key={m} onClick={()=>setMetodo(m)} className={`py-2 rounded text-[10px] uppercase font-bold border ${metodo === m ? 'bg-primary text-white border-primary' : 'bg-muted border-border'}`}>{m}</button>
                ))}
              </div>

              {metodo === 'efectivo' && (
                <input type="number" value={recibido} onChange={e=>setRecibido(e.target.value)} className="w-full bg-muted border-2 border-primary/20 rounded-lg p-3 text-2xl font-bold text-center" placeholder="Monto recibido" />
              )}
              {recibidoVal >= total && metodo === 'efectivo' && <div className="text-center font-bold text-emerald-400">Cambio: ${(recibidoVal - total).toFixed(2)}</div>}

              <button onClick={handleCobrar} disabled={procesando} className="w-full pos-btn-primary py-3 text-lg">{procesando ? 'Cargando...' : 'Confirmar Pago'}</button>
            </div>
          )}
        </div>
      )}

      {tab === 'historial' && (
        <div className="space-y-3">
          {misPagosHoy.length === 0 ? (
            <div className="pos-card text-center py-20 text-muted-foreground">No hay cobros registrados hoy</div>
          ) : (
            misPagosHoy.sort((a,b)=>new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).map(p => (
              <div key={p.id} className="pos-card flex justify-between items-center border-l-4 border-l-emerald-500">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center font-bold text-emerald-500">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold">Factura #{p.id.slice(0, 5).toUpperCase()}</p>
                    <p className="text-xs text-muted-foreground">{new Date(p.fecha).toLocaleTimeString()} · {p.metodoPago}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-emerald-400">${p.montoTotal.toFixed(2)}</p>
                  <button onClick={() => toast.info('Reimprimiendo...')} className="text-xs text-primary hover:underline">Reimprimir</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Caja;
