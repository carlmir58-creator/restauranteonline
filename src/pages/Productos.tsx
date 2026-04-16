import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Package, Plus, Edit2, ToggleLeft, ToggleRight } from 'lucide-react';
import { AreaProducto } from '@/types';
import { toast } from 'sonner';

const Productos = () => {
  const { productos, categorias, addProducto, updateProducto } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [area, setArea] = useState<AreaProducto>('cocina');

  const handleAdd = () => {
    if (!nombre || !precio || !categoriaId) { toast.error('Completa todos los campos'); return; }
    addProducto({ nombre, precio: parseFloat(precio), categoriaId, area, activo: true });
    setShowForm(false);
    setNombre(''); setPrecio(''); setCategoriaId('');
    toast.success('Producto agregado');
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Package className="w-7 h-7 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Productos</h1>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="pos-btn-primary text-sm">
          <Plus className="w-4 h-4" />
          Nuevo
        </button>
      </div>

      {showForm && (
        <div className="pos-card mb-6 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre" className="px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground" />
            <input type="number" value={precio} onChange={e => setPrecio(e.target.value)} placeholder="Precio" className="px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground" />
            <select value={categoriaId} onChange={e => setCategoriaId(e.target.value)} className="px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground">
              <option value="">Categoría</option>
              {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
            <select value={area} onChange={e => setArea(e.target.value as AreaProducto)} className="px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground">
              <option value="cocina">Cocina</option>
              <option value="barra">Barra</option>
            </select>
          </div>
          <button onClick={handleAdd} className="pos-btn-primary text-sm">Guardar</button>
        </div>
      )}

      <div className="pos-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground text-left">
              <th className="pb-3 font-medium">Nombre</th>
              <th className="pb-3 font-medium">Precio</th>
              <th className="pb-3 font-medium">Categoría</th>
              <th className="pb-3 font-medium">Área</th>
              <th className="pb-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {productos.map(p => {
              const cat = categorias.find(c => c.id === p.categoriaId);
              return (
                <tr key={p.id} className="border-b border-border/50">
                  <td className="py-3 text-foreground font-medium">{p.nombre}</td>
                  <td className="py-3 text-primary font-semibold">${p.precio.toFixed(2)}</td>
                  <td className="py-3 text-muted-foreground">{cat?.nombre}</td>
                  <td className="py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${p.area === 'cocina' ? 'bg-orange-500/20 text-orange-400' : 'bg-purple-500/20 text-purple-400'}`}>
                      {p.area}
                    </span>
                  </td>
                  <td className="py-3">
                    <button onClick={() => updateProducto(p.id, { activo: !p.activo })}>
                      {p.activo ? <ToggleRight className="w-6 h-6 text-emerald-400" /> : <ToggleLeft className="w-6 h-6 text-muted-foreground" />}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Productos;
