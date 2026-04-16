import { useStore } from '@/store/useStore';
import { BarChart3, DollarSign, TrendingUp } from 'lucide-react';

const Reportes = () => {
  const { pagos, pedidos, mesas, productos, users } = useStore();

  const hoy = new Date().toDateString();
  const pagosHoy = pagos.filter(p => new Date(p.fecha).toDateString() === hoy);
  const ventasHoy = pagosHoy.reduce((s, p) => s + p.monto, 0);

  // Ventas por método de pago
  const ventasEfectivo = pagosHoy.filter(p => p.metodo === 'efectivo').reduce((s, p) => s + p.monto, 0);
  const ventasTransf = pagosHoy.filter(p => p.metodo === 'transferencia').reduce((s, p) => s + p.monto, 0);

  // Productos más vendidos
  const productCount: Record<string, number> = {};
  pedidos.forEach(p => p.items.forEach(i => {
    productCount[i.productoId] = (productCount[i.productoId] || 0) + i.cantidad;
  }));
  const topProducts = Object.entries(productCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, qty]) => ({ producto: productos.find(p => p.id === id), qty }));

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="w-7 h-7 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Reportes</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="pos-card">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <span className="text-sm text-muted-foreground">Ventas Hoy</span>
          </div>
          <p className="text-3xl font-bold text-foreground">${ventasHoy.toFixed(2)}</p>
        </div>
        <div className="pos-card">
          <p className="text-sm text-muted-foreground mb-2">Efectivo</p>
          <p className="text-2xl font-bold text-foreground">${ventasEfectivo.toFixed(2)}</p>
        </div>
        <div className="pos-card">
          <p className="text-sm text-muted-foreground mb-2">Transferencia</p>
          <p className="text-2xl font-bold text-foreground">${ventasTransf.toFixed(2)}</p>
        </div>
      </div>

      <div className="pos-card">
        <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Productos Más Vendidos
        </h2>
        {topProducts.length === 0 ? (
          <p className="text-muted-foreground text-sm">No hay datos aún</p>
        ) : (
          <div className="space-y-2">
            {topProducts.map((tp, i) => (
              <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-muted-foreground">#{i + 1}</span>
                  <span className="text-sm font-medium text-foreground">{tp.producto?.nombre}</span>
                </div>
                <span className="text-sm font-bold text-primary">{tp.qty} uds</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reportes;
