import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, DollarSign, Calendar, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { CreateCreditModernaModal } from "./CreateCreditModernaModal";
import { UnifyCreditInstallmentsModal } from "./UnifyCreditInstallmentsModal";

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
}

interface CreditModernaTabProps {
  customerId: string;
}

export function CreditModernaTab({ customerId }: CreditModernaTabProps) {
  const [installments, setInstallments] = useState<CreditInstallment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUnifyModal, setShowUnifyModal] = useState(false);

  const fetchInstallments = async () => {
    console.log("Fetching customer installments for:", customerId);
    try {
      const { data, error } = await supabase
        .from("credit_moderna_installments")
        .select("*")
        .eq("customer_id", customerId)
        .order("due_date", { ascending: true });

      console.log("Customer installments result:", { data, error });
      console.log("Total installments found:", data?.length || 0);
      console.log("Status breakdown:", data?.reduce((acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>));

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

  const generateMissingInstallments = async () => {
    try {
      // Get orders with credito_moderna that don't have installments
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', customerId)
        .eq('payment_method', 'credito_moderna');

      if (ordersError) throw ordersError;

      if (!orders || orders.length === 0) {
        toast.error('No se encontraron órdenes con crédito moderna');
        return;
      }

      // Get existing installments to check which orders already have them
      const { data: existingInstallments, error: installmentsError } = await supabase
        .from('credit_moderna_installments')
        .select('order_id')
        .eq('customer_id', customerId);

      if (installmentsError) throw installmentsError;

      const existingOrderIds = existingInstallments?.map(inst => inst.order_id) || [];
      const ordersWithoutInstallments = orders.filter(order => !existingOrderIds.includes(order.id));

      console.log('Orders without installments:', ordersWithoutInstallments);

      if (ordersWithoutInstallments.length === 0) {
        toast.success('Todas las órdenes ya tienen sus cuotas generadas');
        return;
      }

      // Get current user profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Usuario no autenticado');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        toast.error('Perfil de usuario no encontrado');
        return;
      }

      // Generate installments for each order without them
      const allNewInstallments = [];

      for (const order of ordersWithoutInstallments) {
        const installmentsNum = 12; // Default 12 installments
        const installmentAmount = order.total_amount / installmentsNum;
        const firstDueDay = 15; // Default day 15

        for (let i = 0; i < installmentsNum; i++) {
          const dueDate = new Date();
          dueDate.setMonth(dueDate.getMonth() + i + 1);
          dueDate.setDate(firstDueDay);

          allNewInstallments.push({
            customer_id: customerId,
            order_id: order.id,
            installment_number: i + 1,
            total_installments: installmentsNum,
            amount: installmentAmount,
            due_date: dueDate.toISOString().split('T')[0],
            status: 'pendiente',
            created_by: profile.user_id,
            notes: 'Cuotas generadas automáticamente'
          });
        }
      }

      console.log('Creating installments:', allNewInstallments);

      const { error: insertError } = await supabase
        .from('credit_moderna_installments')
        .insert(allNewInstallments);

      if (insertError) throw insertError;

      toast.success(`Se generaron cuotas para ${ordersWithoutInstallments.length} órdenes`);
      fetchInstallments();
    } catch (error) {
      console.error('Error generating missing installments:', error);
      toast.error('Error al generar las cuotas faltantes');
    }
  };

  useEffect(() => {
    fetchInstallments();
  }, [customerId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const { totalPending, totalOverdue, totalPaid } = calculateSummary();

  return (
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
        <h3 className="text-lg font-semibold">Cuotas de Crédito Moderna</h3>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setShowUnifyModal(true)}
            disabled={installments.filter(i => i.status === 'pendiente' || i.status === 'vencido').length === 0}
            className="flex items-center gap-2"
          >
            🔄 Unificar Cuotas
          </Button>
          <Button 
            variant="outline"
            onClick={generateMissingInstallments}
            className="flex items-center gap-2"
          >
            ⚡ Generar Cuotas Faltantes
          </Button>
          <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Crear Nuevo Crédito
          </Button>
        </div>
      </div>

      {/* Installments Table */}
      <Card>
        <CardContent className="p-0">
          {installments.length > 0 ? (
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
                {installments.map((installment) => (
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
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Este cliente no tiene cuotas de Crédito Moderna</p>
              <p className="text-sm">Haga clic en "Crear Nuevo Crédito" para comenzar</p>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateCreditModernaModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        customerId={customerId}
        onCreditCreated={fetchInstallments}
      />

      <UnifyCreditInstallmentsModal
        open={showUnifyModal}
        onOpenChange={setShowUnifyModal}
        customerId={customerId}
        onUnificationComplete={fetchInstallments}
      />
    </div>
  );
}