import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MessageLoading } from '@/components/ui/message-loading';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DollarSign, CreditCard, ArrowRightLeft, Building, Search, Eye, CheckCircle, Filter } from 'lucide-react';
import { MovementDetailModal } from '@/components/forms/MovementDetailModal';
import { CardLiquidationsPanel } from '@/components/forms/CardLiquidationsPanel';
import { CreditCardConfirmModal } from '@/components/forms/CreditCardConfirmModal';

interface FinanceMovement {
  id: string;
  date: string;
  type: 'cobro' | 'pago' | 'transferencia' | 'tarjeta_credito' | 'credito_moderna';
  amount: number;
  description: string;
  customer?: string;
  supplier?: string;
  reference?: string;
  status: string;
  method?: string;
  liquidation_date?: string;
  card_type?: string;
}

const FinancePage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMovement, setSelectedMovement] = useState<FinanceMovement | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreditCardModal, setShowCreditCardModal] = useState(false);
  const [selectedCreditCardPayment, setSelectedCreditCardPayment] = useState<FinanceMovement | null>(null);
  const queryClient = useQueryClient();

  const { data: movements, isLoading, refetch } = useQuery({
    queryKey: ['finance-movements'],
    queryFn: async () => {
      const movements: FinanceMovement[] = [];

      // Fetch collections (cobros)
      const { data: collections } = await supabase
        .from('collections')
        .select(`
          id,
          collection_date,
          amount,
          payment_method_type,
          collection_status,
          payment_reference,
          receipt_number,
          customers:customer_id (name)
        `)
        .order('collection_date', { ascending: false });

      if (collections) {
        collections.forEach((collection: any) => {
          const isModernaCredit = collection.payment_method_type?.toLowerCase().includes('moderna') || 
                                 collection.payment_reference?.toLowerCase().includes('moderna');
          
          movements.push({
            id: collection.id,
            date: collection.collection_date,
            type: isModernaCredit ? 'credito_moderna' : 
                  collection.payment_method_type === 'tarjeta_credito' ? 'tarjeta_credito' : 'cobro',
            amount: collection.amount,
            description: `Cobro - ${collection.customers?.name || 'Cliente'}`,
            customer: collection.customers?.name,
            reference: collection.receipt_number || collection.payment_reference,
            status: collection.collection_status,
            method: collection.payment_method_type
          });
        });
      }

      // Fetch payments (pagos)
      const { data: payments } = await supabase
        .from('payments')
        .select(`
          id,
          created_at,
          amount,
          payment_method,
          status,
          reference_number,
          liquidation_date,
          card_type,
          orders:order_id (
            customers:customer_id (name)
          )
        `)
        .order('created_at', { ascending: false });

      if (payments) {
        payments.forEach((payment: any) => {
          const isTransfer = payment.payment_method?.toLowerCase().includes('transfer') || 
                           payment.payment_method === 'transferencia';
          const isCreditCard = payment.payment_method?.toLowerCase().includes('tarjeta');
          
          movements.push({
            id: payment.id,
            date: format(new Date(payment.created_at), 'yyyy-MM-dd'),
            type: isTransfer ? 'transferencia' : isCreditCard ? 'tarjeta_credito' : 'pago',
            amount: payment.amount,
            description: `Pago - ${payment.orders?.customers?.name || 'Cliente'}`,
            customer: payment.orders?.customers?.name,
            reference: payment.reference_number,
            status: payment.status,
            method: payment.payment_method,
            liquidation_date: payment.liquidation_date,
            card_type: payment.card_type
          });
        });
      }

      // Fetch supplier payments
      const { data: supplierPayments } = await supabase
        .from('supplier_payments')
        .select(`
          id,
          payment_date,
          amount,
          payment_method,
          payment_status,
          suppliers:supplier_id (name)
        `)
        .order('payment_date', { ascending: false });

      if (supplierPayments) {
        supplierPayments.forEach((payment: any) => {
          const isTransfer = payment.payment_method?.toLowerCase().includes('transfer') || 
                           payment.payment_method === 'transferencia';
          
          movements.push({
            id: payment.id,
            date: payment.payment_date,
            type: isTransfer ? 'transferencia' : 'pago',
            amount: -payment.amount, // Negative for outgoing payments
            description: `Pago a proveedor - ${payment.suppliers?.name || 'Proveedor'}`,
            supplier: payment.suppliers?.name,
            status: payment.payment_status,
            method: payment.payment_method
          });
        });
      }

      // Fetch orders with bank transfers (pending payments)
      const { data: orders } = await supabase
        .from('orders')
        .select(`
          id,
          created_at,
          total_amount,
          payment_method,
          status,
          order_number,
          customers:customer_id (name)
        `)
        .eq('payment_method', 'transferencia')
        .order('created_at', { ascending: false });

      console.log('Orders with transferencia:', orders);

      if (orders) {
        orders.forEach((order: any) => {
          const movement: FinanceMovement = {
            id: order.id,
            date: format(new Date(order.created_at), 'yyyy-MM-dd'),
            type: 'transferencia' as const,
            amount: order.total_amount,
            description: `Orden pendiente - ${order.customers?.name || 'Cliente'}`,
            customer: order.customers?.name,
            reference: order.order_number,
            status: order.status === 'pendiente' ? 'pendiente' : order.status,
            method: order.payment_method
          };
          console.log('Adding order movement:', movement);
          movements.push(movement);
        });
      }

      // Sort by date (most recent first)
      return movements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
  });

  const confirmTransferMutation = useMutation({
    mutationFn: async (movementId: string) => {
      // Check if this is an order (transferencia from orders table)
      const movement = movements?.find(m => m.id === movementId);
      
      if (movement?.type === 'transferencia' && movement.reference?.startsWith('PED-')) {
        // This is an order, update the order status
        const { error } = await supabase
          .from('orders')
          .update({ status: 'pago_ingresado' as any })
          .eq('id', movementId);

        if (error) throw error;
      } else {
        // This is a payment, update the payment status
        const { error } = await supabase
          .from('payments')
          .update({ status: 'pagado' })
          .eq('id', movementId);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Transferencia confirmada",
        description: "La transferencia ha sido marcada como confirmada"
      });
      queryClient.invalidateQueries({ queryKey: ['finance-movements'] });
      setShowDetailModal(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo confirmar la transferencia",
        variant: "destructive"
      });
    }
  });

  const confirmCreditCardMutation = useMutation({
    mutationFn: async ({ paymentId, liquidationDate, cardType, amount }: { 
      paymentId: string; 
      liquidationDate: Date; 
      cardType: string; 
      amount: number; 
    }) => {
      // First, update the payment status
      const { error: paymentError } = await supabase
        .from('payments')
        .update({ 
          status: 'pagado',
          liquidation_date: liquidationDate.toISOString().split('T')[0],
          card_type: cardType
        })
        .eq('id', paymentId);

      if (paymentError) throw paymentError;

      // Then, create the card liquidation record
      const { error: liquidationError } = await supabase
        .from('card_liquidations')
        .insert({
          payment_id: paymentId,
          liquidation_date: liquidationDate.toISOString().split('T')[0],
          amount: amount,
          card_type: cardType,
          status: 'pendiente'
        });

      if (liquidationError) throw liquidationError;
    },
    onSuccess: () => {
      toast({
        title: "Pago con tarjeta confirmado",
        description: "Se ha registrado la liquidación de la tarjeta"
      });
      queryClient.invalidateQueries({ queryKey: ['finance-movements'] });
      queryClient.invalidateQueries({ queryKey: ['card-liquidations'] });
      setShowCreditCardModal(false);
      setSelectedCreditCardPayment(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo confirmar el pago con tarjeta",
        variant: "destructive"
      });
    }
  });

  const filteredMovements = movements?.filter(movement => {
    const matchesSearch = movement.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.supplier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.reference?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || movement.type === filterType;
    const matchesStatus = filterStatus === 'all' || movement.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  }) || [];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'cobro':
        return <DollarSign className="h-4 w-4 text-green-500" />;
      case 'pago':
        return <DollarSign className="h-4 w-4 text-red-500" />;
      case 'transferencia':
        return <ArrowRightLeft className="h-4 w-4 text-blue-500" />;
      case 'tarjeta_credito':
        return <CreditCard className="h-4 w-4 text-purple-500" />;
      case 'credito_moderna':
        return <Building className="h-4 w-4 text-orange-500" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      cobro: "default",
      pago: "destructive", 
      transferencia: "secondary",
      tarjeta_credito: "outline",
      credito_moderna: "secondary"
    };

    const labels: Record<string, string> = {
      cobro: "Cobro",
      pago: "Pago",
      transferencia: "Transferencia", 
      tarjeta_credito: "Tarjeta Crédito",
      credito_moderna: "Crédito Moderna"
    };

    return (
      <Badge variant={variants[type] || "default"}>
        {labels[type] || type}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      confirmado: "default",
      pendiente: "secondary",
      pagado: "default",
      pago_ingresado: "default",
      cancelado: "destructive"
    };

    const labels: Record<string, string> = {
      pendiente: "Pendiente",
      confirmado: "Confirmado", 
      pagado: "Pagado",
      pago_ingresado: "Pago Ingresado",
      cancelado: "Cancelado"
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const handleViewDetails = (movement: FinanceMovement) => {
    setSelectedMovement(movement);
    setShowDetailModal(true);
  };

  const handleConfirmTransfer = (movementId: string) => {
    const movement = movements?.find(m => m.id === movementId);
    
    // Check if this is a credit card payment
    if (movement?.type === 'tarjeta_credito') {
      setSelectedCreditCardPayment(movement);
      setShowCreditCardModal(true);
      setShowDetailModal(false);
    } else {
      confirmTransferMutation.mutate(movementId);
    }
  };

  const handleConfirmCreditCard = (data: { liquidationDate: Date; cardType: string }) => {
    if (!selectedCreditCardPayment) return;
    
    confirmCreditCardMutation.mutate({
      paymentId: selectedCreditCardPayment.id,
      liquidationDate: data.liquidationDate,
      cardType: data.cardType,
      amount: selectedCreditCardPayment.amount
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-UY', {
      style: 'currency',
      currency: 'UYU'
    }).format(amount);
  };

  const totalAmount = filteredMovements.reduce((sum, movement) => sum + movement.amount, 0);
  const totalIncome = filteredMovements.filter(m => m.amount > 0).reduce((sum, m) => sum + m.amount, 0);
  const totalOutcome = Math.abs(filteredMovements.filter(m => m.amount < 0).reduce((sum, m) => sum + m.amount, 0));
  const pendingTransfers = filteredMovements.filter(m => m.type === 'transferencia' && m.status === 'pendiente');

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center space-y-4">
            <MessageLoading />
            <p className="text-muted-foreground">Cargando movimientos financieros...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Panel de Finanzas</h1>
            <p className="text-muted-foreground">
              Gestiona todos los movimientos financieros diarios
            </p>
          </div>
        </div>

        <Tabs defaultValue="movements" className="space-y-4">
          <TabsList>
            <TabsTrigger value="movements">Movimientos</TabsTrigger>
            <TabsTrigger value="liquidations">Liquidaciones Tarjetas</TabsTrigger>
          </TabsList>

          <TabsContent value="movements" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Balance Total</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
                  <p className="text-xs text-muted-foreground">
                    Ingresos menos egresos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Ingresos</CardTitle>
                  <DollarSign className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</div>
                  <p className="text-xs text-muted-foreground">
                    Cobros y pagos recibidos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Egresos</CardTitle>
                  <DollarSign className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{formatCurrency(totalOutcome)}</div>
                  <p className="text-xs text-muted-foreground">
                    Pagos realizados
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Transferencias Pendientes</CardTitle>
                  <ArrowRightLeft className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{pendingTransfers.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Esperando confirmación
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filter */}
            <Card>
              <CardHeader>
                <CardTitle>Movimientos Financieros</CardTitle>
                <CardDescription>
                  Historial completo de todos los movimientos financieros
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                  <div className="flex items-center space-x-2 flex-1">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por descripción, cliente, proveedor o referencia..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filtrar por tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los tipos</SelectItem>
                      <SelectItem value="cobro">Cobros</SelectItem>
                      <SelectItem value="pago">Pagos</SelectItem>
                      <SelectItem value="transferencia">Transferencias</SelectItem>
                      <SelectItem value="tarjeta_credito">Tarjetas de Crédito</SelectItem>
                      <SelectItem value="credito_moderna">Crédito Moderna</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filtrar por estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los estados</SelectItem>
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                      <SelectItem value="confirmado">Confirmado</SelectItem>
                      <SelectItem value="pagado">Pagado</SelectItem>
                      <SelectItem value="pago_ingresado">Pago Ingresado</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                        <TableHead>Referencia</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMovements.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground">
                            No se encontraron movimientos financieros
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredMovements.map((movement) => (
                          <TableRow key={movement.id}>
                            <TableCell>
                              {format(new Date(movement.date), 'dd/MM/yyyy', { locale: es })}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                {getTypeIcon(movement.type)}
                                {getTypeBadge(movement.type)}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              {movement.description}
                              {movement.liquidation_date && (
                                <div className="text-xs text-muted-foreground">
                                  Liquidación: {format(new Date(movement.liquidation_date), 'dd/MM/yyyy', { locale: es })}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {movement.method || '-'}
                              {movement.card_type && (
                                <div className="text-xs text-muted-foreground">
                                  {movement.card_type}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className={`text-right font-mono ${
                              movement.amount >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatCurrency(movement.amount)}
                            </TableCell>
                            <TableCell>
                              {movement.reference || '-'}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(movement.status)}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewDetails(movement)}
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                                {(movement.type === 'transferencia' && movement.status === 'pendiente') && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleConfirmTransfer(movement.id)}
                                    disabled={confirmTransferMutation.isPending}
                                  >
                                    <CheckCircle className="h-3 w-3" />
                                  </Button>
                                )}
                                {(movement.type === 'tarjeta_credito' && movement.status === 'pendiente') && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleConfirmTransfer(movement.id)}
                                    disabled={confirmCreditCardMutation.isPending}
                                  >
                                    <CreditCard className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="liquidations">
            <CardLiquidationsPanel />
          </TabsContent>
        </Tabs>

        {/* Detail Modal */}
        <MovementDetailModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          movement={selectedMovement}
          onConfirmTransfer={handleConfirmTransfer}
        />

        {/* Credit Card Confirm Modal */}
        <CreditCardConfirmModal
          isOpen={showCreditCardModal}
          onClose={() => {
            setShowCreditCardModal(false);
            setSelectedCreditCardPayment(null);
          }}
          onConfirm={handleConfirmCreditCard}
          amount={selectedCreditCardPayment?.amount || 0}
          isLoading={confirmCreditCardMutation.isPending}
        />
      </div>
    </MainLayout>
  );
};

export default FinancePage;