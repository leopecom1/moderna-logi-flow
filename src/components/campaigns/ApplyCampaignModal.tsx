import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2, Package, AlertCircle, X } from 'lucide-react';
import { useCampaignProgress, useCancelCampaignProcessing } from '@/hooks/useEcommerceCampaigns';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ApplyCampaignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string | null;
  mode: 'apply' | 'revert';
}

export function ApplyCampaignModal({ 
  open, 
  onOpenChange, 
  campaignId,
  mode 
}: ApplyCampaignModalProps) {
  const { data: progress, isLoading } = useCampaignProgress(campaignId);
  const cancelProcessing = useCancelCampaignProcessing();
  
  const isProcessing = progress?.processing_status === 'processing';
  const isCompleted = progress?.processing_status === 'completed';
  const isCancelled = progress?.processing_status === 'cancelled';
  const isFailed = progress?.processing_status === 'failed';
  
  const total = progress?.products_count || 0;
  const completed = (progress?.completed_products || 0) + (progress?.failed_products || 0) + (progress?.skipped_products || 0);
  const successful = progress?.completed_products || 0;
  const failed = progress?.failed_products || 0;
  const skipped = progress?.skipped_products || 0;
  const progressPercentage = total > 0 ? (completed / total) * 100 : 0;

  const handleCancel = () => {
    if (campaignId && isProcessing) {
      cancelProcessing.mutate(campaignId);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'applied':
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'applied':
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
    <Dialog open={open} onOpenChange={isProcessing ? undefined : onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-auto">
          {/* Background Processing Notice */}
          {isProcessing && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>
                El proceso continúa en segundo plano. Puedes cerrar esta ventana sin perder progreso.
              </AlertDescription>
            </Alert>
          )}

          {/* Completion Messages */}
          {isCompleted && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {mode === 'apply' ? 'Campaña aplicada' : 'Campaña revertida'} exitosamente
              </AlertDescription>
            </Alert>
          )}

          {isCancelled && (
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                Procesamiento cancelado
              </AlertDescription>
            </Alert>
          )}

          {isFailed && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                El procesamiento falló. Revisa los errores a continuación.
              </AlertDescription>
            </Alert>
          )}

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
          {progress?.products && progress.products.length > 0 && (
            <div className="space-y-2 border rounded-lg p-4">
              <h3 className="text-sm font-medium mb-3">Productos</h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {progress.products.map((item: any) => (
                  <div 
                    key={item.id} 
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                  >
                    <div className="mt-0.5">
                      {getStatusIcon(item.status)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-sm font-medium truncate">
                          {item.product_name}
                        </span>
                        {getStatusBadge(item.status)}
                      </div>
                      
                      {item.error_message && (
                        <p className="text-xs text-destructive mt-1">
                          {item.error_message}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            {isProcessing && (
              <Button
                variant="destructive"
                onClick={handleCancel}
                disabled={cancelProcessing.isPending}
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar Procesamiento
              </Button>
            )}
            
            {!isProcessing && (
              <Button onClick={() => onOpenChange(false)}>
                Cerrar
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
