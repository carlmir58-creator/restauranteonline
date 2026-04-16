import { useStore } from '@/store/useStore';
import { BarChart3, DollarSign, ShoppingBag, Coffee } from 'lucide-react';

const Dashboard = () => {
  const { pedidos, pagos, mesas, productos } = useStore();

  const mesasOcupadas = mesas.filter(m => m.estado === 'ocupada').length;
  const pedidosActivos = pedidos.filter(p => p.items.some(i => i.estado !== 'cobrado')).length;
  const ventasHoy = pagos
    .filter(p => new Date(p.fecha).toDateString() === new Date().toDateString())
    .reduce((acc, p) => acc + p.monto, 0);
  const productosActivos = productos.filter(p => p.activo).length;

  const stats = [
    { label: 'Ventas Hoy', value: `$${ventasHoy.toFixed(2)}`, icon: <DollarSign className="w-5 h-5" />, color: 'text-emerald-400' },
    { label: 'Pedidos Activos', value: pedidosActivos, icon: <ShoppingBag className="w-5 h-5" />, color: 'text-primary' },
    { label: 'Mesas Ocupadas', value: `${mesasOcupadas}/${mesas.length}`, icon: <Coffee className="w-5 h-5" />, color: 'text-amber-400' },
    { label: 'Productos', value: productosActivos, icon: <BarChart3 className="w-5 h-5" />, color: 'text-purple-400' },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-foreground mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className="pos-card flex items-center gap-4">
            <div className={`${s.color} p-2 rounded-lg bg-muted`}>{s.icon}</div>
            <div>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="pos-card">
        <h2 className="font-semibold text-foreground mb-4">Actividad Reciente</h2>
        {pedidos.length === 0 ? (
          <p className="text-muted-foreground text-sm">No hay pedidos aún. Los pedidos aparecerán aquí.</p>
        ) : (
          <div className="space-y-2">
            {pedidos.slice(-5).reverse().map(p => {
              const mesa = mesas.find(m => m.id === p.mesaId);
              return (
                <div key={p.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
                  <div>
                    <span className="text-sm font-medium text-foreground">Mesa {mesa?.numero}</span>
                    <span className="text-xs text-muted-foreground ml-2">{p.items.length} items</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(p.fecha).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
