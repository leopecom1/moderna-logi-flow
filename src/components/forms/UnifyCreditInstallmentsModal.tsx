import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle, DollarSign, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, addMonths, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";

interface CreditOrder {
  id: string;
  order_number: string;
  total_amount: number;
  created_at: string;
  installments: CreditInstallment[];
}

interface CreditInstallment {
  id: string;
  order_id: string;
  installment_number: number;
  total_installments: number;
  amount: number;
  due_date: string;
  status: string; // Changed from union type to string
  customer_id: string;
}

interface UnifyCreditInstallmentsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  onUnificationComplete: () => void;
}

export function UnifyCreditInstallmentsModal({
  open,
  onOpenChange,
  customerId,
  onUnificationComplete,
}: UnifyCreditInstallmentsModalProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [creditOrders, setCreditOrders] = useState<CreditOrder[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [newDueDate, setNewDueDate] = useState("");
  const [newInstallmentCount, setNewInstallmentCount] = useState(1);
  
  const fetchCreditOrders = async () => {
    try {
      setLoading(true);
      
      // Get all installments for this customer grouped by order (not just pending)
      const { data: installments, error } = await supabase
        .from("credit_moderna_installments")
        .select(`
          *,
          orders!inner(id, order_number, total_amount, created_at)
        `)
        .eq("customer_id", customerId)
        .in("status", ["pendiente", "vencido"]) // Include both pending and overdue
        .order("due_date", { ascending: true });

      if (error) throw error;

      // Group installments by order
      const ordersMap = new Map<string, CreditOrder>();
      
      installments?.forEach((installment) => {
        const order = installment.orders as any;
        if (!ordersMap.has(order.id)) {
          ordersMap.set(order.id, {
            id: order.id,
            order_number: order.order_number,
            total_amount: order.total_amount,
            created_at: order.created_at,
            installments: []
          });
        }
        
        const orderData = ordersMap.get(order.id)!;
        orderData.installments.push({
          id: installment.id,
          order_id: installment.order_id,
          installment_number: installment.installment_number,
          total_installments: installment.total_installments,
          amount: installment.amount,
          due_date: installment.due_date,
          status: installment.status,
          customer_id: installment.customer_id
        });
      });

      setCreditOrders(Array.from(ordersMap.values()));
      
      // Auto-select all orders initially
      setSelectedOrders(new Set(Array.from(ordersMap.keys())));
      
      // Set default due date to next month
      const nextMonth = addMonths(new Date(), 1);
      setNewDueDate(format(nextMonth, "yyyy-MM-dd"));
      
    } catch (error) {
      console.error("Error fetching credit orders:", error);
      toast.error("Error al cargar las órdenes con crédito");
    } finally {
      setLoading(false);
    }
  };

  const toggleOrderSelection = (orderId: string) => {
    const newSelection = new Set(selectedOrders);
    if (newSelection.has(orderId)) {
      newSelection.delete(orderId);
    } else {
      newSelection.add(orderId);
    }
    setSelectedOrders(newSelection);
  };

  const getUnificationSummary = () => {
    const selectedOrdersData = creditOrders.filter(order => 
      selectedOrders.has(order.id)
    );
    
    const totalInstallments = selectedOrdersData.reduce(
      (sum, order) => sum + order.installments.length, 0
    );
    
    const totalAmount = selectedOrdersData.reduce(
      (sum, order) => sum + order.installments.reduce(
        (orderSum, inst) => orderSum + inst.amount, 0
      ), 0
    );

    const installmentAmount = totalAmount / newInstallmentCount;
    
    return {
      ordersCount: selectedOrdersData.length,
      totalInstallments,
      totalAmount,
      installmentAmount,
      selectedOrdersData
    };
  };

  const processUnification = async () => {
    if (selectedOrders.size === 0) {
      toast.error("Selecciona al menos una orden");
      return;
    }

    if (!newDueDate) {
      toast.error("Ingresa la nueva fecha de vencimiento");
      return;
    }

    if (!profile?.user_id) {
      toast.error("Usuario no autenticado");
      return;
    }

    try {
      setProcessing(true);
      
      console.log("Starting unification process with user ID:", profile.user_id);
      
      const summary = getUnificationSummary();
      console.log("Unification summary:", summary);
      
      // Get all installment IDs to delete
      const installmentIds: string[] = [];
      summary.selectedOrdersData.forEach(order => {
        order.installments.forEach(inst => {
          installmentIds.push(inst.id);
        });
      });

      // Delete existing installments
      const { error: deleteError } = await supabase
        .from("credit_moderna_installments")
        .delete()
        .in("id", installmentIds);

      if (deleteError) throw deleteError;

      // Create new unified installments
      const newInstallments = [];
      const startDate = parseISO(newDueDate);
      
      for (let i = 1; i <= newInstallmentCount; i++) {
        const dueDate = addMonths(startDate, i - 1);
        
        // For simplicity, we'll create one installment per order selected
        // but with unified due dates and amounts
        summary.selectedOrdersData.forEach(order => {
          newInstallments.push({
            customer_id: customerId,
            order_id: order.id,
            installment_number: i,
            total_installments: newInstallmentCount,
            amount: summary.installmentAmount / summary.selectedOrdersData.length,
            due_date: format(dueDate, "yyyy-MM-dd"),
            status: "pendiente",
            created_by: profile.user_id, // Use user_id from profile
            notes: `Cuota unificada - ${i}/${newInstallmentCount}`
          });
        });
      }

      console.log("New installments to create:", newInstallments);

      const { error: insertError } = await supabase
        .from("credit_moderna_installments")
        .insert(newInstallments);

      if (insertError) throw insertError;

      toast.success("Cuotas unificadas exitosamente");
      onUnificationComplete();
      onOpenChange(false);
      
    } catch (error) {
      console.error("Error unifying installments:", error);
      toast.error("Error al unificar las cuotas");
    } finally {
      setProcessing(false);
    }
  };

  const resetForm = () => {
    setSelectedOrders(new Set());
    setNewDueDate("");
    setNewInstallmentCount(1);
  };

  useEffect(() => {
    if (open) {
      fetchCreditOrders();
    } else {
      resetForm();
    }
  }, [open, customerId]);

  const summary = getUnificationSummary();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Unificar Cuotas de Crédito Moderna</span>
          </DialogTitle>
          <DialogDescription>
            Selecciona las órdenes que deseas unificar y configura las nuevas cuotas
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : creditOrders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No hay órdenes con cuotas pendientes para unificar</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Orders Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Seleccionar Órdenes</h3>
              <div className="grid gap-3">
                {creditOrders.map((order) => (
                  <Card key={order.id} className={`cursor-pointer transition-all ${
                    selectedOrders.has(order.id) ? 'ring-2 ring-primary' : ''
                  }`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            checked={selectedOrders.has(order.id)}
                            onCheckedChange={() => toggleOrderSelection(order.id)}
                          />
                          <div>
                            <CardTitle className="text-base">
                              Orden #{order.order_number}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {format(parseISO(order.created_at), "dd/MM/yyyy", { locale: es })}
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary">
                          {order.installments.length} cuotas pendientes
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex justify-between text-sm">
                        <span>Total a unificar:</span>
                        <span className="font-semibold">
                          ${order.installments.reduce((sum, inst) => sum + inst.amount, 0).toLocaleString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Configuration */}
            {selectedOrders.size > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Configuración de Unificación</h3>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="due-date">Nueva Fecha de Vencimiento</Label>
                      <Input
                        id="due-date"
                        type="date"
                        value={newDueDate}
                        onChange={(e) => setNewDueDate(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="installment-count">Cantidad de Cuotas</Label>
                      <Input
                        id="installment-count"
                        type="number"
                        min="1"
                        max="24"
                        value={newInstallmentCount}
                        onChange={(e) => setNewInstallmentCount(Math.max(1, parseInt(e.target.value) || 1))}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Summary */}
            {selectedOrders.size > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Resumen de Unificación</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Órdenes Seleccionadas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{summary.ordersCount}</div>
                      <p className="text-xs text-muted-foreground">
                        {summary.totalInstallments} cuotas actuales
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center">
                        <DollarSign className="h-4 w-4 mr-2" />
                        Total a Unificar
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        ${summary.totalAmount.toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        Nueva Cuota Mensual
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        ${Math.round(summary.installmentAmount).toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {newInstallmentCount} cuotas
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={processUnification}
                disabled={selectedOrders.size === 0 || !newDueDate || processing}
              >
                {processing ? "Procesando..." : "Unificar Cuotas"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}