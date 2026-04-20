import { useState } from 'react';
import { useStore } from '@/store/useStore';
import {
  CreditCard, DollarSign, ArrowRightLeft, CheckCircle,
  History, Printer, Clock, Receipt, Banknote, Trash2, Send
} from 'lucide-react';
import { MetodoPago, Pago } from '@/types';
import { toast } from 'sonner';
import { printReceipt, printEgreso } from '@/utils/print';

const IMPUESTO_RATE = 0.16;

type Tab = 'cobrar' | 'historial' | 'egresos';

const Caja = () => {
  const { 
    pedidos, mesas, productos, pagos, movimientosCaja, 
    procesarPago, addMovimientoCaja, currentUser 
  } = useStore();
  const [tab, setTab]                     = useState<Tab>('cobrar');
  const [selectedPedido, setSelectedPedido] = useState<string | null>(null);
  const [metodo, setMetodo]               = useState<MetodoPago>('efectivo');
  const [recibido, setRecibido]           = useState('');
  const [propina, setPropina]             = useState('');
  const [procesando, setProcesando]       = useState(false);

  // Estados para nuevo egreso
  const [montoEgreso, setMontoEgreso] = useState('');
  const [descEgreso, setDescEgreso]   = useState('');
  const [catEgreso, setCatEgreso]     = useState('gasto');

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

  // Egresos del día
  const egresosHoy = movimientosCaja.filter(m => 
    m.tipo === 'egreso' && new Date(m.fecha).toDateString() === hoy
  );
  const totalEgresosHoy = egresosHoy.reduce((s, m) => s + m.monto, 0);

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

  const handleRegistrarEgreso = async (e: React.FormEvent) => {
    e.preventDefault();
    const monto = parseFloat(montoEgreso);
    if (isNaN(monto) || monto <= 0 || !descEgreso) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    setProcesando(true);
    try {
      const mov = await addMovimientoCaja({
        tipo: 'egreso',
        monto,
        descripcion: descEgreso,
        categoria: catEgreso as any
      });

      if (mov) {
        toast.success('Egreso registrado correctamente');
        printEgreso({
          ...mov,
          usuarioNombre: currentUser?.nombre
        });
        setMontoEgreso('');
        setDescEgreso('');
      }
    } catch (error) {
      toast.error('Error al registrar egreso');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground">
            <CreditCard className="text-amber-400" /> Caja / POS
          </h1>
          <div className="flex flex-wrap gap-4 mt-1">
            <p className="text-xs text-muted-foreground">
              Ingresos hoy: <span className="text-emerald-400 font-bold">${totalHoy.toFixed(2)}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Egresos hoy: <span className="text-rose-400 font-bold">${totalEgresosHoy.toFixed(2)}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Balance: <span className={`font-bold ${(totalHoy - totalEgresosHoy) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>${(totalHoy - totalEgresosHoy).toFixed(2)}</span>
            </p>
          </div>
        </div>

        <div className="flex bg-muted rounded-lg p-1 gap-1">
          <button
            onClick={() => setTab('cobrar')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              tab === 'cobrar' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Receipt className="w-4 h-4" /> Cobrar
          </button>
          <button
            onClick={() => setTab('egresos')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              tab === 'egresos' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Banknote className="w-4 h-4" /> Egresos
          </button>
          <button
            onClick={() => setTab('historial')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
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
                      className={`pos-card text-left transition-all ${selectedPedido === p.id ? 'border-primary ring-1 ring-primary shadow-lg scale-[1.02]' : ''}`}
                    >
                      <div className="flex justify-between items-center decoration-primary">
                        <span className="text-lg font-bold">Mesa #{m?.numero}</span>
                        <span className="text-lg font-bold text-primary">${(t * (1 + IMPUESTO_RATE)).toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {p.items.length} productos {p.cliente ? `· ${p.cliente}` : ''}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="relative">
            {pedido ? (
              <div className="pos-card space-y-4 h-fit sticky top-6">
                <h2 className="text-xl font-bold border-b border-border pb-2">Mesa #{mesa?.numero}</h2>
                <div className="space-y-1 max-h-40 overflow-auto pr-1">
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
                    <input type="number" value={propina} onChange={e=>setPropina(e.target.value)} className="w-20 bg-muted border border-border rounded px-2 text-right py-1" placeholder="0" />
                  </div>
                  <div className="flex justify-between text-xl font-bold text-primary pt-2"><span>Total</span><span>${total.toFixed(2)}</span></div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {(['efectivo', 'tarjeta', 'transferencia'] as MetodoPago[]).map(m => (
                    <button key={m} onClick={()=>setMetodo(m)} className={`py-2 rounded text-[10px] uppercase font-bold border transition-colors ${metodo === m ? 'bg-primary text-white border-primary shadow-sm' : 'bg-muted border-border hover:bg-accent'}`}>{m}</button>
                  ))}
                </div>

                {metodo === 'efectivo' && (
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground px-1">Efectivo recibido</label>
                    <input type="number" value={recibido} onChange={e=>setRecibido(e.target.value)} className="w-full bg-muted border-2 border-primary/20 rounded-lg p-3 text-2xl font-bold text-center focus:border-primary focus:outline-none transition-all" placeholder="0.00" />
                    {recibidoVal >= total && <div className="text-center font-bold text-emerald-400 bg-emerald-500/10 py-2 rounded-lg animate-in fade-in slide-in-from-top-1">Cambio: ${(recibidoVal - total).toFixed(2)}</div>}
                  </div>
                )}

                <button onClick={handleCobrar} disabled={procesando} className="w-full pos-btn-primary py-3 text-lg h-14">{procesando ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Procesando
                  </div>
                ) : 'Confirmar Pago'}</button>
              </div>
            ) : (
              <div className="pos-card h-64 flex flex-col items-center justify-center text-center text-muted-foreground border-dashed">
                <Receipt className="w-12 h-12 mb-2 opacity-20" />
                <p>Selecciona una mesa<br/>para gestionar el pago</p>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'historial' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section>
              <h3 className="text-sm font-bold text-muted-foreground mb-4 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" /> Ingresos de hoy
              </h3>
              <div className="space-y-2">
                {misPagosHoy.length === 0 ? (
                  <div className="pos-card text-center py-10 text-muted-foreground text-sm">No hay cobros registrados</div>
                ) : (
                  misPagosHoy.sort((a,b)=>new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).map(p => (
                    <div key={p.id} className="pos-card flex justify-between items-center border-l-4 border-l-emerald-500 p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center font-bold text-emerald-500">
                          <DollarSign className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold">Fact #ID-{p.id.slice(0, 4).toUpperCase()}</p>
                          <p className="text-[10px] text-muted-foreground">{new Date(p.fecha).toLocaleTimeString()} · {p.metodoPago}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-bold text-emerald-400">${p.montoTotal.toFixed(2)}</p>
                        <button onClick={() => toast.info('Reimprimiendo...')} className="text-[10px] text-primary hover:underline">Imprimir</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section>
              <h3 className="text-sm font-bold text-muted-foreground mb-4 flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-400" /> Egresos de hoy
              </h3>
              <div className="space-y-2">
                {egresosHoy.length === 0 ? (
                  <div className="pos-card text-center py-10 text-muted-foreground text-sm">No hay egresos registrados</div>
                ) : (
                  egresosHoy.map(m => (
                    <div key={m.id} className="pos-card flex justify-between items-center border-l-4 border-l-rose-500 p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center font-bold text-rose-500">
                          <Banknote className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold truncate">{m.descripcion}</p>
                          <p className="text-[10px] text-muted-foreground">{new Date(m.fecha).toLocaleTimeString()} · {m.categoria}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-bold text-rose-400">-${m.monto.toFixed(2)}</p>
                        <button onClick={() => printEgreso({...m, usuarioNombre: currentUser?.nombre})} className="text-[10px] text-rose-400 hover:underline">Voucher</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      )}

      {tab === 'egresos' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="pos-card">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Banknote className="text-rose-400" /> Registrar Gasto / Egreso
            </h2>
            <form onSubmit={handleRegistrarEgreso} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground px-1">Monto del Pago</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input 
                      type="number" 
                      step="0.01"
                      value={montoEgreso} 
                      onChange={e => setMontoEgreso(e.target.value)} 
                      placeholder="0.00"
                      className="w-full bg-muted border border-border rounded-lg pl-9 pr-4 py-2.5 text-lg font-bold" 
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground px-1">Categoría</label>
                  <select 
                    value={catEgreso} 
                    onChange={e => setCatEgreso(e.target.value)}
                    className="w-full bg-muted border border-border rounded-lg px-3 py-2.5"
                  >
                    <option value="gasto">General / Gastos</option>
                    <option value="nomina">Nómina / Sueldos</option>
                    <option value="transporte">Transporte / Domicilios</option>
                    <option value="retiro">Retiro de Caja (Socio)</option>
                    <option value="otros">Otros Gastos Diversos</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-muted-foreground px-1">Descripción / Concepto</label>
                <textarea 
                  value={descEgreso} 
                  onChange={e => setDescEgreso(e.target.value)} 
                  placeholder="Ej: Pago factura de servicios, Adelanto de sueldos Jorge, etc."
                  rows={3}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm"
                />
              </div>

              <button 
                type="submit" 
                disabled={procesando} 
                className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {procesando ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Registrar e Imprimir Voucher
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="pos-card bg-rose-500/5 border-rose-500/20">
            <p className="text-xs text-rose-400 italic">
              <strong>Aviso:</strong> Todos los egresos registrados aquí descontarán del balance total del día y quedarán registrados para el arqueo de caja final.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Caja;
