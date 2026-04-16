import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { MesaEstado } from '@/types';
import { Plus, Users, ClipboardList, Clock, CheckCircle2, History } from 'lucide-react';
import NuevoPedido from '@/components/NuevoPedido';

const estadoConfig: Record<MesaEstado, { label: string; class: string }> = {
  disponible:    { label: 'Disponible',   class: 'status-available'    },
  ocupada:       { label: 'Ocupada',      class: 'status-occupied'     },
  en_cobro:      { label: 'En Cobro',     class: 'status-preparation'  },
  cerrada:       { label: 'Cerrada',      class: 'status-billed'       },
  reservada:     { label: 'Reservada',    class: 'status-delivered'    },
  mantenimiento: { label: 'Mantenimiento',class: 'status-billed'       },
};

type Tab = 'mesas' | 'mis_pedidos' | 'historial';

const Mesas = () => {
  const { mesas, pedidos, currentUser } = useStore();
  const [selectedMesa, setSelectedMesa] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('mesas');

  const getPedidoActivo = (mesaId: string) =>
    pedidos.find(p => p.mesaId === mesaId && !p.pagado);

  const hoy = new Date().toDateString();

  // Pedidos activos del mesero
  const misPedidosActivos = pedidos.filter(p =>
    p.meseroId === currentUser?.id && !p.pagado
  );

  // Historial de ventas del mesero (pagados hoy)
  const miHistorialVentas = pedidos.filter(p =>
    p.meseroId === currentUser?.id && 
    p.pagado && 
    new Date(p.fecha).toDateString() === hoy
  );

  const totalVentasMesero = miHistorialVentas.reduce((acc, p) => 
    acc + p.items.reduce((s, i) => s + (i.precio * i.cantidad), 0), 0
  );

  const estadoItemColors: Record<string, string> = {
    pendiente:      'bg-muted text-muted-foreground',
    en_preparacion: 'bg-amber-500/20 text-amber-400',
    listo:          'bg-emerald-500/20 text-emerald-400',
    entregado:      'bg-sky-500/20 text-sky-400',
    cobrado:        'bg-zinc-500/20 text-zinc-400',
  };

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestión de Mesas</h1>
          <p className="text-xs text-muted-foreground mt-1">
            {currentUser?.nombre} · Ventas hoy: <span className="text-emerald-400 font-bold">${totalVentasMesero.toFixed(2)}</span>
          </p>
        </div>
        
        <div className="flex bg-muted rounded-lg p-1 gap-1">
          <button
            onClick={() => setTab('mesas')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              tab === 'mesas' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="w-4 h-4" />
            Mesas
          </button>
          <button
            onClick={() => setTab('mis_pedidos')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              tab === 'mis_pedidos' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            Activos
            {misPedidosActivos.length > 0 && (
              <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full ml-1">
                {misPedidosActivos.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('historial')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              tab === 'historial' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <History className="w-4 h-4" />
            Ventas
            {miHistorialVentas.length > 0 && (
              <span className="bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">
                {miHistorialVentas.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {tab === 'mesas' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {mesas.map(mesa => {
            const cfg    = estadoConfig[mesa.estado];
            const pedido = getPedidoActivo(mesa.id);
            const total  = pedido ? pedido.items.reduce((s, i) => s + i.precio * i.cantidad, 0) : 0;
            const listos = pedido?.items.filter(i => i.estado === 'listo').length || 0;

            return (
              <button
                key={mesa.id}
                onClick={() => setSelectedMesa(mesa.id)}
                className="pos-card hover:border-primary/50 transition-all text-left group relative"
              >
                <div className="flex items-center justify-between mb-3 text-sm">
                  <span className="font-bold">Mesa #{mesa.numero}</span>
                  <span className={`w-3 h-3 rounded-full ${cfg.class}`} />
                </div>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-1">
                  <Users className="w-3 h-3" />
                  {mesa.capacidad} pers.
                </div>
                {pedido ? (
                  <div className="mt-2">
                    <p className="text-sm font-bold text-primary">${total.toFixed(2)}</p>
                    {listos > 0 && <p className="text-[10px] text-emerald-400 mt-1 animate-pulse font-bold">● {listos} LISTO</p>}
                  </div>
                ) : (
                  <p className="text-[10px] text-muted-foreground uppercase mt-2 tracking-wider">{cfg.label}</p>
                )}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-card/80 rounded-xl">
                  <Plus className="w-8 h-8 text-primary" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {tab === 'mis_pedidos' && (
        <div className="space-y-3">
          {misPedidosActivos.length === 0 ? (
            <div className="pos-card text-center py-12">
              <ClipboardList className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-30" />
              <p className="text-muted-foreground">No tienes pedidos activos</p>
            </div>
          ) : (
            misPedidosActivos.map(p => {
              const mesa = mesas.find(m => m.id === p.mesaId);
              const total = p.items.reduce((s, i) => s + i.precio * i.cantidad, 0);
              return (
                <div key={p.id} className="pos-card border-l-4 border-l-primary">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary">
                        #{mesa?.numero}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">Mesa #{mesa?.numero} {p.cliente && `· ${p.cliente}`}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3"/> {new Date(p.fecha).toLocaleTimeString()}</p>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-primary">${total.toFixed(2)}</p>
                  </div>
                  <div className="space-y-1">
                    {p.items.map(item => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.cantidad}x {useStore.getState().productos.find(pr => pr.id === item.productoId)?.nombre}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${estadoItemColors[item.estado]}`}>{item.estado}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => { setSelectedMesa(p.mesaId); setTab('mesas'); }} className="mt-3 w-full pos-btn-secondary text-xs py-1.5">
                    Gestionar Pedido
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {tab === 'historial' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2 px-1">
            <span>Ventas completadas hoy</span>
            <span className="font-bold text-emerald-400">${totalVentasMesero.toFixed(2)}</span>
          </div>
          {miHistorialVentas.length === 0 ? (
            <div className="pos-card text-center py-12">
              <History className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-30" />
              <p className="text-muted-foreground">Aún no has realizado ventas hoy</p>
            </div>
          ) : (
            miHistorialVentas.map(p => {
              const mesa = mesas.find(m => m.id === p.mesaId);
              const total = p.items.reduce((s, i) => s + i.precio * i.cantidad, 0);
              return (
                <div key={p.id} className="pos-card border-l-4 border-l-emerald-500 opacity-80">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center font-bold text-emerald-400">
                        #{mesa?.numero}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">Mesa #{mesa?.numero} {p.cliente && `· ${p.cliente}`}</p>
                        <p className="text-xs text-muted-foreground">{new Date(p.fecha).toLocaleTimeString()}</p>
                        <div className="flex items-center gap-1 text-[10px] text-emerald-400 mt-1">
                          <CheckCircle2 className="w-3 h-3" /> Cobrado
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-emerald-400">${total.toFixed(2)}</p>
                      <p className="text-[10px] text-muted-foreground">{p.items.length} items</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {selectedMesa && (
        <NuevoPedido mesaId={selectedMesa} onClose={() => setSelectedMesa(null)} />
      )}
    </div>
  );
};

export default Mesas;
