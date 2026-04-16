import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Users, Plus, Shield } from 'lucide-react';
import { Role } from '@/types';
import { toast } from 'sonner';

const roleLabels: Record<Role, string> = {
  admin: 'Administrador',
  mesero: 'Mesero',
  cajero: 'Cajero',
  cocina: 'Cocina',
  barra: 'Barra',
};

const UsuariosPage = () => {
  const { users, addUser } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [nombre, setNombre] = useState('');
  const [rol, setRol] = useState<Role>('mesero');

  const handleAdd = () => {
    if (!nombre) { toast.error('Ingresa un nombre'); return; }
    addUser({ nombre, rol, activo: true });
    setShowForm(false);
    setNombre('');
    toast.success('Usuario agregado');
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="w-7 h-7 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Usuarios</h1>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="pos-btn-primary text-sm">
          <Plus className="w-4 h-4" />
          Nuevo
        </button>
      </div>

      {showForm && (
        <div className="pos-card mb-6 space-y-3">
          <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre completo" className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground" />
          <select value={rol} onChange={e => setRol(e.target.value as Role)} className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground">
            {Object.entries(roleLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button onClick={handleAdd} className="pos-btn-primary text-sm">Guardar</button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {users.map(u => (
          <div key={u.id} className="pos-card flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
              {u.nombre.charAt(0)}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{u.nombre}</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Shield className="w-3 h-3" />
                {roleLabels[u.rol]}
              </div>
            </div>
            <span className={`w-2 h-2 rounded-full ${u.activo ? 'bg-emerald-400' : 'bg-muted-foreground'}`} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default UsuariosPage;
