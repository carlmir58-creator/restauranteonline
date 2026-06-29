import { useState, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import {
  Users, Shield, CheckCircle2, XCircle, ChevronDown,
  UserCog, AlertTriangle, Search, RefreshCw, Plus, Building2
} from 'lucide-react';
import { Role, User } from '@/types';
import { toast } from 'sonner';

const roleConfig: Record<Role, { label: string; color: string; bg: string }> = {
  super_admin: { label: 'Super Admin',    color: 'text-red-400',     bg: 'bg-red-500/15     ring-red-500/30'    },
  admin:   { label: 'Administrador', color: 'text-violet-400',  bg: 'bg-violet-500/15 ring-violet-500/30' },
  mesero:  { label: 'Mesero',        color: 'text-sky-400',     bg: 'bg-sky-500/15     ring-sky-500/30'    },
  cajero:  { label: 'Cajero',        color: 'text-amber-400',   bg: 'bg-amber-500/15   ring-amber-500/30'  },
  cocina:  { label: 'Cocina',        color: 'text-orange-400',  bg: 'bg-orange-500/15  ring-orange-500/30' },
  barra:   { label: 'Barra',         color: 'text-pink-400',    bg: 'bg-pink-500/15    ring-pink-500/30'   },
};

const staffRoles: Role[] = ['mesero', 'cajero', 'cocina', 'barra'];

const avatarColors = [
  'bg-violet-500', 'bg-sky-500', 'bg-emerald-500',
  'bg-amber-500',  'bg-pink-500', 'bg-orange-500',
];

interface ConfirmDialogProps {
  user: User;
  onConfirm: () => void;
  onCancel: () => void;
}
const ConfirmDialog = ({ user, onConfirm, onCancel }: ConfirmDialogProps) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
    <div className="pos-card max-w-sm w-full p-6 space-y-5 animate-in zoom-in-95 duration-200">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-yellow-500/15 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5 text-yellow-400" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">
            {user.activo ? 'Desactivar cuenta' : 'Activar cuenta'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {user.activo
              ? `"${user.nombre}" perderá acceso al sistema inmediatamente.`
              : `"${user.nombre}" podrá iniciar sesión con su cuenta.`}
          </p>
        </div>
      </div>
      <div className="flex gap-3 justify-end">
        <button onClick={onCancel} className="pos-btn-secondary text-sm px-4 py-2 rounded-lg">
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          className={`text-sm px-4 py-2 rounded-lg font-semibold transition-all ${
            user.activo
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 ring-1 ring-red-500/30'
              : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 ring-1 ring-emerald-500/30'
          }`}
        >
          {user.activo ? 'Sí, desactivar' : 'Sí, activar'}
        </button>
      </div>
    </div>
  </div>
);

const UsuariosPage = () => {
  const { users, currentUser, restaurantes, updateUser, fetchInitialData, createStaffUser } = useStore();
  const [search, setSearch] = useState('');
  const [filterRol, setFilterRol] = useState<Role | 'todos'>('todos');
  const [confirmUser, setConfirmUser] = useState<User | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const isSuper = currentUser?.rol === 'super_admin';
  const userRestId = currentUser?.restauranteId;

  // Create user modal state
  const [showCreate, setShowCreate] = useState(false);
  const [createEmail, setCreateEmail] = useState('');
  const [createPass, setCreatePass] = useState('');
  const [createName, setCreateName] = useState('');
  const [createRol, setCreateRol] = useState<Role>('mesero');
  const [createRestId, setCreateRestId] = useState(userRestId || '');
  const [creating, setCreating] = useState(false);

  const restMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const r of restaurantes) m[r.id] = r.nombre;
    return m;
  }, [restaurantes]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchInitialData();
    setRefreshing(false);
    toast.success('Lista actualizada');
  };

  const handleToggleActivo = (user: User) => {
    if (user.id === currentUser?.id) {
      toast.error('No puedes desactivar tu propia cuenta');
      return;
    }
    setConfirmUser(user);
  };

  const handleConfirmToggle = async () => {
    if (!confirmUser) return;
    await updateUser(confirmUser.id, { activo: !confirmUser.activo });
    toast.success(
      confirmUser.activo
        ? `"${confirmUser.nombre}" desactivado`
        : `"${confirmUser.nombre}" activado`
    );
    setConfirmUser(null);
  };

  const handleRolChange = async (user: User, newRol: Role) => {
    if (user.id === currentUser?.id && newRol !== 'admin') {
      toast.error('No puedes cambiar tu propio rol de administrador');
      return;
    }
    await updateUser(user.id, { rol: newRol });
    toast.success(`Rol de "${user.nombre}" actualizado a ${roleConfig[newRol].label}`);
  };

  const handleCreateUser = async () => {
    if (!createEmail || !createPass || !createName) {
      toast.error('Completa todos los campos');
      return;
    }
    const restId = isSuper ? createRestId : userRestId;
    if (!restId) {
      toast.error('No hay restaurante seleccionado');
      return;
    }
    setCreating(true);
    const { error } = await createStaffUser(createEmail, createPass, createName, createRol, restId);
    if (error) {
      toast.error('Error al crear usuario: ' + (error.message || 'Desconocido'));
    } else {
      toast.success(`Usuario "${createName}" creado como ${roleConfig[createRol].label}`);
      setShowCreate(false);
      setCreateEmail('');
      setCreatePass('');
      setCreateName('');
      setCreateRol('mesero');
    }
    setCreating(false);
  };

  const filtered = users.filter(u => {
    const matchSearch = u.nombre.toLowerCase().includes(search.toLowerCase());
    const matchRol = filterRol === 'todos' || u.rol === filterRol;
    if (!matchSearch || !matchRol) return false;
    return true;
  });

  const activeCount   = users.filter(u => u.activo).length;
  const pendingCount  = users.filter(u => !u.activo).length;

  const colSpan = isSuper ? 5 : 4;

  return (
    <>
      {confirmUser && (
        <ConfirmDialog
          user={confirmUser}
          onConfirm={handleConfirmToggle}
          onCancel={() => setConfirmUser(null)}
        />
      )}

      {/* Create user modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="pos-card max-w-sm w-full p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Crear Usuario</h3>
              <button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground">
                <XCircle className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <input
                value={createName}
                onChange={e => setCreateName(e.target.value)}
                placeholder="Nombre completo"
                className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground"
              />
              <input
                value={createEmail}
                onChange={e => setCreateEmail(e.target.value)}
                placeholder="Email"
                type="email"
                className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground"
              />
              <input
                value={createPass}
                onChange={e => setCreatePass(e.target.value)}
                placeholder="Contraseña temporal"
                type="password"
                className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground"
              />
              <select
                value={createRol}
                onChange={e => setCreateRol(e.target.value as Role)}
                className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground cursor-pointer"
              >
                {staffRoles.map(r => (
                  <option key={r} value={r}>{roleConfig[r].label}</option>
                ))}
                {isSuper && <option value="admin">Administrador</option>}
              </select>
              {isSuper && (
                <select
                  value={createRestId}
                  onChange={e => setCreateRestId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground cursor-pointer"
                >
                  <option value="">Seleccionar restaurante...</option>
                  {restaurantes.map(r => (
                    <option key={r.id} value={r.id}>{r.nombre}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowCreate(false)} className="pos-btn-secondary text-sm px-4 py-2 rounded-lg">
                Cancelar
              </button>
              <button
                onClick={handleCreateUser}
                disabled={creating}
                className="pos-btn-primary text-sm px-4 py-2 rounded-lg"
              >
                {creating ? 'Creando...' : 'Crear Usuario'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="p-6 space-y-6 max-w-6xl mx-auto">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <UserCog className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Gestión de Usuarios</h1>
              <p className="text-sm text-muted-foreground">
                {users.length} usuario{users.length !== 1 ? 's' : ''} registrados
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCreate(true)}
              className="pos-btn-primary text-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Crear Usuario
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="pos-btn-secondary text-sm flex items-center gap-2 self-start sm:self-auto"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-3 gap-3">
          <div className="pos-card p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{users.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Total</p>
          </div>
          <div className="pos-card p-4 text-center">
            <p className="text-2xl font-bold text-emerald-400">{activeCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Activos</p>
          </div>
          <div className="pos-card p-4 text-center">
            <p className="text-2xl font-bold text-yellow-400">{pendingCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Pendientes</p>
          </div>
        </div>

        {/* ── Filters ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por nombre…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-muted/60 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>
          <div className="relative">
            <select
              value={filterRol}
              onChange={e => setFilterRol(e.target.value as Role | 'todos')}
              className="appearance-none pl-4 pr-9 py-2.5 rounded-xl bg-muted/60 border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all cursor-pointer"
            >
              <option value="todos">Todos los roles</option>
              {Object.entries(roleConfig).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* ── Table ── */}
        <div className="pos-card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Usuario
                  </th>
                  {isSuper && (
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Restaurante
                    </th>
                  )}
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Rol
                  </th>
                  <th className="text-center px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Estado
                  </th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={colSpan} className="text-center py-12 text-muted-foreground">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No se encontraron usuarios</p>
                    </td>
                  </tr>
                ) : filtered.map((user, idx) => {
                  const rc = roleConfig[user.rol];
                  const isMe = user.id === currentUser?.id;
                  const avatarBg = avatarColors[idx % avatarColors.length];

                  return (
                    <tr
                      key={user.id}
                      className={`transition-colors hover:bg-muted/30 ${!user.activo ? 'opacity-60' : ''}`}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg ${avatarBg} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                            {user.nombre.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {user.nombre}
                              {isMe && (
                                <span className="ml-2 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                                  Tú
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {user.id.slice(0, 8)}…
                            </p>
                          </div>
                        </div>
                      </td>

                      {isSuper && (
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Building2 className="w-3 h-3 shrink-0" />
                            {restMap[user.restauranteId || ''] || <span className="italic">Sin restaurante</span>}
                          </div>
                        </td>
                      )}

                      {/* Rol selector */}
                      <td className="px-4 py-4">
                        {user.rol === 'super_admin' ? (
                          <span className="text-xs font-semibold text-red-400 bg-red-500/10 ring-1 ring-red-500/20 px-2.5 py-1 rounded-lg">
                            Super Admin
                          </span>
                        ) : (
                          <div className="relative inline-block">
                            <select
                              value={user.rol}
                              onChange={e => handleRolChange(user, e.target.value as Role)}
                              disabled={isMe}
                              className={`appearance-none text-xs font-semibold pl-2.5 pr-6 py-1.5 rounded-lg ring-1 cursor-pointer transition-all focus:outline-none disabled:cursor-not-allowed ${rc.bg} ${rc.color}`}
                            >
                              {Object.entries(roleConfig).filter(([k]) => k !== 'super_admin').map(([k, v]) => (
                                <option key={k} value={k}>{v.label}</option>
                              ))}
                            </select>
                            <ChevronDown className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none ${rc.color}`} />
                          </div>
                        )}
                      </td>

                      {/* Estado badge */}
                      <td className="px-4 py-4 text-center">
                        {user.activo ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 ring-1 ring-emerald-500/20 px-2.5 py-1 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-yellow-400 bg-yellow-500/10 ring-1 ring-yellow-500/20 px-2.5 py-1 rounded-full">
                            <AlertTriangle className="w-3 h-3" />
                            Pendiente
                          </span>
                        )}
                      </td>

                      {/* Toggle button */}
                      <td className="px-5 py-4 text-right">
                        {user.rol !== 'super_admin' && (
                          <button
                            onClick={() => handleToggleActivo(user)}
                            disabled={isMe}
                            title={isMe ? 'No puedes modificar tu propia cuenta' : user.activo ? 'Desactivar cuenta' : 'Activar cuenta'}
                            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg ring-1 transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                              user.activo
                                ? 'text-red-400 bg-red-500/10 ring-red-500/20 hover:bg-red-500/20'
                                : 'text-emerald-400 bg-emerald-500/10 ring-emerald-500/20 hover:bg-emerald-500/20'
                            }`}
                          >
                            {user.activo
                              ? <><XCircle className="w-3.5 h-3.5" /> Desactivar</>
                              : <><CheckCircle2 className="w-3.5 h-3.5" /> Activar</>
                            }
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Legend ── */}
        <div className="flex flex-wrap gap-3">
          {Object.entries(roleConfig).map(([k, v]) => (
            <span key={k} className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ring-1 ${v.bg} ${v.color}`}>
              <Shield className="w-3 h-3" />
              {v.label}
            </span>
          ))}
        </div>
      </div>
    </>
  );
};

export default UsuariosPage;
