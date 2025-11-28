import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Loader2, Package, AlertCircle } from 'lucide-react';
import { ApplyCampaignProgress } from '@/hooks/useEcommerceCampaigns';

interface ApplyCampaignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  progress: ApplyCampaignProgress[];
  isApplying: boolean;
  mode: 'apply' | 'revert';
}

export function ApplyCampaignModal({ 
  open, 
  onOpenChange, 
  progress, 
  isApplying,
  mode 
}: ApplyCampaignModalProps) {
  const total = progress.length;
  const completed = progress.filter(p => p.status === 'success' || p.status === 'error' || p.status === 'skipped').length;
  const successful = progress.filter(p => p.status === 'success').length;
  const failed = progress.filter(p => p.status === 'error').length;
  const skipped = progress.filter(p => p.status === 'skipped').length;
  const progressPercentage = total > 0 ? (completed / total) * 100 : 0;

  const getStatusIcon = (status: ApplyCampaignProgress['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'processing':
        return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
      case 'skipped':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Package className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: ApplyCampaignProgress['status']) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-500">Completado</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'processing':
        return <Badge>Procesando...</Badge>;
      case 'skipped':
        return <Badge className="bg-yellow-500">Omitido</Badge>;
      default:
        return <Badge variant="outline">Pendiente</Badge>;
    }
  };

  const title = mode === 'apply' ? 'Aplicando Campaña' : 'Revirtiendo Campaña';
  const description = mode === 'apply' 
    ? 'Actualizando precios en WooCommerce...' 
    : 'Restaurando precios originales...';

  return (
    <Dialog open={open} onOpenChange={isApplying ? undefined : onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-auto">
          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{description}</span>
              <span className="font-medium">
                {completed} / {total} productos
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                {successful} exitosos
              </span>
              {skipped > 0 && (
                <span className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 text-yellow-500" />
                  {skipped} omitidos
                </span>
              )}
              {failed > 0 && (
                <span className="flex items-center gap-1">
                  <XCircle className="h-3 w-3 text-destructive" />
                  {failed} fallidos
                </span>
              )}
            </div>
          </div>

          {/* Product List */}
          <div className="space-y-2 border rounded-lg p-4">
            <h3 className="text-sm font-medium mb-3">Productos</h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {progress.map((item) => (
                <div 
                  key={item.productId} 
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                >
                  <div className="mt-0.5">
                    {getStatusIcon(item.status)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-sm font-medium truncate">
                        {item.productName}
                      </span>
                      {getStatusBadge(item.status)}
                    </div>
                    
                    {item.error && (
                      <p className="text-xs text-destructive mt-1">
                        {item.error}
                      </p>
                    )}
                    
                    {item.status === 'processing' && item.variationsTotal && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Variaciones</span>
                          <span>{item.variationsProcessed} / {item.variationsTotal}</span>
                        </div>
                        <Progress 
                          value={(item.variationsProcessed! / item.variationsTotal) * 100} 
                          className="h-1"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Completion Status */}
          {!isApplying && completed === total && (
            <div className="text-center py-4 text-sm">
              {failed === 0 ? (
                <p className="text-green-600 font-medium">
                  ✓ {mode === 'apply' ? 'Campaña aplicada' : 'Campaña revertida'} exitosamente
                </p>
              ) : (
                <p className="text-muted-foreground">
                  Proceso completado con {failed} error{failed !== 1 ? 'es' : ''}
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
