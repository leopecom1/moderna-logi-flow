import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { AlertTriangle } from 'lucide-react';

interface DeleteCustomerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
  } | null;
  onCustomerDeleted: () => void;
}

export const DeleteCustomerModal = ({ 
  open, 
  onOpenChange, 
  customer, 
  onCustomerDeleted 
}: DeleteCustomerModalProps) => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!customer || !profile?.id) return;

    try {
      setLoading(true);

      // Check if customer has related records
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id')
        .eq('customer_id', customer.id)
        .limit(1);

      if (ordersError) throw ordersError;

      if (orders && orders.length > 0) {
        toast({
          title: 'No se puede eliminar',
          description: 'Este cliente tiene órdenes asociadas. No se puede eliminar.',
          variant: 'destructive',
        });
        return;
      }

      // Check if customer has movements
      const { data: movements, error: movementsError } = await supabase
        .from('customer_movements')
        .select('id')
        .eq('customer_id', customer.id)
        .limit(1);

      if (movementsError) throw movementsError;

      if (movements && movements.length > 0) {
        // Delete customer movements first
        const { error: deleteMovementsError } = await supabase
          .from('customer_movements')
          .delete()
          .eq('customer_id', customer.id);

        if (deleteMovementsError) throw deleteMovementsError;
      }

      // Delete the customer
      const { error: deleteError } = await supabase
        .from('customers')
        .delete()
        .eq('id', customer.id);

      if (deleteError) throw deleteError;

      toast({
        title: 'Cliente eliminado',
        description: `${customer.name} ha sido eliminado exitosamente`,
      });

      onCustomerDeleted();
      onOpenChange(false);

    } catch (error) {
      console.error('Error deleting customer:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el cliente',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!customer) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <span>¿Eliminar Cliente?</span>
          </AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Se eliminará permanentemente el cliente:
            <div className="mt-2 p-2 bg-muted rounded-md">
              <div className="font-medium">{customer.name}</div>
              {customer.email && <div className="text-sm text-muted-foreground">{customer.email}</div>}
              {customer.phone && <div className="text-sm text-muted-foreground">{customer.phone}</div>}
            </div>
            {/* Warning about related data */}
            <div className="mt-2 text-sm text-amber-600">
              <strong>Nota:</strong> Si el cliente tiene órdenes asociadas, no se podrá eliminar. 
              Los movimientos del cliente se eliminarán automáticamente.
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete}
            disabled={loading}
            className="bg-destructive hover:bg-destructive/90"
          >
            {loading ? 'Eliminando...' : 'Eliminar Cliente'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};