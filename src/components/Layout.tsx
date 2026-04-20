import { ReactNode } from 'react';
import { useStore } from '@/store/useStore';
import { Role } from '@/types';
import {
  LayoutDashboard, UtensilsCrossed, ChefHat, Beer,
  CreditCard, Package, BarChart3, Users, LogOut, Coffee
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
  roles: Role[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: <LayoutDashboard className="w-5 h-5" />, roles: ['admin'] },
  { label: 'Mesas', path: '/mesas', icon: <Coffee className="w-5 h-5" />, roles: ['admin', 'mesero'] },
  { label: 'Cocina', path: '/cocina', icon: <ChefHat className="w-5 h-5" />, roles: ['admin', 'cocina'] },
  { label: 'Barra', path: '/barra', icon: <Beer className="w-5 h-5" />, roles: ['admin', 'barra'] },
  { label: 'Caja', path: '/caja', icon: <CreditCard className="w-5 h-5" />, roles: ['admin', 'cajero'] },
  { label: 'Productos', path: '/productos', icon: <Package className="w-5 h-5" />, roles: ['admin'] },
  { label: 'Reportes', path: '/reportes', icon: <BarChart3 className="w-5 h-5" />, roles: ['admin'] },
  { label: 'Usuarios', path: '/usuarios', icon: <Users className="w-5 h-5" />, roles: ['admin'] },
];

const Layout = ({ children }: { children: ReactNode }) => {
  const { currentUser, logout } = useStore();
  const location = useLocation();

  const filteredNav = navItems.filter(item =>
    currentUser && item.roles.includes(currentUser.rol)
  );

  const roleLabels: Record<string, string> = {
    admin: 'Administrador',
    mesero: 'Mesero',
    cajero: 'Cajero',
    cocina: 'Cocina',
    barra: 'Barra',
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-[220px] bg-[hsl(var(--sidebar-background))] border-r border-sidebar-border flex flex-col shrink-0 max-md:hidden">
        <div className="p-4 flex items-center gap-2 border-b border-sidebar-border">
          <UtensilsCrossed className="w-6 h-6 text-primary" />
          <span className="font-bold text-foreground text-lg">RestoPOS</span>
        </div>

        <nav className="flex-1 p-2 space-y-1">
          {filteredNav.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary/15 text-primary'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-2 px-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
              {currentUser?.nombre.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{currentUser?.nombre}</p>
              <p className="text-[10px] text-muted-foreground">{roleLabels[currentUser?.rol || '']}</p>
            </div>
          </div>
          <button onClick={logout} className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-destructive w-full rounded-lg hover:bg-destructive/10 transition-colors">
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
          
          <div className="mt-4 px-3 py-2 border-t border-sidebar-border/50">
            <p className="text-[10px] text-muted-foreground leading-tight">
              Copyright © 2026 Carlos Miranda
            </p>
            <p className="text-[10px] text-muted-foreground/70">
              carlmir58@gmail.com
            </p>
            <p className="text-[10px] text-muted-foreground/70">
              Todos los derechos reservados.
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[hsl(var(--sidebar-background))] border-t border-sidebar-border flex justify-around py-2 z-50 md:hidden">
        {filteredNav.slice(0, 5).map(item => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
        <button onClick={logout} className="flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] text-muted-foreground">
          <LogOut className="w-5 h-5" />
          Salir
        </button>
      </nav>

      {/* Content */}
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        {children}
      </main>
    </div>
  );
};

export default Layout;
