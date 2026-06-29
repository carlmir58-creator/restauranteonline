import { useState, useRef, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Building2, Plus, Edit2, X, Upload, ImageOff, Check, XCircle, UserPlus } from 'lucide-react';
import { Restaurante } from '@/types';
import { toast } from 'sonner';
import { uploadRestaurantLogo } from '@/lib/uploadRestaurantLogo';

interface RestauranteForm {
  nombre: string;
  direccion: string;
  telefono: string;
  logoFile: File | null;
  logoPreview: string;
}

const emptyForm = (): RestauranteForm => ({
  nombre: '',
  direccion: '',
  telefono: '',
  logoFile: null,
  logoPreview: '',
});

const SuperAdmin = () => {
  const { restaurantes, addRestaurante, updateRestaurante, fetchRestaurantes, createRestaurantAdmin } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<RestauranteForm>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileRef = useRef<HTMLInputElement>(null);

  // Admin creation state
  const [adminModal, setAdminModal] = useState<Restaurante | null>(null);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  useEffect(() => {
    fetchRestaurantes();
  }, [fetchRestaurantes]);

  const resetForm = () => {
    setForm(emptyForm());
    setShowForm(false);
    setEditingId(null);
  };

  const handleImageSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten imágenes');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no debe superar 5MB');
      return;
    }
    setForm(f => ({
      ...f,
      logoFile: file,
      logoPreview: URL.createObjectURL(file),
    }));
  };

  const handleSave = async () => {
    if (!form.nombre) {
      toast.error('El nombre del restaurante es obligatorio');
      return;
    }

    setUploading(true);
    try {
      if (editingId) {
        let logo_url: string | undefined;

        if (form.logoFile) {
          const url = await uploadRestaurantLogo(form.logoFile, editingId);
          if (!url) {
            toast.error('Error al subir el logo');
            setUploading(false);
            return;
          }
          logo_url = url;
        }

        await updateRestaurante(editingId, {
          nombre: form.nombre,
          direccion: form.direccion || undefined,
          telefono: form.telefono || undefined,
          ...(logo_url ? { logo_url } : {}),
        });

        toast.success('Restaurante actualizado');
      } else {
        const restId = await addRestaurante({
          nombre: form.nombre,
          direccion: form.direccion || undefined,
          telefono: form.telefono || undefined,
          activo: true,
        });

        if (restId && form.logoFile) {
          const url = await uploadRestaurantLogo(form.logoFile, restId);
          if (url) {
            await updateRestaurante(restId, { logo_url: url });
          }
        }

        toast.success('Restaurante creado');
      }

      resetForm();
    } catch {
      toast.error('Error al guardar el restaurante');
    } finally {
      setUploading(false);
    }
  };

  const startEdit = (r: Restaurante) => {
    setEditingId(r.id);
    setForm({
      nombre: r.nombre,
      direccion: r.direccion || '',
      telefono: r.telefono || '',
      logoFile: null,
      logoPreview: r.logo_url || '',
    });
    setShowForm(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateAdmin = async () => {
    if (!adminModal) return;
    if (!adminEmail || !adminName || !adminPassword) {
      toast.error('Completa todos los campos');
      return;
    }
    setCreatingAdmin(true);
    const { error } = await createRestaurantAdmin(adminEmail, adminPassword, adminName, adminModal.id);
    if (error) {
      toast.error('Error al crear admin: ' + (error.message || 'Desconocido'));
    } else {
      toast.success(`Admin "${adminName}" creado para ${adminModal.nombre}`);
      setAdminModal(null);
      setAdminEmail('');
      setAdminName('');
      setAdminPassword('');
    }
    setCreatingAdmin(false);
  };

  const toggleActivo = async (r: Restaurante) => {
    await updateRestaurante(r.id, { activo: !r.activo });
    toast.success(r.activo ? 'Restaurante desactivado' : 'Restaurante activado');
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Building2 className="w-7 h-7 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Restaurantes</h1>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="pos-btn-primary text-sm"
        >
          <Plus className="w-4 h-4" />
          Nuevo Restaurante
        </button>
      </div>

      {(showForm || editingId) && (
        <div className="pos-card mb-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              {editingId ? 'Editar Restaurante' : 'Nuevo Restaurante'}
            </h2>
            <button onClick={resetForm} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              value={form.nombre}
              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              placeholder="Nombre del restaurante"
              className="px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground"
            />
            <input
              value={form.telefono}
              onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
              placeholder="Teléfono"
              className="px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground"
            />
            <div className="sm:col-span-2">
              <input
                value={form.direccion}
                onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))}
                placeholder="Dirección"
                className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* Logo upload */}
          <div>
            <input
              ref={editingId ? editFileRef : fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) handleImageSelect(file);
              }}
            />
            <div className="flex items-center gap-4">
              {form.logoPreview ? (
                <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
                  <img
                    src={form.logoPreview}
                    alt="Logo preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, logoFile: null, logoPreview: '' }))}
                    className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ) : (
                <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center border border-border">
                  <ImageOff className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
              <button
                type="button"
                onClick={() => (editingId ? editFileRef : fileInputRef).current?.click()}
                className="pos-btn-secondary text-xs"
              >
                <Upload className="w-3 h-3" />
                {form.logoPreview ? 'Cambiar logo' : 'Subir logo'}
              </button>
              {form.logoFile && (
                <span className="text-xs text-muted-foreground">
                  {(form.logoFile.size / 1024).toFixed(1)} KB → se comprimirá a WebP
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={uploading}
              className="pos-btn-primary text-sm"
            >
              {uploading ? 'Subiendo logo...' : (editingId ? 'Guardar cambios' : 'Crear Restaurante')}
            </button>
            <button onClick={resetForm} className="pos-btn-secondary text-sm">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Admin creation modal */}
      {adminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="pos-card max-w-sm w-full p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">
                Crear Admin para {adminModal.nombre}
              </h3>
              <button onClick={() => setAdminModal(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <input
                value={adminEmail}
                onChange={e => setAdminEmail(e.target.value)}
                placeholder="Email del admin"
                type="email"
                className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground"
              />
              <input
                value={adminName}
                onChange={e => setAdminName(e.target.value)}
                placeholder="Nombre completo"
                className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground"
              />
              <input
                value={adminPassword}
                onChange={e => setAdminPassword(e.target.value)}
                placeholder="Contraseña temporal"
                type="password"
                className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setAdminModal(null)} className="pos-btn-secondary text-sm px-4 py-2 rounded-lg">
                Cancelar
              </button>
              <button
                onClick={handleCreateAdmin}
                disabled={creatingAdmin}
                className="pos-btn-primary text-sm px-4 py-2 rounded-lg"
              >
                {creatingAdmin ? 'Creando...' : 'Crear Admin'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="pos-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground text-left">
              <th className="pb-3 font-medium w-12">Logo</th>
              <th className="pb-3 font-medium">Nombre</th>
              <th className="pb-3 font-medium">Teléfono</th>
              <th className="pb-3 font-medium">Dirección</th>
              <th className="pb-3 font-medium">Estado</th>
              <th className="pb-3 font-medium">Admin</th>
              <th className="pb-3 font-medium w-16"></th>
            </tr>
          </thead>
          <tbody>
            {restaurantes.map(r => (
              <tr key={r.id} className="border-b border-border/50">
                <td className="py-3">
                  {r.logo_url ? (
                    <img
                      src={r.logo_url}
                      alt={r.nombre}
                      className="w-10 h-10 rounded-lg object-cover border border-border"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center border border-border">
                      <Building2 className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                </td>
                <td className="py-3 text-foreground font-medium">{r.nombre}</td>
                <td className="py-3 text-muted-foreground">{r.telefono || '-'}</td>
                <td className="py-3 text-muted-foreground max-w-[200px] truncate">{r.direccion || '-'}</td>
                <td className="py-3">
                  <button
                    onClick={() => toggleActivo(r)}
                    className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                      r.activo
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {r.activo ? <Check className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {r.activo ? 'Activo' : 'Inactivo'}
                  </button>
                </td>
                <td className="py-3">
                  <button
                    onClick={() => setAdminModal(r)}
                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    title="Crear admin para este restaurante"
                  >
                    <UserPlus className="w-3 h-3" />
                    Crear Admin
                  </button>
                </td>
                <td className="py-3">
                  <button
                    onClick={() => startEdit(r)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {restaurantes.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-muted-foreground">
                  No hay restaurantes registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SuperAdmin;
