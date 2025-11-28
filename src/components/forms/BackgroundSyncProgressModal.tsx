import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BackgroundSyncProgressModalProps {
  open: boolean;
  onClose: () => void;
  jobId: string | null;
}

interface JobStatus {
  status: string;
  total_products: number;
  completed_products: number;
  failed_products: number;
  started_at: string | null;
  completed_at: string | null;
}

export function BackgroundSyncProgressModal({
  open,
  onClose,
  jobId,
}: BackgroundSyncProgressModalProps) {
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [isBackgrounded, setIsBackgrounded] = useState(false);
  const [isStalled, setIsStalled] = useState(false);
  const [isContinuing, setIsContinuing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!open || !jobId) return;

    const fetchJobStatus = async () => {
      const { data } = await supabase
        .from('sync_jobs')
        .select('status, total_products, completed_products, failed_products, started_at, completed_at, updated_at')
        .eq('id', jobId)
        .single();

      if (data) {
        setJobStatus(data as any);
        
        // Check if job is stalled (processing but no updates in 2 minutes)
        if (data.status === 'processing') {
          const lastUpdate = new Date(data.updated_at);
          const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
          const pendingCount = data.total_products - data.completed_products - data.failed_products;
          setIsStalled(lastUpdate < twoMinutesAgo && pendingCount > 0);
        } else {
          setIsStalled(false);
        }
      }
    };

    // Initial fetch
    fetchJobStatus();

    // Poll every 3 seconds
    const interval = setInterval(fetchJobStatus, 3000);

    return () => clearInterval(interval);
  }, [open, jobId]);

  if (!jobStatus) {
    return null;
  }

  const progress = jobStatus.total_products > 0
    ? ((jobStatus.completed_products + jobStatus.failed_products) / jobStatus.total_products) * 100
    : 0;

  const isCompleted = jobStatus.status === 'completed';
  const isPending = jobStatus.status === 'pending';
  const isProcessing = jobStatus.status === 'processing';

  const handleBackground = () => {
    setIsBackgrounded(true);
    toast({
      title: "Sincronización en segundo plano",
      description: "El proceso continuará aunque cierres esta ventana. Podrás ver el resultado en el historial.",
    });
    onClose();
  };

  const handleContinue = async () => {
    if (!jobId) return;
    
    setIsContinuing(true);
    try {
      await supabase.functions.invoke('background-sync', {
        body: { job_id: jobId }
      });
      
      toast({
        title: "Sincronización reiniciada",
        description: "El proceso continuará desde donde se detuvo.",
      });
      setIsStalled(false);
    } catch (error) {
      console.error('Error continuing sync:', error);
      toast({
        title: "Error",
        description: "No se pudo reiniciar la sincronización.",
        variant: "destructive",
      });
    } finally {
      setIsContinuing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Sincronización en Progreso</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progreso</span>
              <span className="font-medium">
                {jobStatus.completed_products + jobStatus.failed_products} / {jobStatus.total_products}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Completados</span>
              </div>
              <span className="font-medium">{jobStatus.completed_products}</span>
            </div>

            {jobStatus.failed_products > 0 && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span>Con errores</span>
                </div>
                <span className="font-medium">{jobStatus.failed_products}</span>
              </div>
            )}

            {isProcessing && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span>En proceso</span>
                </div>
                <span className="font-medium">
                  {jobStatus.total_products - jobStatus.completed_products - jobStatus.failed_products}
                </span>
              </div>
            )}
          </div>

          {isCompleted ? (
            <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Sincronización completada</p>
                  {jobStatus.failed_products > 0 && (
                    <p className="mt-1 text-sm">
                      {jobStatus.failed_products} productos tuvieron errores. 
                      Puedes verlos en el historial de sincronización.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : isPending ? (
            <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
              <div className="flex items-start gap-2">
                <Loader2 className="h-5 w-5 flex-shrink-0 mt-0.5 animate-spin" />
                <div>
                  <p className="font-medium">Iniciando sincronización...</p>
                  <p className="mt-1 text-sm">El proceso comenzará en unos segundos.</p>
                </div>
              </div>
            </div>
          ) : isStalled ? (
            <div className="rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">El proceso parece haberse detenido</p>
                  <p className="mt-1 text-sm">
                    Puedes continuar la sincronización desde donde se detuvo.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">El proceso continúa en segundo plano</p>
                  <p className="mt-1 text-sm">
                    Puedes cerrar esta ventana. La sincronización continuará aunque cierres el navegador.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {isStalled && (
              <Button
                onClick={handleContinue}
                disabled={isContinuing}
                className="flex-1"
              >
                {isContinuing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Reiniciando...
                  </>
                ) : (
                  "Continuar sincronización"
                )}
              </Button>
            )}
            {!isCompleted && !isStalled && (
              <Button
                variant="outline"
                onClick={handleBackground}
                className="flex-1"
              >
                Ejecutar en segundo plano
              </Button>
            )}
            <Button
              onClick={onClose}
              className="flex-1"
              variant={isCompleted ? "default" : "secondary"}
            >
              {isCompleted ? "Cerrar" : "Continuar viendo"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
