import { useStore } from '@/store/useStore';
import {
  BarChart3, DollarSign, ShoppingBag, Coffee,
  Users, Clock, CheckCircle, TrendingUp
} from 'lucide-react';

const Dashboard = () => {
  const { pedidos, pagos, mesas, productos, users } = useStore();

  const hoy = new Date().toDateString();

  const mesasOcupadas    = mesas.filter(m => m.estado === 'ocupada').length;
  const pedidosActivos   = pedidos.filter(p => p.items.some(i => i.estado !== 'cobrado'));
  const ventasHoy        = pagos
    .filter(p => new Date(p.fecha).toDateString() === hoy)
    .reduce((acc, p) => acc + p.montoTotal, 0);
  const cobrosHoy        = pagos.filter(p => new Date(p.fecha).toDateString() === hoy).length;
  const productosActivos = productos.filter(p => p.activo).length;
  const usuariosActivos  = users.filter(u => u.activo).length;

  // Items que están listos (para entrega) en este momento
  const itemsListos = pedidos.flatMap(p =>
    p.items.filter(i => i.estado === 'listo').map(i => ({ ...i, pedido: p }))
  );

  const stats = [
    {
      label: 'Ventas Hoy',
      value: `$${ventasHoy.toFixed(2)}`,
      sub: `${cobrosHoy} cobros`,
      icon: <DollarSign className="w-5 h-5" />,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Pedidos Activos',
      value: pedidosActivos.length,
      sub: `${itemsListos.length} listos para entregar`,
      icon: <ShoppingBag className="w-5 h-5" />,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Mesas Ocupadas',
      value: `${mesasOcupadas}/${mesas.length}`,
      sub: `${mesas.filter(m => m.estado === 'disponible').length} disponibles`,
      icon: <Coffee className="w-5 h-5" />,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
    {
      label: 'Usuarios Activos',
      value: usuariosActivos,
      sub: `${productosActivos} productos`,
      icon: <Users className="w-5 h-5" />,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
    },
  ];

  // Resumen por método de pago (hoy)
  const pagosHoy = pagos.filter(p => new Date(p.fecha).toDateString() === hoy);
  const porMetodo = {
    efectivo:      pagosHoy.filter(p => p.metodoPago === 'efectivo').reduce((s, p) => s + p.montoTotal, 0),
    transferencia: pagosHoy.filter(p => p.metodoPago === 'transferencia').reduce((s, p) => s + p.montoTotal, 0),
    tarjeta:       pagosHoy.filter(p => p.metodoPago === 'tarjeta').reduce((s, p) => s + p.montoTotal, 0),
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="w-7 h-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-xs text-muted-foreground">
            {new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="pos-card">
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3 ${s.color}`}>
              {s.icon}
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-sm font-medium text-foreground mt-0.5">{s.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pedidos activos detallados */}
        <div className="pos-card">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingBag className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground">Pedidos Activos</h2>
            <span className="ml-auto text-xs text-muted-foreground">{pedidosActivos.length} total</span>
          </div>
          {pedidosActivos.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">No hay pedidos activos</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-auto">
              {pedidosActivos.slice().reverse().map(p => {
                const mesa = mesas.find(m => m.id === p.mesaId);
                const total = p.items.reduce((s, i) => s + i.precio * i.cantidad, 0);
                const listos = p.items.filter(i => i.estado === 'listo').length;
                const enPrep = p.items.filter(i => i.estado === 'en_preparacion').length;
                return (
                  <div key={p.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">Mesa #{mesa?.numero}</span>
                        {listos > 0 && (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full">
                            {listos} listo{listos > 1 ? 's' : ''}
                          </span>
                        )}
                        {enPrep > 0 && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full">
                            {enPrep} prep.
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {p.items.length} items
                        {p.cliente ? ` · ${p.cliente}` : ''}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-primary">${total.toFixed(2)}</span>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground justify-end mt-0.5">
                        <Clock className="w-3 h-3" />
                        {new Date(p.fecha).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Cobros del día */}
        <div className="pos-card">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h2 className="font-semibold text-foreground">Ventas del Día</h2>
          </div>

          {/* Por método de pago */}
          <div className="space-y-3 mb-4">
            {([['efectivo', 'text-emerald-400'], ['transferencia', 'text-sky-400'], ['tarjeta', 'text-violet-400']] as [string, string][]).map(([metodo, color]) => {
              const monto = porMetodo[metodo as keyof typeof porMetodo];
              const pct   = ventasHoy > 0 ? (monto / ventasHoy) * 100 : 0;
              return (
                <div key={metodo}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground capitalize">{metodo}</span>
                    <span className={`font-semibold ${color}`}>${monto.toFixed(2)}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        metodo === 'efectivo' ? 'bg-emerald-500' :
                        metodo === 'transferencia' ? 'bg-sky-500' : 'bg-violet-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Últimos cobros */}
          <div className="border-t border-border pt-3">
            <p className="text-xs text-muted-foreground mb-2">Últimos cobros</p>
            <div className="space-y-1.5 max-h-32 overflow-auto">
              {pagosHoy.slice(0, 8).map(pago => (
                <div key={pago.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                    {new Date(pago.fecha).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                    <span className="text-xs capitalize">{pago.metodoPago}</span>
                  </div>
                  <span className="font-medium text-foreground">${pago.montoTotal.toFixed(2)}</span>
                </div>
              ))}
              {pagosHoy.length === 0 && (
                <p className="text-muted-foreground text-xs text-center py-2">Sin cobros aún</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
