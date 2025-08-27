import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DailyCashClosureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cashRegisterId: string;
  onSuccess: () => void;
}

export function DailyCashClosureModal({ open, onOpenChange, cashRegisterId, onSuccess }: DailyCashClosureModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [cashRegister, setCashRegister] = useState<any>(null);
  const [formData, setFormData] = useState({
    manual_cash_count: '',
    card_payments: '',
    transfer_payments: '',
    other_payments: '',
    notes: ''
  });

  useEffect(() => {
    if (open && cashRegisterId) {
      fetchCashRegister();
      fetchTodaysPayments();
    }
  }, [open, cashRegisterId]);

  const fetchCashRegister = async () => {
    try {
      const { data, error } = await supabase
        .from('branch_cash_registers')
        .select('*')
        .eq('id', cashRegisterId)
        .single();

      if (error) throw error;
      setCashRegister(data);
    } catch (error) {
      console.error('Error fetching cash register:', error);
    }
  };

  const fetchTodaysPayments = async () => {
    try {
      // Aquí deberías obtener los pagos del día desde tu tabla de pagos
      // Por ahora utilizamos valores por defecto
      setFormData(prev => ({
        ...prev,
        card_payments: '0',
        transfer_payments: '0',
        other_payments: '0'
      }));
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const calculateSystemBalance = () => {
    if (!cashRegister) return 0;
    
    const cardPayments = parseFloat(formData.card_payments) || 0;
    const transferPayments = parseFloat(formData.transfer_payments) || 0;
    const otherPayments = parseFloat(formData.other_payments) || 0;
    
    return cashRegister.initial_amount + cardPayments + transferPayments + otherPayments;
  };

  const calculateDifference = () => {
    const manualCount = parseFloat(formData.manual_cash_count) || 0;
    const systemBalance = calculateSystemBalance();
    return manualCount - systemBalance;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.manual_cash_count) {
      toast({
        title: "Error",
        description: "El conteo manual es obligatorio",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const systemBalance = calculateSystemBalance();

      const { error } = await supabase
        .from('daily_cash_closures')
        .insert({
          cash_register_id: cashRegisterId,
          opening_balance: cashRegister.initial_amount,
          system_calculated_balance: systemBalance,
          manual_cash_count: parseFloat(formData.manual_cash_count),
          card_payments: parseFloat(formData.card_payments) || 0,
          transfer_payments: parseFloat(formData.transfer_payments) || 0,
          other_payments: parseFloat(formData.other_payments) || 0,
          total_expenses: 0, // Se calculará desde los gastos
          notes: formData.notes.trim() || null,
          closed_by: user.id
        });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Cierre de caja realizado exitosamente",
      });

      setFormData({
        manual_cash_count: '',
        card_payments: '',
        transfer_payments: '',
        other_payments: '',
        notes: ''
      });
      onSuccess();
    } catch (error) {
      console.error('Error creating closure:', error);
      toast({
        title: "Error",
        description: "Error al realizar el cierre de caja",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!cashRegister) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Cierre de Caja Diario</DialogTitle>
          <DialogDescription>
            Realizar el cierre de caja para {cashRegister.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumen del Día</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Saldo Inicial</Label>
                  <p className="text-lg font-semibold">${cashRegister.initial_amount.toLocaleString()}</p>
                </div>
                <div>
                  <Label>Saldo Sistema</Label>
                  <p className="text-lg font-semibold">${calculateSystemBalance().toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="card_payments">Pagos con Tarjeta</Label>
              <Input
                id="card_payments"
                type="number"
                step="0.01"
                value={formData.card_payments}
                onChange={(e) => setFormData({ ...formData, card_payments: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="transfer_payments">Transferencias</Label>
              <Input
                id="transfer_payments"
                type="number"
                step="0.01"
                value={formData.transfer_payments}
                onChange={(e) => setFormData({ ...formData, transfer_payments: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="other_payments">Otros Pagos</Label>
            <Input
              id="other_payments"
              type="number"
              step="0.01"
              value={formData.other_payments}
              onChange={(e) => setFormData({ ...formData, other_payments: e.target.value })}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="manual_cash_count">Conteo Manual de Efectivo *</Label>
            <Input
              id="manual_cash_count"
              type="number"
              step="0.01"
              value={formData.manual_cash_count}
              onChange={(e) => setFormData({ ...formData, manual_cash_count: e.target.value })}
              placeholder="0.00"
            />
          </div>

          {formData.manual_cash_count && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Label>Diferencia</Label>
                  <p className={`text-2xl font-bold ${calculateDifference() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${calculateDifference().toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Observaciones</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Observaciones adicionales..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Procesando...' : 'Realizar Cierre'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}