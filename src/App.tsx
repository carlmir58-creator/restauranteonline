import { useEffect } from "react";
import { UtensilsCrossed } from "lucide-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useStore } from "@/store/useStore";
import { supabase } from "@/lib/supabase";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Mesas from "@/pages/Mesas";
import Cocina from "@/pages/Cocina";
import Barra from "@/pages/Barra";
import Caja from "@/pages/Caja";
import Productos from "@/pages/Productos";
import Reportes from "@/pages/Reportes";
import Usuarios from "@/pages/Usuarios";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const defaultRoutes: Record<string, string> = {
  admin: '/',
  mesero: '/mesas',
  cajero: '/caja',
  cocina: '/cocina',
  barra: '/barra',
};

const AppRoutes = () => {
  const { currentUser, setSession, fetchInitialData, subscribeToChanges, isLoading } = useStore();

  useEffect(() => {
    // 1. Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // 2. Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    fetchInitialData();
    const unsubscribe = subscribeToChanges();
    
    return () => {
      subscription.unsubscribe();
      unsubscribe();
    };
  }, [fetchInitialData, subscribeToChanges, setSession]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentUser) return <Login />;

  if (!currentUser.activo) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background p-4 text-center">
        <div className="w-20 h-20 rounded-full bg-yellow-500/10 flex items-center justify-center mb-6">
          <UtensilsCrossed className="w-10 h-10 text-yellow-500 animate-pulse" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Cuenta Pendiente de Activación</h1>
        <p className="text-muted-foreground max-w-sm mb-8">
          Tu cuenta ha sido creada con éxito, pero aún no ha sido activada por un administrador.
          Por favor, contacta a la gerencia para obtener acceso.
        </p>
        <button 
          onClick={() => useStore.getState().signOut()}
          className="pos-btn-secondary px-8 py-2 rounded-xl"
        >
          Cerrar Sesión
        </button>

        <div className="mt-12 text-xs text-muted-foreground">
          <p>© 2026 Carlos Miranda • carlmir58@gmail.com</p>
          <p className="mt-1">Todos los derechos reservados.</p>
        </div>
      </div>
    );
  }

  const role = currentUser.rol;
  const defaultRoute = defaultRoutes[role] || '/';

  return (
    <Layout>
      <Routes>
        {role === 'admin' && <Route path="/" element={<Dashboard />} />}
        {['admin', 'mesero'].includes(role) && <Route path="/mesas" element={<Mesas />} />}
        {['admin', 'cocina'].includes(role) && <Route path="/cocina" element={<Cocina />} />}
        {['admin', 'barra'].includes(role) && <Route path="/barra" element={<Barra />} />}
        {['admin', 'cajero'].includes(role) && <Route path="/caja" element={<Caja />} />}
        {role === 'admin' && <Route path="/productos" element={<Productos />} />}
        {role === 'admin' && <Route path="/reportes" element={<Reportes />} />}
        {role === 'admin' && <Route path="/usuarios" element={<Usuarios />} />}
        <Route path="*" element={<Navigate to={defaultRoute} replace />} />
      </Routes>
    </Layout>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
