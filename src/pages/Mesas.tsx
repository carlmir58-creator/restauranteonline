import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { MesaEstado } from '@/types';
import { Plus, Users } from 'lucide-react';
import NuevoPedido from '@/components/NuevoPedido';

const estadoConfig: Record<MesaEstado, { label: string; class: string }> = {
  disponible: { label: 'Disponible', class: 'status-available' },
  ocupada: { label: 'Ocupada', class: 'status-occupied' },
  en_cobro: { label: 'En Cobro', class: 'status-preparation' },
  cerrada: { label: 'Cerrada', class: 'status-billed' },
};

const Mesas = () => {
  const { mesas, pedidos } = useStore();
  const [selectedMesa, setSelectedMesa] = useState<string | null>(null);

  const getPedidoActivo = (mesaId: string) =>
    pedidos.find(p => p.mesaId === mesaId && p.items.some(i => i.estado !== 'cobrado'));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Mesas</h1>
        <div className="flex gap-2 flex-wrap">
          {Object.entries(estadoConfig).map(([key, val]) => (
            <span key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={`w-2.5 h-2.5 rounded-full ${val.class}`} />
              {val.label}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {mesas.map(mesa => {
          const cfg = estadoConfig[mesa.estado];
          const pedido = getPedidoActivo(mesa.id);
          const total = pedido ? pedido.items.reduce((s, i) => s + i.precio * i.cantidad, 0) : 0;

          return (
            <button
              key={mesa.id}
              onClick={() => setSelectedMesa(mesa.id)}
              className="pos-card hover:border-primary/50 transition-all text-left group relative"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-bold text-foreground">#{mesa.numero}</span>
                <span className={`w-3 h-3 rounded-full ${cfg.class}`} />
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                <Users className="w-3 h-3" />
                {mesa.capacidad} personas
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{cfg.label}</p>
              {pedido && (
                <p className="text-sm font-semibold text-primary mt-2">${total.toFixed(2)}</p>
              )}
              {mesa.estado === 'disponible' && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-card/80 rounded-xl">
                  <Plus className="w-8 h-8 text-primary" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selectedMesa && (
        <NuevoPedido mesaId={selectedMesa} onClose={() => setSelectedMesa(null)} />
      )}
    </div>
  );
};

export default Mesas;
