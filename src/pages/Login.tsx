import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { UtensilsCrossed, LogIn } from 'lucide-react';

const Login = () => {
  const { users, login } = useStore();
  const [selectedUser, setSelectedUser] = useState('');

  const roleLabels: Record<string, string> = {
    admin: 'Administrador',
    mesero: 'Mesero',
    cajero: 'Cajero',
    cocina: 'Cocina',
    barra: 'Barra',
  };

  const roleColors: Record<string, string> = {
    admin: 'from-primary to-blue-700',
    mesero: 'from-emerald-600 to-emerald-800',
    cajero: 'from-amber-500 to-amber-700',
    cocina: 'from-orange-500 to-orange-700',
    barra: 'from-purple-500 to-purple-700',
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <UtensilsCrossed className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">RestoPOS</h1>
          <p className="text-muted-foreground mt-1">Sistema de Punto de Venta</p>
        </div>

        <div className="pos-card space-y-3">
          <p className="text-sm text-muted-foreground font-medium mb-4">Selecciona tu usuario</p>
          {users.filter(u => u.activo).map(user => (
            <button
              key={user.id}
              onClick={() => setSelectedUser(user.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                selectedUser === user.id
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-muted-foreground/30 hover:bg-accent'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${roleColors[user.rol]} flex items-center justify-center text-sm font-bold text-white`}>
                {user.nombre.charAt(0)}
              </div>
              <div className="text-left flex-1">
                <p className="font-medium text-foreground text-sm">{user.nombre}</p>
                <p className="text-xs text-muted-foreground">{roleLabels[user.rol]}</p>
              </div>
            </button>
          ))}

          <button
            onClick={() => selectedUser && login(selectedUser)}
            disabled={!selectedUser}
            className="pos-btn-primary w-full mt-4"
          >
            <LogIn className="w-4 h-4" />
            Ingresar
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
