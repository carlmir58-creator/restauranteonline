import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useStore } from "@/store/useStore";
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
  const { currentUser } = useStore();

  if (!currentUser) return <Login />;

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
