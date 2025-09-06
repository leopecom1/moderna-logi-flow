import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";

interface ManualCurrencyRateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ManualCurrencyRateModal = ({ open, onOpenChange }: ManualCurrencyRateModalProps) => {
  const [buyRate, setBuyRate] = useState("");
  const [sellRate, setSellRate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSubmit = async () => {
    if (!buyRate || !sellRate) {
      toast({
        title: "Error",
        description: "Por favor complete ambos campos",
        variant: "destructive",
      });
      return;
    }

    const buyRateNum = parseFloat(buyRate);
    const sellRateNum = parseFloat(sellRate);

    if (isNaN(buyRateNum) || isNaN(sellRateNum) || buyRateNum <= 0 || sellRateNum <= 0) {
      toast({
        title: "Error",
        description: "Por favor ingrese valores numéricos válidos",
        variant: "destructive",
      });
      return;
    }

    if (buyRateNum >= sellRateNum) {
      toast({
        title: "Error",
        description: "La cotización de compra debe ser menor que la de venta",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('currency_rates')
        .upsert({
          currency_code: 'USD',
          currency_name: 'Dólar Estadounidense',
          buy_rate: buyRateNum,
          sell_rate: sellRateNum,
          last_updated: new Date().toISOString(),
          is_active: true
        }, {
          onConflict: 'currency_code'
        });

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['currency_rates'] });
      
      toast({
        title: "Cotización actualizada",
        description: "La cotización del dólar se ha actualizado correctamente",
      });

      setBuyRate("");
      setSellRate("");
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating currency rate:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la cotización. Intente nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Ingresar Cotización Manual
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="buyRate">Compra (UYU)</Label>
              <Input
                id="buyRate"
                type="number"
                step="0.01"
                placeholder="40.50"
                value={buyRate}
                onChange={(e) => setBuyRate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sellRate">Venta (UYU)</Label>
              <Input
                id="sellRate"
                type="number"
                step="0.01"
                placeholder="42.50"
                value={sellRate}
                onChange={(e) => setSellRate(e.target.value)}
              />
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            * La cotización de compra debe ser menor que la de venta
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Guardando...' : 'Guardar Cotización'}
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};