import { useStore } from '@/store/useStore';
import { Settings, Printer, Monitor, Save, ToggleLeft, ToggleRight, Info } from 'lucide-react';
import { toast } from 'sonner';

const Configuracion = () => {
  const { configuraciones, updateConfiguracion } = useStore();

  const handleToggle = async (key: string, currentValue: boolean) => {
    await updateConfiguracion(key, !currentValue);
    toast.success('Configuración actualizada');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Settings className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configuración del Sistema</h1>
          <p className="text-sm text-muted-foreground text-foreground/60">Ajusta el comportamiento de impresión y flujos de trabajo.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Impresión Section */}
        <div className="pos-card space-y-6">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Printer className="w-5 h-5 text-amber-400" />
            <h2 className="font-semibold text-foreground">Opciones de Impresión</h2>
          </div>

          <div className="flex items-center justify-between gap-4 p-2 rounded-lg hover:bg-muted/30 transition-colors">
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">Separar Bebidas (Barra)</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Las bebidas se imprimirán en un ticket independiente de los platos de comida.
              </p>
            </div>
            <button 
              onClick={() => handleToggle('impresion_separada_barra', !!configuraciones.impresion_separada_barra)}
              className="focus:outline-none transition-transform active:scale-95"
            >
              {configuraciones.impresion_separada_barra ? (
                <ToggleRight className="w-10 h-10 text-primary" />
              ) : (
                <ToggleLeft className="w-10 h-10 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>

        {/* Workflow Section */}
        <div className="pos-card space-y-6">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Monitor className="w-5 h-5 text-sky-400" />
            <h2 className="font-semibold text-foreground">Flujos de Trabajo</h2>
          </div>

          <div className="flex items-center justify-between gap-4 p-2 rounded-lg hover:bg-muted/30 transition-colors">
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">Pantallas de Producción</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Si se deshabilitan, los meseros podrán marcar como "Listo" directamente desde su panel.
              </p>
            </div>
            <button 
              onClick={() => handleToggle('produccion_digital_habilitada', !!configuraciones.produccion_digital_habilitada)}
              className="focus:outline-none transition-transform active:scale-95"
            >
              {configuraciones.produccion_digital_habilitada ? (
                <ToggleRight className="w-10 h-10 text-primary" />
              ) : (
                <ToggleLeft className="w-10 h-10 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="pos-card bg-amber-500/5 border-amber-500/10 flex gap-4 items-start p-4">
        <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-600/80 space-y-2">
          <p>
            <strong>Impresión Separada:</strong> Útil si tienes impresoras térmicas distintas en Cocina y Barra. El sistema generará dos documentos de impresión independientes.
          </p>
          <p>
            <strong>Pantallas de Producción Deshabilitadas:</strong> Recomendado para establecimientos pequeños que solo usan tickets impresos. El mesero se encarga de confirmar la entrega en el sistema.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Configuracion;
