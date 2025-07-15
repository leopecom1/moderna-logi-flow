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
import { AlertTriangle } from 'lucide-react';

interface CreateIncidentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIncidentCreated: () => void;
}

interface Order {
  id: string;
  order_number: string;
}

interface Delivery {
  id: string;
  order_id: string;
  orders: {
    order_number: string;
  };
}

export const CreateIncidentModal = ({ open, onOpenChange, onIncidentCreated }: CreateIncidentModalProps) => {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    incident_type: '',
    order_id: 'none',
    delivery_id: 'none',
  });

  useEffect(() => {
    if (open) {
      fetchOrders();
      fetchDeliveries();
    }
  }, [open]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchDeliveries = async () => {
    try {
      const { data, error } = await supabase
        .from('deliveries')
        .select(`
          id,
          order_id,
          orders (
            order_number
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setDeliveries(data || []);
    } catch (error) {
      console.error('Error fetching deliveries:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.user_id) return;

    try {
      setLoading(true);

      const incidentData = {
        title: formData.title,
        description: formData.description,
        incident_type: formData.incident_type as 'reclamo' | 'problema_entrega' | 'direccion_incorrecta' | 'cliente_ausente' | 'otro',
        order_id: formData.order_id && formData.order_id !== 'none' ? formData.order_id : null,
        delivery_id: formData.delivery_id && formData.delivery_id !== 'none' ? formData.delivery_id : null,
        reported_by: profile.user_id,
        status: 'abierto' as const,
      };

      const { error } = await supabase
        .from('incidents')
        .insert([incidentData]);

      if (error) throw error;

      toast({
        title: 'Incidencia creada',
        description: 'La incidencia ha sido reportada exitosamente',
      });

      onIncidentCreated();
      onOpenChange(false);
      setFormData({
        title: '',
        description: '',
        incident_type: '',
        order_id: 'none',
        delivery_id: 'none',
      });
    } catch (error) {
      console.error('Error creating incident:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear la incidencia',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Reportar Nueva Incidencia</span>
          </DialogTitle>
          <DialogDescription>
            Completa la información para reportar una nueva incidencia
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              placeholder="Resumen breve de la incidencia"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="incident_type">Tipo de Incidencia *</Label>
            <Select value={formData.incident_type} onValueChange={(value) => setFormData(prev => ({ ...prev, incident_type: value }))} required>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reclamo">Reclamo</SelectItem>
                <SelectItem value="problema_entrega">Problema de Entrega</SelectItem>
                <SelectItem value="direccion_incorrecta">Dirección Incorrecta</SelectItem>
                <SelectItem value="cliente_ausente">Cliente Ausente</SelectItem>
                <SelectItem value="otro">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción *</Label>
            <Textarea
              id="description"
              placeholder="Describe detalladamente la incidencia..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              required
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="order">Pedido Relacionado</Label>
              <Select value={formData.order_id} onValueChange={(value) => setFormData(prev => ({ ...prev, order_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar pedido" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ninguno</SelectItem>
                  {orders.map((order) => (
                    <SelectItem key={order.id} value={order.id}>
                      {order.order_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery">Entrega Relacionada</Label>
              <Select value={formData.delivery_id} onValueChange={(value) => setFormData(prev => ({ ...prev, delivery_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar entrega" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ninguna</SelectItem>
                  {deliveries.map((delivery) => (
                    <SelectItem key={delivery.id} value={delivery.id}>
                      Entrega - {delivery.orders.order_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creando...' : 'Reportar Incidencia'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};