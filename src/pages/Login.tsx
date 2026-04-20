import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { UtensilsCrossed, LogIn, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

const Login = () => {
  const { signIn, signUp } = useStore();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error('Error al iniciar sesión: ' + error.message);
      }
    } else {
      if (!nombre) {
        toast.error('Por favor ingresa tu nombre');
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, nombre);
      if (error) {
        toast.error('Error al registrarse: ' + error.message);
      } else {
        toast.success('Registro exitoso. Debes esperar a que el administrador active tu cuenta.');
        setIsLogin(true);
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 mb-6 group hover:scale-105 transition-transform duration-300">
            <UtensilsCrossed className="w-10 h-10 text-primary group-hover:rotate-12 transition-transform" />
          </div>
          <h1 className="text-4xl font-extrabold text-foreground tracking-tight">Comanda|POS</h1>
          <p className="text-muted-foreground mt-2 text-lg">Sistema de Gestión para restaurantes</p>
        </div>

        <div className="pos-card border-border/50 backdrop-blur-sm shadow-2xl space-y-6 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <label className="text-sm font-semibold text-foreground/80 ml-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
                  placeholder="Tu nombre"
                />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground/80 ml-1">Correo Electrónico</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
                placeholder="ejemplo@restaurante.com"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-semibold text-foreground/80">Contraseña</label>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="pos-btn-primary w-full py-4 rounded-xl text-base font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-[0.98] transition-all disabled:opacity-50 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
              ) : (
                <>
                  {isLogin ? <LogIn className="w-5 h-5 mr-2" /> : <UserPlus className="w-5 h-5 mr-2" />}
                  {isLogin ? 'Ingresar al Sistema' : 'Crear Cuenta'}
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center text-sm">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary font-semibold hover:underline"
            >
              {isLogin ? '¿No tienes cuenta? Regístrate aquí' : '¿Ya tienes cuenta? Inicia sesión'}
            </button>
          </div>
        </div>
        
        <div className="text-center mt-8 text-xs text-muted-foreground animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-300">
          <p>© 2026 Carlos Miranda • carlmir58@gmail.com</p>
          <p className="mt-1">Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
