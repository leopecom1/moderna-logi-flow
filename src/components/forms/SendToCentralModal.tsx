import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle } from 'lucide-react';

interface SendToCentralModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  closure: any;
  onSuccess: () => void;
}

export function SendToCentralModal({ open, onOpenChange, closure, onSuccess }: SendToCentralModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount_to_send: '',
    notes: ''
  });

  const availableAmount = closure ? (closure.manual_cash_count || closure.system_calculated_balance) : 0;
  const suggestedAmount = Math.max(0, availableAmount - 1000); // Sugerir dejar 1000 en caja
  
  // Verificar si el monto ingresado incluye el saldo inicial
  const enteredAmount = parseFloat(formData.amount_to_send) || 0;
  const isUsingInitialBalance = enteredAmount > suggestedAmount;
  
  const handleSendAll = () => {
    setFormData({ ...formData, amount_to_send: suggestedAmount.toString() });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount_to_send || !closure) {
      toast({
        title: "Error",
        description: "El monto a enviar es obligatorio",
        variant: "destructive",
      });
      return;
    }

    const amountToSend = parseFloat(formData.amount_to_send);
    if (amountToSend <= 0 || amountToSend > availableAmount) {
      toast({
        title: "Error",
        description: "El monto debe ser mayor a 0 y no exceder el saldo disponible",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const remainingAmount = availableAmount - amountToSend;

      const { error } = await supabase
        .from('daily_cash_closures')
        .update({
          sent_to_central: true,
          sent_to_central_at: new Date().toISOString(),
          sent_to_central_by: user.id,
          amount_sent_to_central: amountToSend,
          remaining_amount: remainingAmount
        })
        .eq('id', closure.id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Dinero enviado a caja central exitosamente",
      });

      setFormData({ amount_to_send: '', notes: '' });
      onSuccess();
    } catch (error) {
      console.error('Error sending to central:', error);
      toast({
        title: "Error",
        description: "Error al enviar dinero a caja central",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!closure) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Enviar a Caja Central</DialogTitle>
          <DialogDescription>
            Envía dinero del cierre diario a la caja central
          </DialogDescription>
        </DialogHeader>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Saldo Disponible:</span>
                <span className="font-semibold">${availableAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Sugerido a Enviar:</span>
                <span className="font-semibold text-primary">${suggestedAmount.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount_to_send">Monto a Enviar *</Label>
            <Input
              id="amount_to_send"
              type="number"
              step="0.01"
              value={formData.amount_to_send}
              onChange={(e) => setFormData({ ...formData, amount_to_send: e.target.value })}
              placeholder={suggestedAmount.toString()}
              max={availableAmount}
            />
            <p className="text-sm text-muted-foreground">
              Máximo: ${availableAmount.toLocaleString()}
            </p>
          </div>

          {/* Botón Enviar Todo */}
          <div className="flex justify-center">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleSendAll}
              className="text-sm"
            >
              Enviar Todo (${suggestedAmount.toLocaleString()})
            </Button>
          </div>

          {/* Advertencia si está usando saldo inicial */}
          {isUsingInitialBalance && enteredAmount > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                ⚠️ Advertencia: Está enviando ${enteredAmount.toLocaleString()}, lo que incluye parte del saldo inicial. 
                Quedará con menos saldo del predeterminado por gerencia ($1,000). 
                Se recomienda enviar solo ${suggestedAmount.toLocaleString()}.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Observaciones</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Observaciones del envío..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar a Central'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}