import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DollarSign, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

interface CreditInstallment {
  id: string;
  installment_number: number;
  total_installments: number;
  amount: number;
  due_date: string;
  status: 'pendiente' | 'pagado' | 'vencido';
  order_id?: string;
}

interface CustomerInfo {
  id: string;
  name: string;
  phone?: string;
}

interface PagoACuentaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: CustomerInfo;
  pendingInstallments: CreditInstallment[];
  onPaymentProcessed: () => void;
}

export function PagoACuentaModal({ 
  open, 
  onOpenChange, 
  customer, 
  pendingInstallments,
  onPaymentProcessed 
}: PagoACuentaModalProps) {
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [selectedInstallments, setSelectedInstallments] = useState<Set<string>>(new Set());
  const [processing, setProcessing] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'auto' | 'manual'>('auto');

  const totalPendingAmount = pendingInstallments.reduce((sum, item) => sum + item.amount, 0);
  const selectedTotal = Array.from(selectedInstallments).reduce((sum, id) => {
    const installment = pendingInstallments.find(i => i.id === id);
    return sum + (installment?.amount || 0);
  }, 0);

  const handleSelectInstallment = (installmentId: string, checked: boolean) => {
    const newSelected = new Set(selectedInstallments);
    if (checked) {
      newSelected.add(installmentId);
    } else {
      newSelected.delete(installmentId);
    }
    setSelectedInstallments(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedInstallments(new Set(pendingInstallments.map(i => i.id)));
    } else {
      setSelectedInstallments(new Set());
    }
  };

  const processPayment = async () => {
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Ingrese un monto válido");
      return;
    }

    if (amount > totalPendingAmount) {
      toast.error("El monto excede el total pendiente");
      return;
    }

    if (paymentMode === 'manual' && selectedInstallments.size === 0) {
      toast.error("Seleccione al menos una cuota para pagar");
      return;
    }

    setProcessing(true);

    try {
      if (paymentMode === 'auto') {
        // Distribución automática: pagar cuotas desde las más vencidas
        const sortedInstallments = [...pendingInstallments].sort((a, b) => 
          new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        );

        let remainingAmount = amount;
        const updates = [];

        for (const installment of sortedInstallments) {
          if (remainingAmount <= 0) break;

          if (remainingAmount >= installment.amount) {
            // Pagar cuota completa
            updates.push({
              id: installment.id,
              status: 'pagado',
              paid_at: new Date().toISOString(),
              paid_amount: installment.amount
            });
            remainingAmount -= installment.amount;
          } else {
            // Pago parcial: dividir la cuota
            const paidAmount = remainingAmount;
            const newAmount = installment.amount - paidAmount;

            // Marcar como pagado el monto parcial
            updates.push({
              id: installment.id,
              status: 'pagado',
              paid_at: new Date().toISOString(),
              paid_amount: paidAmount
            });

            // Crear nueva cuota con el saldo restante
            const { error: insertError } = await supabase
              .from("credit_moderna_installments")
              .insert({
                customer_id: customer.id,
                order_id: installment.order_id,
                installment_number: installment.installment_number,
                total_installments: installment.total_installments,
                amount: newAmount,
                due_date: installment.due_date,
                status: 'pendiente',
                created_by: installment.id, // Para referencia
                notes: `Saldo restante de cuota ${installment.installment_number}`
              });

            if (insertError) throw insertError;
            remainingAmount = 0;
          }
        }

        // Ejecutar todas las actualizaciones
        for (const update of updates) {
          const { error } = await supabase
            .from("credit_moderna_installments")
            .update({
              status: update.status,
              paid_at: update.paid_at,
              paid_amount: update.paid_amount
            })
            .eq('id', update.id);

          if (error) throw error;
        }

        toast.success(`Pago de $${amount.toLocaleString()} procesado automáticamente`);

      } else {
        // Pago manual: solo las cuotas seleccionadas
        if (amount !== selectedTotal) {
          toast.error(`El monto debe ser igual al total seleccionado: $${selectedTotal.toLocaleString()}`);
          return;
        }

        for (const installmentId of selectedInstallments) {
          const installment = pendingInstallments.find(i => i.id === installmentId);
          if (!installment) continue;

          const { error } = await supabase
            .from("credit_moderna_installments")
            .update({
              status: 'pagado',
              paid_at: new Date().toISOString(),
              paid_amount: installment.amount
            })
            .eq('id', installmentId);

          if (error) throw error;
        }

        toast.success(`${selectedInstallments.size} cuotas marcadas como pagadas`);
      }

      onPaymentProcessed();
      onOpenChange(false);
      setPaymentAmount("");
      setSelectedInstallments(new Set());

    } catch (error) {
      console.error("Error processing payment:", error);
      toast.error("Error al procesar el pago");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Pago a Cuenta - {customer.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Payment Amount */}
          <div className="space-y-2">
            <Label htmlFor="payment-amount">Monto del Pago</Label>
            <Input
              id="payment-amount"
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="Ingrese el monto"
              min="0"
              step="0.01"
            />
          </div>

          {/* Payment Mode */}
          <div className="space-y-4">
            <Label>Modo de Pago</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="auto-mode"
                  checked={paymentMode === 'auto'}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setPaymentMode('auto');
                      setSelectedInstallments(new Set());
                    }
                  }}
                />
                <Label htmlFor="auto-mode" className="text-sm">
                  Distribución Automática (paga desde las cuotas más vencidas)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="manual-mode"
                  checked={paymentMode === 'manual'}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setPaymentMode('manual');
                    }
                  }}
                />
                <Label htmlFor="manual-mode" className="text-sm">
                  Selección Manual (elegir cuotas específicas)
                </Label>
              </div>
            </div>
          </div>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resumen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Pendiente</p>
                  <p className="font-bold">${totalPendingAmount.toLocaleString()}</p>
                </div>
                {paymentMode === 'manual' && (
                  <div>
                    <p className="text-muted-foreground">Cuotas Seleccionadas</p>
                    <p className="font-bold">${selectedTotal.toLocaleString()}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Monto a Pagar</p>
                  <p className="font-bold">
                    ${paymentAmount ? parseFloat(paymentAmount).toLocaleString() : '0'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Installments List */}
          {paymentMode === 'manual' && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base">Cuotas Pendientes</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={selectedInstallments.size === pendingInstallments.length}
                      onCheckedChange={handleSelectAll}
                    />
                    <Label className="text-sm">Seleccionar Todas</Label>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {pendingInstallments
                    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
                    .map((installment) => (
                    <div key={installment.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={selectedInstallments.has(installment.id)}
                          onCheckedChange={(checked) => handleSelectInstallment(installment.id, checked as boolean)}
                        />
                        <div>
                          <p className="text-sm font-medium">
                            Cuota {installment.installment_number}/{installment.total_installments}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Vence: {format(new Date(installment.due_date), "dd/MM/yyyy", { locale: es })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${installment.amount.toLocaleString()}</p>
                        <Badge 
                          variant="secondary" 
                          className={installment.due_date < new Date().toISOString().split('T')[0] ? 'bg-red-100' : 'bg-yellow-100'}
                        >
                          {installment.due_date < new Date().toISOString().split('T')[0] ? 'Vencida' : 'Pendiente'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={processPayment} 
            disabled={processing || !paymentAmount}
          >
            {processing ? "Procesando..." : "Procesar Pago"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}