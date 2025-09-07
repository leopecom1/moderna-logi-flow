import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface CreateCreditModernaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  orderId?: string;
  paymentId?: string;
  onCreditCreated?: () => void;
}

export function CreateCreditModernaModal({
  open,
  onOpenChange,
  customerId,
  orderId,
  paymentId,
  onCreditCreated,
}: CreateCreditModernaModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [totalAmount, setTotalAmount] = useState<string>("");
  const [installments, setInstallments] = useState<string>("");
  const [firstDueDate, setFirstDueDate] = useState<Date>();
  const [frequency, setFrequency] = useState<"weekly" | "monthly">("monthly");
  const [notes, setNotes] = useState("");

  const calculateInstallmentDates = (firstDate: Date, totalInstallments: number, frequency: "weekly" | "monthly") => {
    const dates: Date[] = [];
    const currentDate = new Date(firstDate);
    
    for (let i = 0; i < totalInstallments; i++) {
      dates.push(new Date(currentDate));
      
      if (frequency === "weekly") {
        currentDate.setDate(currentDate.getDate() + 7);
      } else {
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    }
    
    return dates;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !totalAmount || !installments || !firstDueDate) {
      toast.error("Por favor complete todos los campos requeridos");
      return;
    }

    const totalAmountNum = parseFloat(totalAmount);
    const installmentsNum = parseInt(installments);
    
    if (totalAmountNum <= 0 || installmentsNum <= 0) {
      toast.error("Los montos y cantidad de cuotas deben ser mayores a 0");
      return;
    }

    setLoading(true);

    try {
      const installmentAmount = totalAmountNum / installmentsNum;
      const dueDates = calculateInstallmentDates(firstDueDate, installmentsNum, frequency);
      
      const creditInstallments = dueDates.map((dueDate, index) => ({
        customer_id: customerId,
        payment_id: paymentId || null,
        order_id: orderId || null,
        installment_number: index + 1,
        total_installments: installmentsNum,
        amount: installmentAmount,
        due_date: format(dueDate, "yyyy-MM-dd"),
        status: 'pendiente' as const,
        notes: notes || null,
        created_by: user.id,
      }));

      const { error } = await supabase
        .from("credit_moderna_installments")
        .insert(creditInstallments);

      if (error) throw error;

      toast.success("Cuotas de crédito creadas exitosamente");
      onCreditCreated?.();
      onOpenChange(false);
      
      // Reset form
      setTotalAmount("");
      setInstallments("");
      setFirstDueDate(undefined);
      setFrequency("monthly");
      setNotes("");
    } catch (error) {
      console.error("Error creating credit installments:", error);
      toast.error("Error al crear las cuotas de crédito");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Crear Crédito Moderna</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="totalAmount">Monto Total *</Label>
            <Input
              id="totalAmount"
              type="number"
              step="0.01"
              min="0"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="installments">Cantidad de Cuotas *</Label>
            <Input
              id="installments"
              type="number"
              min="1"
              value={installments}
              onChange={(e) => setInstallments(e.target.value)}
              placeholder="Ej: 12"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Primera Fecha de Vencimiento *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !firstDueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {firstDueDate ? (
                    format(firstDueDate, "dd 'de' MMMM, yyyy", { locale: es })
                  ) : (
                    "Seleccionar fecha"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={firstDueDate}
                  onSelect={setFirstDueDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Frecuencia de Pago</Label>
            <Select value={frequency} onValueChange={(value: "weekly" | "monthly") => setFrequency(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Mensual</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas (Opcional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas adicionales sobre el crédito..."
              rows={3}
            />
          </div>

          {totalAmount && installments && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium">Resumen:</p>
              <p className="text-sm">
                {installments} cuotas de ${(parseFloat(totalAmount) / parseInt(installments)).toFixed(2)} cada una
              </p>
              <p className="text-sm text-muted-foreground">
                Frecuencia: {frequency === "monthly" ? "Mensual" : "Semanal"}
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear Crédito"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}