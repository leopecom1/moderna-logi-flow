import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { CreditCard, DollarSign, Clock } from 'lucide-react';

interface Payment {
  id: string;
  amount: number;
  payment_method: string;
  status: string;
  reference_number?: string;
  paid_at?: string;
  liquidated_at?: string;
  notes?: string;
  created_at: string;
  orders: {
    order_number: string;
    delivery_address: string;
  };
}

const PaymentsPage = () => {
  const { profile } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          orders (
            order_number,
            delivery_address
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los pagos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'pagado':
        return 'bg-green-100 text-green-800';
      case 'fallido':
        return 'bg-red-100 text-red-800';
      case 'reembolsado':
        return 'bg-blue-100 text-blue-800';
      case 'liquidado':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'efectivo':
        return 'bg-green-100 text-green-800';
      case 'tarjeta':
        return 'bg-blue-100 text-blue-800';
      case 'transferencia':
        return 'bg-purple-100 text-purple-800';
      case 'mercadopago':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const totalPending = payments
    .filter(p => p.status === 'pendiente')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const totalPaid = payments
    .filter(p => p.status === 'pagado')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Pagos</h1>
          <p className="text-muted-foreground">Gestiona los pagos y cobros del sistema</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pendiente</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalPending.toFixed(2)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cobrado</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalPaid.toFixed(2)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pagos</CardTitle>
              <CreditCard className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{payments.length}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4">
          {payments.map((payment) => (
            <Card key={payment.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">
                      Pedido #{payment.orders.order_number}
                    </CardTitle>
                    <Badge className={getStatusColor(payment.status)}>
                      {payment.status}
                    </Badge>
                    <Badge className={getMethodColor(payment.payment_method)}>
                      {payment.payment_method}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">${payment.amount}</p>
                    {payment.reference_number && (
                      <p className="text-sm text-muted-foreground">
                        Ref: {payment.reference_number}
                      </p>
                    )}
                  </div>
                </div>
                <CardDescription>
                  {payment.orders.delivery_address}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {payment.paid_at && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Clock className="h-4 w-4 text-green-500" />
                      <span>Pagado: {new Date(payment.paid_at).toLocaleString()}</span>
                    </div>
                  )}
                  
                  {payment.liquidated_at && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Clock className="h-4 w-4 text-purple-500" />
                      <span>Liquidado: {new Date(payment.liquidated_at).toLocaleString()}</span>
                    </div>
                  )}
                  
                  {payment.notes && (
                    <p className="text-sm">
                      <strong>Notas:</strong> {payment.notes}
                    </p>
                  )}
                  
                  <p className="text-sm text-muted-foreground">
                    Creado: {new Date(payment.created_at).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {payments.length === 0 && (
          <div className="text-center py-12">
            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay pagos</h3>
            <p className="text-muted-foreground">
              Aún no hay pagos registrados en el sistema
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default PaymentsPage;