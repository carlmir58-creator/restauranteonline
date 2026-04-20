import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { ChefHat, Clock, PlayCircle, CheckCircle, History } from 'lucide-react';
import { toast } from 'sonner';

type Tab = 'pendientes' | 'completados';

const Cocina = () => {
  const { pedidos, mesas, productos, actualizarItemEstado } = useStore();
  const [tab, setTab] = useState<Tab>('pendientes');

  const hoy = new Date().toDateString();

  // Filtrar todos los items que corresponden a cocina
  const kitchenItems = pedidos.flatMap(pedido =>
    pedido.items
      .filter(item => {
        const prod = productos.find(p => p.id === item.productoId);
        return prod?.area === 'cocina';
      })
      .map(item => ({
        ...item,
        pedido,
        mesa: mesas.find(m => m.id === pedido.mesaId),
        producto: productos.find(p => p.id === item.productoId),
      }))
  );

  // Dividir por estado
  const pendientes  = kitchenItems.filter(i => ['pendiente', 'en_preparacion'].includes(i.estado));
  const completados = kitchenItems.filter(i => 
    ['listo', 'entregado', 'cobrado'].includes(i.estado) && 
    new Date(i.pedido.fecha).toDateString() === hoy
  ).sort((a,b) => new Date(b.pedido.fecha).getTime() - new Date(a.pedido.fecha).getTime());

  const handleIniciar = async (pedidoId: string, itemId: string) => {
    await actualizarItemEstado(pedidoId, itemId, 'en_preparacion');
    toast.success('Iniciado');
  };

  const handleListo = async (pedidoId: string, itemId: string) => {
    await actualizarItemEstado(pedidoId, itemId, 'listo');
    toast.success('¡Listo para entrega!');
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ChefHat className="w-7 h-7 text-orange-400" />
          <h1 className="text-2xl font-bold text-foreground">Cocina</h1>
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
              <span className="bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full">
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
            Completados hoy
          </button>
        </div>
      </div>

      {tab === 'pendientes' && (
        pendientes.length === 0 ? (
          <div className="pos-card text-center py-12">
            <ChefHat className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground">Todo en orden por aquí</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendientes.map(item => (
              <div key={item.id} className={`pos-card border-l-4 ${
                item.estado === 'pendiente' ? 'border-l-amber-500' : 'border-l-orange-500'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-bold text-foreground">Mesa #{item.mesa?.numero}</span>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {new Date(item.pedido.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-base font-semibold text-foreground">{item.producto?.nombre}</p>
                  <p className="text-2xl font-bold text-primary">×{item.cantidad}</p>
                  {item.notas && <p className="text-xs text-amber-500 mt-1 italic bg-amber-500/10 p-1 rounded">📝 {item.notas}</p>}
                  {item.pedido.observaciones && (
                    <div className="mt-2 text-[10px] bg-blue-500/10 text-blue-400 p-1.5 rounded border border-blue-500/20">
                      <span className="font-bold uppercase">Nota del Pedido:</span> {item.pedido.observaciones}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {item.estado === 'pendiente' ? (
                    <button onClick={() => handleIniciar(item.pedidoId, item.id)} className="pos-btn-secondary flex-1 text-sm">
                      <PlayCircle className="w-4 h-4" /> Iniciar
                    </button>
                  ) : (
                    <button onClick={() => handleListo(item.pedidoId, item.id)} className="pos-btn-primary flex-1 text-sm">
                      <CheckCircle className="w-4 h-4" /> ¡Listo!
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'completados' && (
        completados.length === 0 ? (
          <div className="pos-card text-center py-12">
            <History className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground">No has terminado platos hoy aún</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {completados.map(item => (
              <div key={item.id} className="pos-card opacity-70 border-l-4 border-l-emerald-500">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-sm font-bold">Mesa #{item.mesa?.numero}</span>
                  <span className="text-[10px] text-emerald-400 font-bold uppercase">{item.estado}</span>
                </div>
                <p className="text-sm text-foreground">{item.producto?.nombre}</p>
                <p className="text-lg font-bold text-muted-foreground">×{item.cantidad}</p>
                <div className="mt-2 text-[10px] text-muted-foreground flex justify-between">
                  <span>Pedido: {new Date(item.pedido.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default Cocina;
