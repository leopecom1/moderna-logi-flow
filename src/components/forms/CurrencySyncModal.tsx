import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { useCurrencyRates, syncCurrencyRates } from "@/hooks/useCurrencyRates";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw, DollarSign, TrendingUp, Clock, Plus, History } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ManualCurrencyRateModal } from "./ManualCurrencyRateModal";
import { CurrencyRateHistoryTable } from "./CurrencyRateHistoryTable";

interface CurrencySyncModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CurrencySyncModal = ({ open, onOpenChange }: CurrencySyncModalProps) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: currencyRates, isLoading } = useCurrencyRates();

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncCurrencyRates();
      await queryClient.invalidateQueries({ queryKey: ['currency_rates'] });
      
      toast({
        title: "Cotizaciones actualizadas",
        description: "Las cotizaciones se han sincronizado correctamente con DolarAPI",
      });
    } catch (error) {
      console.error('Error syncing currency rates:', error);
      toast({
        title: "Error",
        description: "No se pudieron actualizar las cotizaciones. Intente nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const usdRate = currencyRates?.find(rate => rate.currency_code === 'USD');

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Gestión de Cotizaciones de Monedas
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Cotización Actual */}
          {isLoading ? (
            <Card>
              <CardContent className="p-4">
                <div className="text-center text-muted-foreground">
                  Cargando cotizaciones...
                </div>
              </CardContent>
            </Card>
          ) : usdRate ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  Cotización Actual - {usdRate.currency_name}
                  <Badge variant="outline">
                    {usdRate.currency_code}
                  </Badge>
                </CardTitle>
                <CardDescription className="flex items-center gap-1 text-xs">
                  <Clock className="h-3 w-3" />
                  Actualizado: {format(new Date(usdRate.last_updated), 'dd/MM/yyyy HH:mm', { locale: es })}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground mb-1">Compra</div>
                    <div className="text-lg font-semibold text-green-600">
                      ${usdRate.buy_rate.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground mb-1">Venta</div>
                    <div className="text-lg font-semibold text-red-600">
                      ${usdRate.sell_rate.toFixed(2)}
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  Fuente: DolarAPI Uruguay
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-4 text-center text-muted-foreground">
                No se encontraron cotizaciones disponibles
              </CardContent>
            </Card>
          )}

          {/* Acciones */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              onClick={handleSync}
              disabled={isSyncing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Sincronizando...' : 'Sincronizar API'}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setShowManualModal(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Ingresar Manual
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2"
            >
              <History className="h-4 w-4" />
              {showHistory ? 'Ocultar' : 'Ver'} Historial
            </Button>
          </div>

          {/* Historial */}
          {showHistory && (
            <div className="mt-6">
              <CurrencyRateHistoryTable />
            </div>
          )}

          <div className="text-xs text-muted-foreground text-center">
            Las cotizaciones se actualizan automáticamente cada 10 minutos desde DolarAPI Uruguay
          </div>

          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cerrar
            </Button>
          </div>
        </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Ingreso Manual */}
      <ManualCurrencyRateModal 
        open={showManualModal}
        onOpenChange={setShowManualModal}
      />
    </>
  );
};