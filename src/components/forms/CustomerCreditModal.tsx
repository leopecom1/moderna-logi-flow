import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DollarSign, Calendar, AlertTriangle, CreditCard, ChevronDown, ChevronRight } from "lucide-react";
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
  unified_installment_id?: string;
  is_unified_source?: boolean;
}

interface OrderInfo {
  id: string;
  order_number: string;
  created_at: string;
  total_amount: number;
  products: any;
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
  const [unifiedInstallments, setUnifiedInstallments] = useState<CreditInstallment[]>([]);
  const [orders, setOrders] = useState<Record<string, OrderInfo>>({});
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [expandedUnified, setExpandedUnified] = useState<Record<string, boolean>>({});

  const fetchInstallments = async () => {
    if (!customer?.id) return;
    
    console.log("Fetching customer installments for:", customer.id);
    try {
      // Fetch regular installments (not unified or source)
      const { data: regularData, error: regularError } = await supabase
        .from("credit_moderna_installments")
        .select("*")
        .eq("customer_id", customer.id)
        .or("is_unified_source.is.null,is_unified_source.eq.false")
        .not("order_id", "is", null)
        .order("due_date", { ascending: true });

      // Fetch unified installments (order_id is null)
      const { data: unifiedData, error: unifiedError } = await supabase
        .from("credit_moderna_installments")
        .select("*")
        .eq("customer_id", customer.id)
        .is("order_id", null)
        .eq("is_unified_source", false)
        .order("due_date", { ascending: true });

      if (regularError) throw regularError;
      if (unifiedError) throw unifiedError;

      console.log("Customer installments result:", { data: regularData, error: regularError });
      console.log("Unified installments result:", { data: unifiedData, error: unifiedError });
      console.log("Installments count:", (regularData?.length || 0) + (unifiedData?.length || 0));

      const regularInstallments = (regularData || []) as CreditInstallment[];
      const unifiedInstallmentsData = (unifiedData || []) as CreditInstallment[];
      
      console.log("Setting installments:", regularInstallments);
      console.log("Setting unified installments:", unifiedInstallmentsData);
      
      setInstallments(regularInstallments);
      setUnifiedInstallments(unifiedInstallmentsData);

      // Fetch order details for regular installments
      const orderIds = [...new Set(regularInstallments.map(i => i.order_id).filter(Boolean))] as string[];
      if (orderIds.length > 0) {
        const { data: ordersData, error: ordersError } = await supabase
          .from("orders")
          .select("id, order_number, created_at, total_amount, products")
          .in("id", orderIds);

        if (ordersError) {
          console.error("Error fetching orders:", ordersError);
        } else {
          const ordersMap: Record<string, OrderInfo> = {};
          ordersData?.forEach(order => {
            ordersMap[order.id] = order;
          });
          setOrders(ordersMap);
        }
      }
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
    const allInstallments = [...installments, ...unifiedInstallments];
    
    const totalPending = allInstallments
      .filter(item => item.status === 'pendiente')
      .reduce((sum, item) => sum + item.amount, 0);

    const totalOverdue = allInstallments
      .filter(item => item.status === 'vencido' || 
        (item.status === 'pendiente' && item.due_date < new Date().toISOString().split('T')[0]))
      .reduce((sum, item) => sum + item.amount, 0);

    const totalPaid = allInstallments
      .filter(item => item.status === 'pagado')
      .reduce((sum, item) => sum + (item.paid_amount || item.amount), 0);

    const uniqueRegularOrders = new Set(installments.map(item => item.order_id).filter(Boolean));
    const uniqueUnifiedGroups = new Set(unifiedInstallments.map(item => item.notes).filter(Boolean));
    const totalOrders = uniqueRegularOrders.size + uniqueUnifiedGroups.size;
    
    const totalInstallments = allInstallments.length;
    const pendingInstallments = allInstallments.filter(item => item.status === 'pendiente').length;
    const paidInstallments = allInstallments.filter(item => item.status === 'pagado').length;

    return { 
      totalPending, 
      totalOverdue, 
      totalPaid, 
      totalOrders, 
      totalInstallments, 
      pendingInstallments, 
      paidInstallments 
    };
  };

  const { 
    totalPending, 
    totalOverdue, 
    totalPaid, 
    totalOrders, 
    totalInstallments, 
    pendingInstallments, 
    paidInstallments 
  } = calculateSummary();

  useEffect(() => {
    if (open && customer?.id) {
      setLoading(true);
      fetchInstallments();
    }
  }, [open, customer?.id]);

  if (!customer) return null;

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
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Compras</CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalOrders}</div>
                    <p className="text-xs text-muted-foreground">órdenes con crédito</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Cuotas</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalInstallments}</div>
                    <p className="text-xs text-muted-foreground">{pendingInstallments} pendientes, {paidInstallments} pagadas</p>
                  </CardContent>
                </Card>

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
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Total de cuotas encontradas: {installments.length}
                </div>
                {installments.length > 0 ? (
                  <div className="space-y-6">
                    {/* Group installments by order_id */}
                    {Object.entries(
                      installments.reduce((groups, installment) => {
                        const orderId = installment.order_id || 'manual';
                        if (!groups[orderId]) {
                          groups[orderId] = [];
                        }
                        groups[orderId].push(installment);
                        return groups;
                      }, {} as Record<string, CreditInstallment[]>)
                    ).map(([orderId, creditInstallments]) => {
                      const sortedInstallments = creditInstallments.sort((a, b) => a.installment_number - b.installment_number);
                      const firstInstallment = sortedInstallments[0];
                      const creditTotal = creditInstallments.reduce((sum, inst) => sum + inst.amount, 0);
                      const paidAmount = creditInstallments
                        .filter(inst => inst.status === 'pagado')
                        .reduce((sum, inst) => sum + (inst.paid_amount || inst.amount), 0);
                      const pendingAmount = creditInstallments
                        .filter(inst => inst.status === 'pendiente')
                        .reduce((sum, inst) => sum + inst.amount, 0);

                      const orderInfo = orders[orderId];
                      const isExpanded = expandedOrders[orderId] || false;

                      return (
                        <Card key={orderId}>
                          <Collapsible 
                            open={isExpanded} 
                            onOpenChange={(open) => setExpandedOrders(prev => ({ ...prev, [orderId]: open }))}
                          >
                            <CollapsibleTrigger asChild>
                              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                      <CreditCard className="h-4 w-4" />
                                      <CardTitle className="text-base">
                                        {orderId === 'manual' ? 'Crédito Manual' : (orderInfo ? `Orden: ${orderInfo.order_number}` : `Orden: ${orderId.slice(0, 8)}...`)}
                                      </CardTitle>
                                    </div>
                                    
                                    {orderInfo && (
                                      <div className="text-sm text-muted-foreground space-y-1">
                                        <p>Fecha: {format(new Date(orderInfo.created_at), "dd/MM/yyyy HH:mm", { locale: es })}</p>
                                        <p>Total de la orden: ${orderInfo.total_amount.toLocaleString()}</p>
                                        <div>
                                          <p className="font-medium">Productos:</p>
                                          <div className="ml-2">
                                            {Array.isArray(orderInfo.products) && orderInfo.products?.map((product: any, index: number) => (
                                              <p key={index} className="text-xs">
                                                • {product.name} (Cant: {product.quantity}) - ${(product.price * product.quantity).toLocaleString()}
                                              </p>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                    
                                    <p className="text-sm text-muted-foreground mt-2">
                                      {firstInstallment.total_installments} cuotas • Total crédito: ${creditTotal.toLocaleString()}
                                    </p>
                                  </div>
                                  
                                  <div className="text-right">
                                    <div className="text-sm">
                                      <span className="text-green-600 font-medium">${paidAmount.toLocaleString()}</span>
                                      <span className="text-muted-foreground"> / </span>
                                      <span className="text-orange-600 font-medium">${pendingAmount.toLocaleString()}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Pagado / Pendiente</p>
                                  </div>
                                </div>
                              </CardHeader>
                            </CollapsibleTrigger>
                            
                            <CollapsibleContent>
                              <CardContent className="pt-0">
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
                                    {sortedInstallments.map((installment) => (
                                      <TableRow key={installment.id}>
                                        <TableCell>
                                          {installment.installment_number}/{installment.total_installments}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                          ${installment.amount.toLocaleString()}
                                        </TableCell>
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
                            </CollapsibleContent>
                          </Collapsible>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Este cliente no tiene cuotas de Crédito Moderna</p>
                    <p className="text-sm">Haga clic en "Nuevo Crédito" para comenzar</p>
                  </div>
                )}
              </div>
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