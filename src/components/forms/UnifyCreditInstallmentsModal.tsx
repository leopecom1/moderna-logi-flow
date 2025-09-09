import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Merge } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface CreditInstallment {
  id: string;
  order_id: string;
  installment_number: number;
  total_installments: number;
  amount: number;
  due_date: string;
  status: 'pendiente' | 'vencido';
}

interface OrderGroup {
  order_id: string;
  order_number: string;
  installments: CreditInstallment[];
  totalAmount: number;
  selected: boolean;
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
  onUnificationComplete
}: UnifyCreditInstallmentsModalProps) {
  const [orderGroups, setOrderGroups] = useState<OrderGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [newDueDate, setNewDueDate] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (open && customerId) {
      fetchPendingInstallments();
    }
  }, [open, customerId]);

  const fetchPendingInstallments = async () => {
    setLoading(true);
    try {
      const { data: installmentsData, error: installmentsError } = await supabase
        .from('credit_moderna_installments')
        .select(`
          *,
          orders (
            order_number
          )
        `)
        .eq('customer_id', customerId)
        .in('status', ['pendiente', 'vencido'])
        .order('due_date', { ascending: true });

      if (installmentsError) throw installmentsError;

      // Group installments by order
      const groups: { [key: string]: OrderGroup } = {};
      
      installmentsData?.forEach((installment: any) => {
        const orderId = installment.order_id;
        if (!groups[orderId]) {
          groups[orderId] = {
            order_id: orderId,
            order_number: installment.orders?.order_number || `Orden ${orderId.slice(0, 8)}`,
            installments: [],
            totalAmount: 0,
            selected: false
          };
        }
        
        groups[orderId].installments.push({
          id: installment.id,
          order_id: installment.order_id,
          installment_number: installment.installment_number,
          total_installments: installment.total_installments,
          amount: installment.amount,
          due_date: installment.due_date,
          status: installment.status
        });
        
        groups[orderId].totalAmount += installment.amount;
      });

      setOrderGroups(Object.values(groups));
    } catch (error) {
      console.error('Error fetching pending installments:', error);
      toast.error('Error al cargar las cuotas pendientes');
    } finally {
      setLoading(false);
    }
  };

  const toggleOrderSelection = (orderId: string) => {
    setOrderGroups(prev => 
      prev.map(group => 
        group.order_id === orderId 
          ? { ...group, selected: !group.selected }
          : group
      )
    );
  };

  const selectAllOrders = () => {
    const allSelected = orderGroups.every(group => group.selected);
    setOrderGroups(prev => 
      prev.map(group => ({ ...group, selected: !allSelected }))
    );
  };

  const getSelectedSummary = () => {
    const selectedGroups = orderGroups.filter(group => group.selected);
    const totalInstallments = selectedGroups.reduce((sum, group) => sum + group.installments.length, 0);
    const totalAmount = selectedGroups.reduce((sum, group) => sum + group.totalAmount, 0);
    
    return { 
      selectedOrders: selectedGroups.length,
      totalInstallments,
      totalAmount
    };
  };

  const handleUnifyInstallments = async () => {
    const selectedGroups = orderGroups.filter(group => group.selected);
    
    if (selectedGroups.length === 0) {
      toast.error('Selecciona al menos una orden para unificar');
      return;
    }

    if (!newDueDate) {
      toast.error('Selecciona la fecha de vencimiento');
      return;
    }

    setProcessing(true);
    try {
      const { totalAmount } = getSelectedSummary();
      const installmentsToDelete = selectedGroups.flatMap(group => group.installments.map(inst => inst.id));

      // Get current user for created_by field
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Delete existing installments
      const { error: deleteError } = await supabase
        .from('credit_moderna_installments')
        .delete()
        .in('id', installmentsToDelete);

      if (deleteError) throw deleteError;

      // Create new unified installment
      const { error: createError } = await supabase
        .from('credit_moderna_installments')
        .insert({
          customer_id: customerId,
          order_id: selectedGroups[0].order_id, // Use first selected order as reference
          installment_number: 1,
          total_installments: 1,
          amount: totalAmount,
          due_date: newDueDate,
          status: 'pendiente',
          notes: `Unificación de ${selectedGroups.length} órdenes: ${selectedGroups.map(g => g.order_number).join(', ')}`,
          created_by: user.id
        });

      if (createError) throw createError;

      toast.success(`Se unificaron ${installmentsToDelete.length} cuotas en una sola cuota de $${totalAmount.toLocaleString()}`);
      onUnificationComplete();
      onOpenChange(false);
      
    } catch (error) {
      console.error('Error unifying installments:', error);
      toast.error('Error al unificar las cuotas');
    } finally {
      setProcessing(false);
    }
  };

  const summary = getSelectedSummary();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Merge className="h-5 w-5" />
            Unificar Cuotas de Crédito Moderna
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Card */}
            {summary.selectedOrders > 0 && (
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-lg">Resumen de Unificación</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Órdenes seleccionadas:</span>
                    <span className="font-semibold">{summary.selectedOrders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cuotas a unificar:</span>
                    <span className="font-semibold">{summary.totalInstallments}</span>
                  </div>
                  <div className="flex justify-between text-lg">
                    <span>Monto total:</span>
                    <span className="font-bold">${summary.totalAmount.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Select All */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Órdenes con Cuotas Pendientes</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={selectAllOrders}
                disabled={orderGroups.length === 0}
              >
                {orderGroups.every(group => group.selected) ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
              </Button>
            </div>

            {/* Orders List */}
            <div className="space-y-4">
              {orderGroups.map((group) => (
                <Card key={group.order_id} className={`transition-colors ${group.selected ? 'border-primary bg-primary/5' : ''}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={group.selected}
                          onCheckedChange={() => toggleOrderSelection(group.order_id)}
                        />
                        <div>
                          <CardTitle className="text-base">{group.order_number}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {group.installments.length} cuotas pendientes
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">
                        ${group.totalAmount.toLocaleString()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {group.installments.map((installment) => (
                        <div key={installment.id} className="flex justify-between items-center p-2 bg-background rounded border">
                          <span className="text-sm">
                            Cuota {installment.installment_number}/{installment.total_installments}
                          </span>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">${installment.amount.toLocaleString()}</span>
                            <Badge variant={installment.status === 'vencido' ? 'destructive' : 'secondary'} className="text-xs">
                              {format(new Date(installment.due_date), 'dd/MM/yy', { locale: es })}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {orderGroups.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No hay cuotas pendientes para unificar</p>
              </div>
            )}

            {/* New Due Date */}
            {summary.selectedOrders > 0 && (
              <div className="space-y-2">
                <Label htmlFor="dueDate">Nueva fecha de vencimiento</Label>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="dueDate"
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleUnifyInstallments}
                disabled={summary.selectedOrders === 0 || !newDueDate || processing}
              >
                {processing ? 'Unificando...' : `Unificar ${summary.totalInstallments} Cuotas`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}