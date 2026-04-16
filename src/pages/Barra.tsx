import { useStore } from '@/store/useStore';
import { Beer, Clock, PlayCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const Barra = () => {
  const { pedidos, mesas, productos, actualizarItemEstado } = useStore();

  const barItems = pedidos.flatMap(pedido =>
    pedido.items
      .filter(item => {
        const prod = productos.find(p => p.id === item.productoId);
        return prod?.area === 'barra' && ['pendiente', 'en_preparacion'].includes(item.estado);
      })
      .map(item => ({
        ...item,
        pedido,
        mesa: mesas.find(m => m.id === pedido.mesaId),
        producto: productos.find(p => p.id === item.productoId),
      }))
  );

  const handleIniciar = (pedidoId: string, itemId: string) => {
    actualizarItemEstado(pedidoId, itemId, 'en_preparacion');
    toast.success('Preparando bebida');
  };

  const handleListo = (pedidoId: string, itemId: string) => {
    actualizarItemEstado(pedidoId, itemId, 'listo');
    toast.success('¡Bebida lista!');
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Beer className="w-7 h-7 text-purple-400" />
        <h1 className="text-2xl font-bold text-foreground">Barra</h1>
        <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-sm font-medium">
          {barItems.length} items
        </span>
      </div>

      {barItems.length === 0 ? (
        <div className="pos-card text-center py-12">
          <Beer className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No hay bebidas pendientes en barra</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {barItems.map(item => (
            <div key={item.id} className={`pos-card border-l-4 ${
              item.estado === 'pendiente' ? 'border-l-purple-400' : 'border-l-purple-600'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-bold text-foreground">Mesa #{item.mesa?.numero}</span>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {new Date(item.pedido.fecha).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              <div className="mb-3">
                <p className="text-base font-semibold text-foreground">{item.producto?.nombre}</p>
                <p className="text-2xl font-bold text-purple-400">×{item.cantidad}</p>
                {item.notas && (
                  <p className="text-xs text-purple-300 mt-1 italic">📝 {item.notas}</p>
                )}
              </div>

              <div className="flex gap-2">
                {item.estado === 'pendiente' ? (
                  <button onClick={() => handleIniciar(item.pedidoId, item.id)} className="pos-btn-secondary flex-1 text-sm">
                    <PlayCircle className="w-4 h-4" />
                    Preparar
                  </button>
                ) : (
                  <button onClick={() => handleListo(item.pedidoId, item.id)} className="pos-btn-primary flex-1 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    ¡Listo!
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Barra;
