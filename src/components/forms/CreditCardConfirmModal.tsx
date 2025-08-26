import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreditCardConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { liquidationDate: Date; cardType: string }) => void;
  amount: number;
  isLoading?: boolean;
}

export const CreditCardConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  amount,
  isLoading = false 
}: CreditCardConfirmModalProps) => {
  const [liquidationDate, setLiquidationDate] = useState<Date>();
  const [cardType, setCardType] = useState<string>('');

  const handleConfirm = () => {
    if (!liquidationDate || !cardType) return;
    
    onConfirm({
      liquidationDate,
      cardType
    });
  };

  const handleClose = () => {
    setLiquidationDate(undefined);
    setCardType('');
    onClose();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-UY', {
      style: 'currency',
      currency: 'UYU'
    }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Confirmar Pago con Tarjeta</span>
          </DialogTitle>
          <DialogDescription>
            Ingresa los datos para registrar la liquidación de la tarjeta de crédito.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/20 p-3 rounded-lg">
            <div className="text-sm text-muted-foreground">Monto a liquidar</div>
            <div className="text-2xl font-bold">{formatCurrency(amount)}</div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cardType">Tipo de Tarjeta</Label>
            <Select value={cardType} onValueChange={setCardType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el tipo de tarjeta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="visa">Visa</SelectItem>
                <SelectItem value="mastercard">MasterCard</SelectItem>
                <SelectItem value="american_express">American Express</SelectItem>
                <SelectItem value="cabal">Cabal</SelectItem>
                <SelectItem value="oca">OCA</SelectItem>
                <SelectItem value="creditel">Creditel</SelectItem>
                <SelectItem value="lider">Líder</SelectItem>
                <SelectItem value="club_del_este">Club del Este</SelectItem>
                <SelectItem value="otra">Otra</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Fecha de Cobro Esperada</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !liquidationDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {liquidationDate ? (
                    format(liquidationDate, "dd/MM/yyyy", { locale: es })
                  ) : (
                    <span>Selecciona una fecha</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={liquidationDate}
                  onSelect={setLiquidationDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!liquidationDate || !cardType || isLoading}
          >
            {isLoading ? 'Confirmando...' : 'Confirmar Liquidación'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};