import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Calculator, Calendar } from 'lucide-react';

interface CreditModernaOrderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: CreditModernaData) => void;
  totalAmount: number;
}

export interface CreditModernaData {
  advance_payment: number;
  installment_count: number;
  payment_day: number;
  installments: Array<{
    number: number;
    amount: number;
    due_date: string;
  }>;
}

export const CreditModernaOrderForm = ({ 
  open, 
  onOpenChange, 
  onConfirm, 
  totalAmount 
}: CreditModernaOrderFormProps) => {
  const [formData, setFormData] = useState({
    advance_payment: 0,
    installment_count: 1,
    payment_day: 1,
  });

  const getRemainingAmount = () => {
    return Math.max(0, totalAmount - formData.advance_payment);
  };

  const getInstallmentAmount = () => {
    const remaining = getRemainingAmount();
    return remaining / formData.installment_count;
  };

  const generateInstallments = () => {
    const remaining = getRemainingAmount();
    if (remaining <= 0) return [];

    const installmentAmount = remaining / formData.installment_count;
    const installments = [];

    for (let i = 0; i < formData.installment_count; i++) {
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + i + 1);
      dueDate.setDate(formData.payment_day);

      installments.push({
        number: i + 1,
        amount: installmentAmount,
        due_date: dueDate.toISOString().split('T')[0],
      });
    }

    return installments;
  };

  const handleConfirm = () => {
    const installments = generateInstallments();
    onConfirm({
      advance_payment: formData.advance_payment,
      installment_count: formData.installment_count,
      payment_day: formData.payment_day,
      installments,
    });
  };

  const installments = generateInstallments();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Configurar Crédito Moderna</span>
          </DialogTitle>
          <DialogDescription>
            Configure los detalles del crédito para este pedido
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumen del pedido */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumen del Pedido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between text-lg font-semibold">
                <span>Total del Pedido:</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Configuración de pago */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="advance_payment">Valor a Entregar</Label>
              <Input
                id="advance_payment"
                type="number"
                step="0.01"
                min="0"
                max={totalAmount}
                value={formData.advance_payment}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  advance_payment: parseFloat(e.target.value) || 0 
                }))}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="installment_count">Cantidad de Cuotas</Label>
              <Select 
                value={formData.installment_count.toString()} 
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  installment_count: parseInt(value) 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Cuotas" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 12, 18, 24, 30, 36].map((cuotas) => (
                    <SelectItem key={cuotas} value={cuotas.toString()}>
                      {cuotas} {cuotas === 1 ? 'cuota' : 'cuotas'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_day">Día de Pago</Label>
              <Select 
                value={formData.payment_day.toString()} 
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  payment_day: parseInt(value) 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Día" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((dia) => (
                    <SelectItem key={dia} value={dia.toString()}>
                      {dia}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Resumen de pagos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calculator className="h-4 w-4" />
                <span>Resumen de Pagos</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Pago Inicial</Label>
                  <p className="text-lg font-semibold text-green-600">
                    ${formData.advance_payment.toFixed(2)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Saldo Pendiente</Label>
                  <p className="text-lg font-semibold text-orange-600">
                    ${getRemainingAmount().toFixed(2)}
                  </p>
                </div>
              </div>

              {getRemainingAmount() > 0 && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-sm text-muted-foreground">
                      Valor por Cuota ({formData.installment_count} cuotas)
                    </Label>
                    <p className="text-lg font-semibold text-blue-600">
                      ${getInstallmentAmount().toFixed(2)}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Cronograma de cuotas */}
          {installments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Cronograma de Cuotas</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {installments.map((installment) => (
                    <div 
                      key={installment.number} 
                      className="flex justify-between items-center p-2 bg-muted rounded"
                    >
                      <span className="font-medium">
                        Cuota {installment.number}
                      </span>
                      <div className="text-right">
                        <p className="font-semibold">${installment.amount.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(installment.due_date).toLocaleDateString('es-UY')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botones de acción */}
          <div className="flex justify-end space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="button" 
              onClick={handleConfirm}
              disabled={getRemainingAmount() < 0}
            >
              Confirmar Crédito
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};