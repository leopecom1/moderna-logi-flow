import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { useCurrencyRates, syncCurrencyRates } from "@/hooks/useCurrencyRates";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw, DollarSign, TrendingUp, Clock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface CurrencySyncModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CurrencySyncModal = ({ open, onOpenChange }: CurrencySyncModalProps) => {
  const [isSyncing, setIsSyncing] = useState(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Sincronización de Cotizaciones
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
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
                  {usdRate.currency_name}
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

          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleSync}
              disabled={isSyncing}
              className="flex-1"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Sincronizando...' : 'Sincronizar ahora'}
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cerrar
            </Button>
          </div>

          <div className="text-xs text-muted-foreground text-center">
            Las cotizaciones se actualizan automáticamente cada 10 minutos
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};