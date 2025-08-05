import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { DollarSign } from 'lucide-react';

interface CreateCustomerMovementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  customerName: string;
  onMovementCreated: () => void;
}

export const CreateCustomerMovementModal = ({ 
  open, 
  onOpenChange, 
  customerId, 
  customerName,
  onMovementCreated 
}: CreateCustomerMovementModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    movement_date: new Date().toISOString().split('T')[0],
    balance_amount: '',
    payment_info: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.balance_amount) {
      toast({
        title: 'Error',
        description: 'El monto es requerido',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('customer_movements')
        .insert({
          customer_id: customerId,
          movement_date: formData.movement_date,
          balance_amount: parseFloat(formData.balance_amount),
          payment_info: formData.payment_info || null,
        });

      if (error) throw error;

      toast({
        title: 'Éxito',
        description: 'Movimiento creado exitosamente',
      });

      setFormData({
        movement_date: new Date().toISOString().split('T')[0],
        balance_amount: '',
        payment_info: '',
      });
      
      onMovementCreated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating movement:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear el movimiento',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>Crear Movimiento</span>
          </DialogTitle>
          <DialogDescription>
            Crear un nuevo movimiento para {customerName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="movement_date">Fecha del Movimiento</Label>
            <Input
              id="movement_date"
              type="date"
              value={formData.movement_date}
              onChange={(e) => handleInputChange('movement_date', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="balance_amount">Monto</Label>
            <Input
              id="balance_amount"
              type="number"
              step="0.01"
              placeholder="Ingrese el monto (positivo para crédito, negativo para débito)"
              value={formData.balance_amount}
              onChange={(e) => handleInputChange('balance_amount', e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Positivo para crédito a favor del cliente, negativo para débito
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_info">Información de Pago (Opcional)</Label>
            <Textarea
              id="payment_info"
              placeholder="Descripción del movimiento, referencia, etc."
              value={formData.payment_info}
              onChange={(e) => handleInputChange('payment_info', e.target.value)}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creando...' : 'Crear Movimiento'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};