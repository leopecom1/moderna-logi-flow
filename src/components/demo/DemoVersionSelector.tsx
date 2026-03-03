import { useDemoVersion, type DemoVersion } from '@/context/DemoVersionContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ShoppingCart,
  Truck,
  Rocket,
  X,
  Check,
} from 'lucide-react';

interface DemoVersionSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const versions: {
  id: DemoVersion;
  name: string;
  subtitle: string;
  icon: typeof ShoppingCart;
  color: string;
  modules: string[];
}[] = [
  {
    id: 'v1',
    name: 'Fase 1',
    subtitle: 'Comercial',
    icon: ShoppingCart,
    color: 'bg-blue-500',
    modules: ['Dashboard', 'Clientes', 'Pedidos', 'Entregas', 'Cobros', 'Cuentas por Cobrar'],
  },
  {
    id: 'v2',
    name: 'Fase 2',
    subtitle: 'Operativa',
    icon: Truck,
    color: 'bg-amber-500',
    modules: ['Todo Fase 1', 'Productos', 'Stock', 'Movimientos', 'Logistica', 'Rutas', 'Armado'],
  },
  {
    id: 'v3',
    name: 'Fase 3',
    subtitle: 'Completa',
    icon: Rocket,
    color: 'bg-green-500',
    modules: ['Todo Fase 2', 'Finanzas', 'Cajas', 'E-commerce', 'Sync', 'Reportes', 'Admin'],
  },
];

export const DemoVersionSelector = ({ open, onOpenChange }: DemoVersionSelectorProps) => {
  const { demoVersion, setDemoVersion } = useDemoVersion();

  const handleSelect = (version: DemoVersion) => {
    setDemoVersion(version);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Modo Demo — Seleccionar Version</DialogTitle>
        </DialogHeader>

        <div className="grid gap-3 mt-2">
          {versions.map((v) => {
            const isActive = demoVersion === v.id;
            const Icon = v.icon;

            return (
              <button
                key={v.id}
                onClick={() => handleSelect(v.id)}
                className={`relative w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                  isActive
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-border hover:border-primary/30 hover:bg-muted/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`${v.color} rounded-lg p-2 text-white shrink-0`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{v.name}</span>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {v.subtitle}
                      </Badge>
                      {isActive && (
                        <Check className="h-4 w-4 text-primary ml-auto" />
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {v.modules.map((mod) => (
                        <span
                          key={mod}
                          className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full"
                        >
                          {mod}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between mt-2 pt-3 border-t">
          <p className="text-xs text-muted-foreground">
            {demoVersion ? `Demo activo: ${demoVersion.toUpperCase()}` : 'Demo desactivado'}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSelect(null)}
            className="text-xs text-muted-foreground hover:text-destructive"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Desactivar demo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
