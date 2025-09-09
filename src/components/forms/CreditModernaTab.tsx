import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, DollarSign, Calendar, AlertTriangle, Merge, CreditCard, ChevronDown, ChevronRight } from "lucide-react";
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

interface CreditModernaTabProps {
  customerId: string;
}

export function CreditModernaTab({ customerId }: CreditModernaTabProps) {
  const [installments, setInstallments] = useState<CreditInstallment[]>([]);
  const [unifiedInstallments, setUnifiedInstallments] = useState<CreditInstallment[]>([]);
  const [orders, setOrders] = useState<Record<string, OrderInfo>>({});
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUnifyModal, setShowUnifyModal] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [expandedUnified, setExpandedUnified] = useState<Record<string, boolean>>({});

  const fetchInstallments = async () => {
    console.log("Fetching customer installments for:", customerId);
    try {
      // Fetch regular installments (not unified or source)
      const { data: regularData, error: regularError } = await supabase
        .from("credit_moderna_installments")
        .select("*")
        .eq("customer_id", customerId)
        .or("is_unified_source.is.null,is_unified_source.eq.false")
        .not("order_id", "is", null)
        .order("due_date", { ascending: true });

      // Fetch unified installments (order_id is null)
      const { data: unifiedData, error: unifiedError } = await supabase
        .from("credit_moderna_installments")
        .select("*")
        .eq("customer_id", customerId)
        .is("order_id", null)
        .eq("is_unified_source", false)
        .order("due_date", { ascending: true });

      if (regularError) throw regularError;
      if (unifiedError) throw unifiedError;

      console.log("Regular installments result:", { data: regularData, error: regularError });
      console.log("Unified installments result:", { data: unifiedData, error: unifiedError });

      const regularInstallments = (regularData || []) as CreditInstallment[];
      const unifiedInstallmentsData = (unifiedData || []) as CreditInstallment[];
      
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

    return { totalPending, totalOverdue, totalPaid };
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
          <div className="flex items-center gap-2">
            {(installments.filter(i => i.status === 'pendiente' || i.status === 'vencido').length > 1 ||
              unifiedInstallments.filter(i => i.status === 'pendiente' || i.status === 'vencido').length > 0) && (
              <Button 
                variant="outline" 
                onClick={() => setShowUnifyModal(true)} 
                className="flex items-center gap-2"
              >
                <Merge className="h-4 w-4" />
                Unificar Cuotas
              </Button>
            )}
            <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Crear Nuevo Crédito
            </Button>
          </div>
        </div>

      {/* Credits grouped by order */}
      <div className="space-y-6">
        {/* Unified Installments Section */}
        {unifiedInstallments.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Merge className="h-5 w-5 text-primary" />
              <h4 className="text-lg font-semibold text-primary">Cuotas Unificadas</h4>
            </div>
            
            {/* Group unified installments by notes (which contains the original orders info) */}
            {Object.entries(
              unifiedInstallments.reduce((groups, installment) => {
                const groupKey = installment.notes || 'sin-grupo';
                if (!groups[groupKey]) {
                  groups[groupKey] = [];
                }
                groups[groupKey].push(installment);
                return groups;
              }, {} as Record<string, CreditInstallment[]>)
            ).map(([groupKey, groupInstallments]) => {
              const sortedInstallments = groupInstallments.sort((a, b) => a.installment_number - b.installment_number);
              const creditTotal = groupInstallments.reduce((sum, inst) => sum + inst.amount, 0);
              const paidAmount = groupInstallments
                .filter(inst => inst.status === 'pagado')
                .reduce((sum, inst) => sum + (inst.paid_amount || inst.amount), 0);
              const pendingAmount = groupInstallments
                .filter(inst => inst.status === 'pendiente')
                .reduce((sum, inst) => sum + inst.amount, 0);

              const isExpanded = expandedUnified[groupKey] || false;

              return (
                <Card key={groupKey} className="border-primary/20 bg-primary/5">
                  <Collapsible 
                    open={isExpanded} 
                    onOpenChange={(open) => setExpandedUnified(prev => ({ ...prev, [groupKey]: open }))}
                  >
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-primary/10 transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              <Merge className="h-4 w-4 text-primary" />
                              <CardTitle className="text-base text-primary">
                                Crédito Unificado
                              </CardTitle>
                            </div>
                            
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p>{groupInstallments[0]?.notes || 'Sin información'}</p>
                            </div>
                            
                            <p className="text-sm text-muted-foreground mt-2">
                              {groupInstallments.length} cuotas • Total: ${creditTotal.toLocaleString()}
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
        )}

        {/* Regular Orders Section */}
        {installments.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              <h4 className="text-lg font-semibold">Órdenes Individuales</h4>
            </div>
            
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
              const isUnified = firstInstallment.is_unified_source;

              return (
                <Card key={orderId} className={isUnified ? "border-orange-200 bg-orange-50" : ""}>
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
                              {isUnified && (
                                <Badge variant="outline" className="text-orange-600 border-orange-600">
                                  Unificado
                                </Badge>
                              )}
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
                              {isUnified && <span className="text-orange-600 ml-2">(Estas cuotas fueron unificadas)</span>}
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
                                    {isUnified && " (Unificado)"}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {installment.status === 'pendiente' && !isUnified && (
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
                                  {isUnified && installment.status === 'pendiente' && (
                                    <p className="text-xs text-muted-foreground">
                                      Parte de cuotas unificadas
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
        ) : !loading && unifiedInstallments.length === 0 && (
          <Card>
            <CardContent className="text-center py-8 text-muted-foreground">
              <p>Este cliente no tiene cuotas de Crédito Moderna</p>
              <p className="text-sm">Haga clic en "Crear Nuevo Crédito" para comenzar</p>
            </CardContent>
          </Card>
        )}
      </div>

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