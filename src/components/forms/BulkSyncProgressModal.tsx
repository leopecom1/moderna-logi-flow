import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Loader2, Circle, XCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export type SyncStatus = 'pending' | 'syncing' | 'completed' | 'error';

export interface ProductSyncStatus {
  wooId: number;
  shopifyId: number;
  name: string;
  status: SyncStatus;
  error?: string;
}

interface BulkSyncProgressModalProps {
  open: boolean;
  products: ProductSyncStatus[];
  currentIndex: number;
}

export function BulkSyncProgressModal({ 
  open, 
  products, 
  currentIndex 
}: BulkSyncProgressModalProps) {
  const total = products.length;
  const completed = products.filter(p => p.status === 'completed' || p.status === 'error').length;
  const progress = total > 0 ? (completed / total) * 100 : 0;

  const getStatusIcon = (status: SyncStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'syncing':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusText = (status: SyncStatus) => {
    switch (status) {
      case 'completed':
        return 'Completado';
      case 'syncing':
        return 'Sincronizando...';
      case 'error':
        return 'Error';
      default:
        return 'Pendiente';
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Progreso de Sincronización</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Sincronizando productos...</span>
              <span className="font-medium">{completed} / {total}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {products.map((product, index) => (
                <div
                  key={`${product.wooId}-${product.shopifyId}`}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                    product.status === 'syncing' ? 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800' : ''
                  }`}
                >
                  {getStatusIcon(product.status)}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{product.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {getStatusText(product.status)}
                      {product.error && (
                        <div className="text-red-500 mt-1">{product.error}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {completed === total && (
            <div className="text-center text-sm text-muted-foreground pt-2 border-t">
              Sincronización completada
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
