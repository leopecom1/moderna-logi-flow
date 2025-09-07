import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, Calendar, AlertTriangle, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { CreateCreditModernaModal } from "./CreateCreditModernaModal";
import { PagoACuentaModal } from "./PagoACuentaModal";

interface CreditInstallment {
  id: string;
  installment_number: number;
  total_installments: number;
  amount: number;
  due_date: string;
  status: 'pendiente' | 'pagado' | 'vencido';
  paid_at?: string;
  paid_amount?: number;
  notes?: string;
  order_id?: string;
}

interface CustomerInfo {
  id: string;
  name: string;
  phone?: string;
}

interface CustomerCreditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: CustomerInfo | null;
  onRefresh?: () => void;
}

export function CustomerCreditModal({ 
  open, 
  onOpenChange, 
  customer,
  onRefresh 
}: CustomerCreditModalProps) {
  const [installments, setInstallments] = useState<CreditInstallment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const fetchInstallments = async () => {
    if (!customer?.id) return;
    
    console.log("Fetching customer installments for:", customer.id);
    try {
      const { data, error } = await supabase
        .from("credit_moderna_installments")
        .select("*")
        .eq("customer_id", customer.id)
        .order("due_date", { ascending: true });

      console.log("Customer installments result:", { data, error });

      if (error) throw error;

      setInstallments((data || []) as CreditInstallment[]);
    } catch (error) {
      console.error("Error fetching customer credit installments:", error);
      toast.error("Error al cargar las cuotas de crédito");
    } finally {
      setLoading(false);
    }
  };

  const markAsPaid = async (installmentId: string, amount: number) => {
    try {
      const { error } = await supabase
        .from("credit_moderna_installments")
        .update({
          status: 'pagado',
          paid_at: new Date().toISOString(),
          paid_amount: amount
        })
        .eq('id', installmentId);

      if (error) throw error;

      toast.success("Cuota marcada como pagada");
      fetchInstallments();
      onRefresh?.();
    } catch (error) {
      console.error("Error updating installment:", error);
      toast.error("Error al actualizar la cuota");
    }
  };

  const getStatusColor = (status: string, dueDate: string) => {
    if (status === 'pagado') return 'bg-green-500';
    if (status === 'vencido' || (status === 'pendiente' && dueDate < new Date().toISOString().split('T')[0])) {
      return 'bg-red-500';
    }
    return 'bg-yellow-500';
  };

  const getStatusText = (status: string, dueDate: string) => {
    if (status === 'pagado') return 'Pagado';
    if (status === 'vencido' || (status === 'pendiente' && dueDate < new Date().toISOString().split('T')[0])) {
      return 'Vencido';
    }
    return 'Pendiente';
  };

  const calculateSummary = () => {
    const totalPending = installments
      .filter(item => item.status === 'pendiente')
      .reduce((sum, item) => sum + item.amount, 0);

    const totalOverdue = installments
      .filter(item => item.status === 'vencido' || 
        (item.status === 'pendiente' && item.due_date < new Date().toISOString().split('T')[0]))
      .reduce((sum, item) => sum + item.amount, 0);

    const totalPaid = installments
      .filter(item => item.status === 'pagado')
      .reduce((sum, item) => sum + (item.paid_amount || item.amount), 0);

    return { totalPending, totalOverdue, totalPaid };
  };

  const groupedByOrder = installments.reduce((acc, installment) => {
    const key = installment.order_id || 'sin-orden';
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(installment);
    return acc;
  }, {} as Record<string, CreditInstallment[]>);

  useEffect(() => {
    if (open && customer?.id) {
      setLoading(true);
      fetchInstallments();
    }
  }, [open, customer?.id]);

  if (!customer) return null;

  const { totalPending, totalOverdue, totalPaid } = calculateSummary();

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Créditos de {customer.name}
            </DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center min-h-[200px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pendiente</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${totalPending.toLocaleString()}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Vencido</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">${totalOverdue.toLocaleString()}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pagado</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">${totalPaid.toLocaleString()}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Créditos y Cuotas</h3>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => setShowPaymentModal(true)} 
                    variant="outline"
                    className="flex items-center gap-2"
                    disabled={totalPending === 0}
                  >
                    <DollarSign className="h-4 w-4" />
                    Pago a Cuenta
                  </Button>
                  <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Nuevo Crédito
                  </Button>
                </div>
              </div>

              {/* Credits grouped by order */}
              {Object.keys(groupedByOrder).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(groupedByOrder).map(([orderId, orderInstallments]) => (
                    <Card key={orderId}>
                      <CardHeader>
                        <CardTitle className="text-base">
                          {orderId === 'sin-orden' ? 'Crédito Manual' : `Orden: ${orderId.slice(0, 8)}...`}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Cuota</TableHead>
                              <TableHead>Monto</TableHead>
                              <TableHead>Vencimiento</TableHead>
                              <TableHead>Estado</TableHead>
                              <TableHead>Acciones</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {orderInstallments.map((installment) => (
                              <TableRow key={installment.id}>
                                <TableCell>
                                  {installment.installment_number}/{installment.total_installments}
                                </TableCell>
                                <TableCell>${installment.amount.toLocaleString()}</TableCell>
                                <TableCell>
                                  {format(new Date(installment.due_date), "dd/MM/yyyy", { locale: es })}
                                </TableCell>
                                <TableCell>
                                  <Badge className={getStatusColor(installment.status, installment.due_date)}>
                                    {getStatusText(installment.status, installment.due_date)}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {installment.status === 'pendiente' && (
                                    <Button
                                      size="sm"
                                      onClick={() => markAsPaid(installment.id, installment.amount)}
                                    >
                                      Marcar Pagado
                                    </Button>
                                  )}
                                  {installment.status === 'pagado' && installment.paid_at && (
                                    <p className="text-xs text-muted-foreground">
                                      Pagado el {format(new Date(installment.paid_at), "dd/MM/yyyy", { locale: es })}
                                    </p>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Este cliente no tiene cuotas de Crédito Moderna</p>
                  <p className="text-sm">Haga clic en "Nuevo Crédito" para comenzar</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <CreateCreditModernaModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        customerId={customer.id}
        onCreditCreated={() => {
          fetchInstallments();
          onRefresh?.();
        }}
      />

      <PagoACuentaModal
        open={showPaymentModal}
        onOpenChange={setShowPaymentModal}
        customer={customer}
        pendingInstallments={installments.filter(i => i.status === 'pendiente')}
        onPaymentProcessed={() => {
          fetchInstallments();
          onRefresh?.();
        }}
      />
    </>
  );
}