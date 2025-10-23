import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { ShoppingCart } from 'lucide-react';

interface CreateCustomerOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  customerName: string;
  customerAddress: string;
  onOrderCreated: () => void;
}

export const CreateCustomerOrderModal = ({ 
  open, 
  onOpenChange, 
  customerId, 
  customerName,
  customerAddress,
  onOrderCreated 
}: CreateCustomerOrderModalProps) => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    products: '',
    total_amount: '',
    payment_method: '',
    delivery_date: '',
    delivery_address: customerAddress,
    delivery_neighborhood: '',
    delivery_departamento: '',
    delivery_time_slot: '',
    notes: '',
    cantidad_cuotas: '12',
    dia_pago_cuota: '15',
  });

  useEffect(() => {
    if (open) {
      setFormData(prev => ({
        ...prev,
        delivery_address: customerAddress
      }));
    }
  }, [open, customerAddress]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.products || !formData.total_amount || !formData.payment_method) {
      toast({
        title: 'Error',
        description: 'Por favor completa todos los campos requeridos',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      // Generate order number
      const orderNumber = `ORD-${Date.now()}`;

      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          customer_id: customerId,
          seller_id: profile?.user_id,
          order_number: orderNumber,
          products: JSON.parse(formData.products || '[]'),
          total_amount: parseFloat(formData.total_amount),
          payment_method: formData.payment_method as any,
          delivery_date: formData.delivery_date || null,
          delivery_address: formData.delivery_address,
          delivery_neighborhood: formData.delivery_neighborhood || null,
          delivery_departamento: formData.delivery_departamento || null,
          delivery_time_slot: formData.delivery_time_slot || null,
          notes: formData.notes || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Si es Crédito Moderna, crear las cuotas
      if (formData.payment_method === 'credito_moderna' && formData.cantidad_cuotas && formData.dia_pago_cuota) {
        const installmentsNum = parseInt(formData.cantidad_cuotas);
        const installmentAmount = parseFloat(formData.total_amount) / installmentsNum;
        const firstDueDay = parseInt(formData.dia_pago_cuota);
        
        const creditInstallments = [];
        
        for (let i = 0; i < installmentsNum; i++) {
          // Calcular la fecha de vencimiento basada en el día seleccionado
          const dueDate = new Date();
          dueDate.setMonth(dueDate.getMonth() + i + 1); // Próximo mes + índice
          dueDate.setDate(firstDueDay);
          
          creditInstallments.push({
            customer_id: customerId,
            order_id: order.id, // Usar el ID de la orden creada
            installment_number: i + 1,
            total_installments: installmentsNum,
            amount: installmentAmount,
            due_date: dueDate.toISOString().split('T')[0],
            status: 'pendiente',
            created_by: profile.user_id,
          });
        }

        const { error: creditError } = await supabase
          .from('credit_moderna_installments')
          .insert(creditInstallments);

        if (creditError) {
          console.error('Error creating credit installments:', creditError);
          toast({
            title: 'Orden creada con advertencia',
            description: 'La orden se creó pero hubo un problema al generar las cuotas de crédito. Puede crearlas manualmente.',
            variant: 'default',
          });
        }
      }

      toast({
        title: 'Éxito',
        description: 'Orden creada exitosamente',
      });

      setFormData({
        products: '',
        total_amount: '',
        payment_method: '',
        delivery_date: '',
        delivery_address: customerAddress,
        delivery_neighborhood: '',
        delivery_departamento: '',
        delivery_time_slot: '',
        notes: '',
        cantidad_cuotas: '12',
        dia_pago_cuota: '15',
      });
      
      onOrderCreated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear la orden',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <ShoppingCart className="h-5 w-5" />
            <span>Crear Orden</span>
          </DialogTitle>
          <DialogDescription>
            Crear una nueva orden para {customerName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="products">Productos (JSON)</Label>
            <Textarea
              id="products"
              placeholder='[{"name": "Producto 1", "quantity": 2, "price": 100}]'
              value={formData.products}
              onChange={(e) => handleInputChange('products', e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Formato JSON de productos
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="total_amount">Monto Total</Label>
            <Input
              id="total_amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.total_amount}
              onChange={(e) => handleInputChange('total_amount', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_method">Método de Pago</Label>
            <Select value={formData.payment_method} onValueChange={(value) => handleInputChange('payment_method', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar método de pago" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="efectivo">Efectivo</SelectItem>
                <SelectItem value="tarjeta">Tarjeta de Crédito</SelectItem>
                <SelectItem value="tarjeta_debito">Tarjeta de Débito</SelectItem>
                <SelectItem value="transferencia">Transferencia</SelectItem>
                <SelectItem value="credito">Crédito</SelectItem>
                <SelectItem value="credito_moderna">Crédito Moderna</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Campos adicionales para Crédito Moderna */}
          {formData.payment_method === 'credito_moderna' && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="cantidad_cuotas">Cantidad de Cuotas</Label>
                <Select value={formData.cantidad_cuotas} onValueChange={(value) => handleInputChange('cantidad_cuotas', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cuotas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 cuotas</SelectItem>
                    <SelectItem value="6">6 cuotas</SelectItem>
                    <SelectItem value="12">12 cuotas</SelectItem>
                    <SelectItem value="18">18 cuotas</SelectItem>
                    <SelectItem value="24">24 cuotas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dia_pago_cuota">Día de Pago</Label>
                <Select value={formData.dia_pago_cuota} onValueChange={(value) => handleInputChange('dia_pago_cuota', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Día del mes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">Día 5</SelectItem>
                    <SelectItem value="10">Día 10</SelectItem>
                    <SelectItem value="15">Día 15</SelectItem>
                    <SelectItem value="20">Día 20</SelectItem>
                    <SelectItem value="25">Día 25</SelectItem>
                    <SelectItem value="30">Día 30</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="delivery_date">Fecha de Entrega</Label>
            <Input
              id="delivery_date"
              type="date"
              value={formData.delivery_date}
              onChange={(e) => handleInputChange('delivery_date', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="delivery_address">Dirección de Entrega</Label>
            <Input
              id="delivery_address"
              placeholder="Dirección de entrega"
              value={formData.delivery_address}
              onChange={(e) => handleInputChange('delivery_address', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="delivery_neighborhood">Barrio</Label>
              <Input
                id="delivery_neighborhood"
                placeholder="Barrio"
                value={formData.delivery_neighborhood}
                onChange={(e) => handleInputChange('delivery_neighborhood', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery_departamento">Departamento</Label>
              <Input
                id="delivery_departamento"
                placeholder="Departamento"
                value={formData.delivery_departamento}
                onChange={(e) => handleInputChange('delivery_departamento', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="delivery_time_slot">Horario de Entrega</Label>
            <Select value={formData.delivery_time_slot} onValueChange={(value) => handleInputChange('delivery_time_slot', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar horario" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mañana">Mañana (8:00 - 12:00)</SelectItem>
                <SelectItem value="tarde">Tarde (13:00 - 18:00)</SelectItem>
                <SelectItem value="noche">Noche (19:00 - 22:00)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              placeholder="Notas adicionales sobre la orden"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creando...' : 'Crear Orden'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};