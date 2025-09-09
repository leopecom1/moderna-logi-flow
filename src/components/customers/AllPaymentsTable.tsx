import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

interface Payment {
  id: string;
  amount: number;
  payment_method: string;
  status: string;
  paid_at: string | null;
  reference_number: string | null;
  created_at: string;
  order_id: string;
  source: 'order' | 'collection' | 'credit_moderna';
  order_number?: string;
  collection_date?: string;
  installment_info?: string;
}

interface AllPaymentsTableProps {
  customerId: string;
}

export function AllPaymentsTable({ customerId }: AllPaymentsTableProps) {
  const [allPayments, setAllPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllPayments();
  }, [customerId]);

  const fetchAllPayments = async () => {
    try {
      setLoading(true);
      const paymentsData: Payment[] = [];

      // 1. Fetch order payments
      const { data: orders } = await supabase
        .from('orders')
        .select('id, order_number')
        .eq('customer_id', customerId);

      if (orders && orders.length > 0) {
        const orderIds = orders.map(o => o.id);
        const { data: orderPayments } = await supabase
          .from('payments')
          .select('*')
          .in('order_id', orderIds);

        if (orderPayments) {
          orderPayments.forEach(payment => {
            const order = orders.find(o => o.id === payment.order_id);
            paymentsData.push({
              ...payment,
              source: 'order',
              order_number: order?.order_number
            });
          });
        }
      }

      // 2. Fetch collections (cobros)
      const { data: collections } = await supabase
        .from('collections')
        .select('*')
        .eq('customer_id', customerId);

      if (collections) {
        collections.forEach(collection => {
          paymentsData.push({
            id: collection.id,
            amount: collection.amount,
            payment_method: collection.payment_method_type,
            status: collection.collection_status,
            paid_at: collection.collection_time,
            reference_number: collection.payment_reference,
            created_at: collection.created_at,
            order_id: collection.order_id || '',
            source: 'collection',
            collection_date: collection.collection_date,
            order_number: collection.receipt_number
          });
        });
      }

      // 3. Fetch credit moderna payments
      const { data: creditPayments } = await supabase
        .from('credit_moderna_installments')
        .select(`
          *,
          orders!inner(order_number)
        `)
        .eq('customer_id', customerId)
        .eq('status', 'pagado');

      if (creditPayments) {
        creditPayments.forEach(installment => {
          paymentsData.push({
            id: installment.id,
            amount: installment.paid_amount || installment.amount,
            payment_method: 'credito_moderna',
            status: 'completado',
            paid_at: installment.paid_at,
            reference_number: null,
            created_at: installment.created_at,
            order_id: installment.order_id || '',
            source: 'credit_moderna',
            order_number: installment.orders?.order_number,
            installment_info: `Cuota ${installment.installment_number}/${installment.total_installments}`
          });
        });
      }

      // Sort by date (most recent first)
      paymentsData.sort((a, b) => 
        new Date(b.paid_at || b.created_at).getTime() - new Date(a.paid_at || a.created_at).getTime()
      );

      setAllPayments(paymentsData);
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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pendiente: { label: 'Pendiente', variant: 'secondary' as const },
      completado: { label: 'Completado', variant: 'default' as const },
      confirmado: { label: 'Confirmado', variant: 'default' as const },
      fallido: { label: 'Fallido', variant: 'destructive' as const },
      pagado: { label: 'Pagado', variant: 'default' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    return <Badge variant={config?.variant || 'secondary'}>{config?.label || status}</Badge>;
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods = {
      efectivo: 'Efectivo',
      tarjeta_credito: 'Tarjeta de Crédito',
      tarjeta_debito: 'Tarjeta de Débito',
      transferencia: 'Transferencia',
      credito_moderna: 'Crédito Moderna',
      cheque: 'Cheque',
      mercado_pago: 'Mercado Pago'
    };
    return methods[method as keyof typeof methods] || method;
  };

  const getSourceLabel = (source: string) => {
    const sources = {
      order: 'Orden',
      collection: 'Cobro',
      credit_moderna: 'Crédito Moderna'
    };
    return sources[source as keyof typeof sources] || source;
  };

  if (loading) {
    return <div className="text-center py-4">Cargando pagos...</div>;
  }

  return (
    <>
      {allPayments.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Referencia</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Método</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Detalles</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allPayments.map((payment) => (
              <TableRow key={`${payment.source}-${payment.id}`}>
                <TableCell>
                  {payment.paid_at ? 
                    new Date(payment.paid_at).toLocaleDateString() : 
                    new Date(payment.created_at).toLocaleDateString()
                  }
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {getSourceLabel(payment.source)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {payment.order_number || payment.reference_number || '-'}
                </TableCell>
                <TableCell>
                  <span className="font-medium">${Number(payment.amount).toFixed(2)}</span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {getPaymentMethodLabel(payment.payment_method)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {getStatusBadge(payment.status)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {payment.installment_info || 
                   payment.collection_date || 
                   (payment.reference_number ? `Ref: ${payment.reference_number}` : '-')
                  }
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          No hay pagos registrados
        </div>
      )}
    </>
  );
}