import { useStore } from '@/store/useStore';
import { Beer, Clock, PlayCircle, CheckCircle, History } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

type Tab = 'pendientes' | 'completados';

const Barra = () => {
  const { pedidos, mesas, productos, actualizarItemEstado } = useStore();
  const [tab, setTab] = useState<Tab>('pendientes');

  const hoy = new Date().toDateString();

  const barItems = pedidos.flatMap(pedido =>
    pedido.items
      .filter(item => {
        const prod = productos.find(p => p.id === item.productoId);
        return prod?.area === 'barra';
      })
      .map(item => ({
        ...item,
        pedido,
        mesa:    mesas.find(m => m.id === pedido.mesaId),
        producto: productos.find(p => p.id === item.productoId),
      }))
  );

  const pendientes   = barItems.filter(i => ['pendiente', 'en_preparacion', 'listo'].includes(i.estado));
  const completados  = barItems.filter(i =>
    (i.estado === 'entregado' || i.estado === 'cobrado') && 
    new Date(i.pedido.fecha).toDateString() === hoy
  ).sort((a,b) => new Date(b.pedido.fecha).getTime() - new Date(a.pedido.fecha).getTime());

  const handleIniciar = async (pedidoId: string, itemId: string) => {
    await actualizarItemEstado(pedidoId, itemId, 'en_preparacion');
    toast.success('Preparando bebida');
  };

  const handleListo = async (pedidoId: string, itemId: string) => {
    await actualizarItemEstado(pedidoId, itemId, 'listo');
    toast.success('¡Bebida lista!');
  };

  const handleEntregado = async (pedidoId: string, itemId: string, nombre?: string) => {
    await actualizarItemEstado(pedidoId, itemId, 'entregado');
    toast.success(`"${nombre || 'Bebida'}" entregada`);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Beer className="w-7 h-7 text-purple-400" />
          <h1 className="text-2xl font-bold text-foreground">Barra</h1>
        </div>

        <div className="flex bg-muted rounded-lg p-1 gap-1">
          <button
            onClick={() => setTab('pendientes')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              tab === 'pendientes' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Pendientes
            {pendientes.length > 0 && (
              <span className="bg-purple-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {pendientes.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('completados')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              tab === 'completados' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Entregados hoy
          </button>
        </div>
      </div>

      {tab === 'pendientes' && (
        pendientes.length === 0 ? (
          <div className="pos-card text-center py-12">
            <Beer className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground">No hay bebidas pendientes</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendientes.map(item => (
              <div key={item.id} className={`pos-card border-l-4 ${
                item.estado === 'pendiente' ? 'border-l-purple-400' : 
                item.estado === 'en_preparacion' ? 'border-l-purple-600' : 'border-l-emerald-500'
              }`}>
                <div className="flex items-center justify-between mb-3 text-sm">
                  <span className="font-bold">Mesa #{item.mesa?.numero}</span>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {new Date(item.pedido.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <p className="text-base font-semibold text-foreground">{item.producto?.nombre}</p>
                <p className="text-2xl font-bold text-purple-400">×{item.cantidad}</p>
                <div className="mt-3 flex gap-2">
                  {item.estado === 'pendiente' && (
                    <button onClick={() => handleIniciar(item.pedidoId, item.id)} className="pos-btn-secondary flex-1 text-xs">Preparar</button>
                  )}
                  {item.estado === 'en_preparacion' && (
                    <button onClick={() => handleListo(item.pedidoId, item.id)} className="pos-btn-primary flex-1 text-xs">¡Listo!</button>
                  )}
                  {item.estado === 'listo' && (
                    <button onClick={() => handleEntregado(item.pedidoId, item.id, item.producto?.nombre)} className="flex-1 pos-btn text-xs bg-emerald-500/20 text-emerald-400">Marcar Entregado</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'completados' && (
        completados.length === 0 ? (
          <div className="pos-card text-center py-12 text-muted-foreground">Todavía no has entregado nada hoy</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {completados.map(item => (
              <div key={item.id} className="pos-card opacity-70 border-l-4 border-l-emerald-500">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-bold">Mesa #{item.mesa?.numero}</span>
                  <span className="text-[9px] bg-emerald-500 text-white px-1.5 rounded uppercase">{item.estado}</span>
                </div>
                <p className="text-sm font-medium text-foreground">{item.producto?.nombre}</p>
                <p className="text-lg font-bold text-purple-400">×{item.cantidad}</p>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default Barra;
