import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, Calendar, CreditCard, Receipt } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { CreateSupplierPaymentModal } from '@/components/forms/CreateSupplierPaymentModal';
import { EditSupplierPaymentModal } from '@/components/forms/EditSupplierPaymentModal';
import { MainLayout } from '@/components/layout/MainLayout';

interface SupplierPayment {
  id: string;
  purchase_id: string;
  supplier_id: string;
  amount: number;
  payment_date: string;
  due_date: string;
  payment_method: string;
  is_check: boolean;
  check_number?: string;
  check_due_date?: string;
  payment_status: string;
  paid_at?: string;
  receipt_url?: string;
  check_image_url?: string;
  notes?: string;
  suppliers: {
    name: string;
  };
  purchases: {
    purchase_number: string;
  };
}

export default function SupplierPaymentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<SupplierPayment | null>(null);

  const { data: payments = [], isLoading, refetch } = useQuery({
    queryKey: ['supplier-payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supplier_payments')
        .select(`
          *,
          suppliers (name),
          purchases (purchase_number)
        `)
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const filteredPayments = payments.filter(payment =>
    payment.suppliers.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.purchases.purchase_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.check_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingPayments = filteredPayments.filter(p => p.payment_status === 'pendiente');
  const paidPayments = filteredPayments.filter(p => p.payment_status === 'pagado');
  const checkPayments = filteredPayments.filter(p => p.is_check && p.payment_status === 'pendiente');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-UY', {
      style: 'currency',
      currency: 'UYU',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'pagado': return 'bg-green-100 text-green-800';
      case 'vencido': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentMethodIcon = (method: string, isCheck: boolean) => {
    if (isCheck) return <CreditCard className="h-4 w-4" />;
    switch (method) {
      case 'efectivo': return '💵';
      case 'transferencia': return '🏦';
      case 'cheque': return <CreditCard className="h-4 w-4" />;
      default: return '💳';
    }
  };

  const totalPending = pendingPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalPaid = paidPayments.reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <MainLayout>
      <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Pago Proveedores</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Pago
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pagos Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(totalPending)}
            </div>
            <p className="text-xs text-muted-foreground">
              {pendingPayments.length} pagos pendientes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pagos Realizados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalPaid)}
            </div>
            <p className="text-xs text-muted-foreground">
              {paidPayments.length} pagos completados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cheques Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {checkPayments.length}
            </div>
            <p className="text-xs text-muted-foreground">
              cheques por cobrar
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por proveedor, número de compra o cheque..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">Pendientes ({pendingPayments.length})</TabsTrigger>
          <TabsTrigger value="paid">Pagados ({paidPayments.length})</TabsTrigger>
          <TabsTrigger value="checks">Cheques ({checkPayments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pagos Pendientes</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Compra</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Vencimiento</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        {payment.suppliers.name}
                      </TableCell>
                      <TableCell>{payment.purchases.purchase_number}</TableCell>
                      <TableCell>{formatCurrency(payment.amount)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(payment.due_date), 'dd/MM/yyyy', { locale: es })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getPaymentMethodIcon(payment.payment_method, payment.is_check)}
                          {payment.is_check ? `Cheque ${payment.check_number}` : payment.payment_method}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(payment.payment_status)}>
                          {payment.payment_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingPayment(payment)}
                        >
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="paid">
          <Card>
            <CardHeader>
              <CardTitle>Pagos Realizados</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Compra</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Fecha Pago</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Comprobante</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paidPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        {payment.suppliers.name}
                      </TableCell>
                      <TableCell>{payment.purchases.purchase_number}</TableCell>
                      <TableCell>{formatCurrency(payment.amount)}</TableCell>
                      <TableCell>
                        {payment.paid_at && format(new Date(payment.paid_at), 'dd/MM/yyyy', { locale: es })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getPaymentMethodIcon(payment.payment_method, payment.is_check)}
                          {payment.is_check ? `Cheque ${payment.check_number}` : payment.payment_method}
                        </div>
                      </TableCell>
                      <TableCell>
                        {payment.receipt_url && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={payment.receipt_url} target="_blank" rel="noopener noreferrer">
                              <Receipt className="h-4 w-4 mr-2" />
                              Ver
                            </a>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checks">
          <Card>
            <CardHeader>
              <CardTitle>Seguimiento de Cheques</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Número Cheque</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Fecha Cobro</TableHead>
                    <TableHead>Días Restantes</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {checkPayments.map((payment) => {
                    const daysUntilDue = payment.check_due_date 
                      ? Math.ceil((new Date(payment.check_due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                      : 0;
                    
                    return (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">
                          {payment.suppliers.name}
                        </TableCell>
                        <TableCell>{payment.check_number}</TableCell>
                        <TableCell>{formatCurrency(payment.amount)}</TableCell>
                        <TableCell>
                          {payment.check_due_date && format(new Date(payment.check_due_date), 'dd/MM/yyyy', { locale: es })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={daysUntilDue <= 3 ? 'destructive' : daysUntilDue <= 7 ? 'default' : 'secondary'}>
                            {daysUntilDue > 0 ? `${daysUntilDue} días` : 'Vencido'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(payment.payment_status)}>
                            {payment.payment_status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {isCreateModalOpen && (
        <CreateSupplierPaymentModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            refetch();
            setIsCreateModalOpen(false);
          }}
        />
      )}

      {editingPayment && (
        <EditSupplierPaymentModal
          payment={editingPayment}
          isOpen={!!editingPayment}
          onClose={() => setEditingPayment(null)}
          onSuccess={() => {
            refetch();
            setEditingPayment(null);
          }}
        />
      )}
      </div>
    </MainLayout>
  );
}