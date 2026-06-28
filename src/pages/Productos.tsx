import { useState, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { Package, Plus, Edit2, ToggleLeft, ToggleRight, Upload, X, ImageOff } from 'lucide-react';
import { AreaProducto, Producto } from '@/types';
import { toast } from 'sonner';
import { uploadProductImage } from '@/lib/uploadImage';

interface ProductoForm {
  nombre: string;
  precio: string;
  categoriaId: string;
  area: AreaProducto;
  imagenFile: File | null;
  imagenPreview: string;
}

const emptyForm = (): ProductoForm => ({
  nombre: '',
  precio: '',
  categoriaId: '',
  area: 'cocina',
  imagenFile: null,
  imagenPreview: '',
});

const Productos = () => {
  const { productos, categorias, addProducto, updateProducto } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ProductoForm>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileRef = useRef<HTMLInputElement>(null);

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
      imagenFile: file,
      imagenPreview: URL.createObjectURL(file),
    }));
  };

  const handleAdd = async () => {
    if (!form.nombre || !form.precio || !form.categoriaId) {
      toast.error('Completa todos los campos');
      return;
    }

    setUploading(true);
    try {
      let imagenUrl: string | undefined;

      if (form.imagenFile) {
        const tempId = `temp-${Date.now()}`;
        const url = await uploadProductImage(form.imagenFile, tempId);
        if (!url) {
          toast.error('Error al subir la imagen');
          setUploading(false);
          return;
        }
        imagenUrl = url;
      }

      await addProducto({
        nombre: form.nombre,
        precio: parseFloat(form.precio),
        categoriaId: form.categoriaId,
        area: form.area,
        activo: true,
        imagenUrl,
      });

      resetForm();
      toast.success('Producto agregado');
    } catch {
      toast.error('Error al guardar el producto');
    } finally {
      setUploading(false);
    }
  };

  const startEdit = (p: Producto) => {
    setEditingId(p.id);
    setForm({
      nombre: p.nombre,
      precio: p.precio.toString(),
      categoriaId: p.categoriaId,
      area: p.area,
      imagenFile: null,
      imagenPreview: p.imagenUrl || '',
    });
    setShowForm(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEdit = async () => {
    if (!editingId || !form.nombre || !form.precio || !form.categoriaId) {
      toast.error('Completa todos los campos');
      return;
    }

    setUploading(true);
    try {
      let imagenUrl: string | undefined;

      if (form.imagenFile) {
        const url = await uploadProductImage(form.imagenFile, editingId);
        if (!url) {
          toast.error('Error al subir la imagen');
          setUploading(false);
          return;
        }
        imagenUrl = url;
      }

      await updateProducto(editingId, {
        nombre: form.nombre,
        precio: parseFloat(form.precio),
        categoriaId: form.categoriaId,
        area: form.area,
        imagenUrl: imagenUrl || form.imagenPreview || undefined,
      });

      resetForm();
      toast.success('Producto actualizado');
    } catch {
      toast.error('Error al actualizar el producto');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Package className="w-7 h-7 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Productos</h1>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="pos-btn-primary text-sm"
        >
          <Plus className="w-4 h-4" />
          Nuevo
        </button>
      </div>

      {(showForm || editingId) && (
        <div className="pos-card mb-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              {editingId ? 'Editar Producto' : 'Nuevo Producto'}
            </h2>
            <button onClick={resetForm} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              value={form.nombre}
              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              placeholder="Nombre"
              className="px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground"
            />
            <input
              type="number"
              value={form.precio}
              onChange={e => setForm(f => ({ ...f, precio: e.target.value }))}
              placeholder="Precio"
              className="px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground"
            />
            <select
              value={form.categoriaId}
              onChange={e => setForm(f => ({ ...f, categoriaId: e.target.value }))}
              className="px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground"
            >
              <option value="">Categoría</option>
              {categorias.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
            <select
              value={form.area}
              onChange={e => setForm(f => ({ ...f, area: e.target.value as AreaProducto }))}
              className="px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground"
            >
              <option value="cocina">Cocina</option>
              <option value="barra">Barra</option>
            </select>
          </div>

          {/* Image upload */}
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
              {form.imagenPreview ? (
                <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
                  <img
                    src={form.imagenPreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, imagenFile: null, imagenPreview: '' }))}
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
                {form.imagenPreview ? 'Cambiar imagen' : 'Subir imagen'}
              </button>
              {form.imagenFile && (
                <span className="text-xs text-muted-foreground">
                  {(form.imagenFile.size / 1024).toFixed(1)} KB → se comprimirá a WebP
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={editingId ? handleEdit : handleAdd}
              disabled={uploading}
              className="pos-btn-primary text-sm"
            >
              {uploading ? 'Subiendo imagen...' : (editingId ? 'Guardar cambios' : 'Guardar')}
            </button>
            <button onClick={resetForm} className="pos-btn-secondary text-sm">
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="pos-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground text-left">
              <th className="pb-3 font-medium w-12">Img</th>
              <th className="pb-3 font-medium">Nombre</th>
              <th className="pb-3 font-medium">Precio</th>
              <th className="pb-3 font-medium">Categoría</th>
              <th className="pb-3 font-medium">Área</th>
              <th className="pb-3 font-medium">Estado</th>
              <th className="pb-3 font-medium w-16"></th>
            </tr>
          </thead>
          <tbody>
            {productos.map(p => {
              const cat = categorias.find(c => c.id === p.categoriaId);
              return (
                <tr key={p.id} className="border-b border-border/50">
                  <td className="py-3">
                    {p.imagenUrl ? (
                      <img
                        src={p.imagenUrl}
                        alt={p.nombre}
                        className="w-10 h-10 rounded-lg object-cover border border-border"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center border border-border">
                        <ImageOff className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </td>
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
                  <td className="py-3">
                    <button
                      onClick={() => startEdit(p)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Edit2 className="w-4 h-4" />
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
