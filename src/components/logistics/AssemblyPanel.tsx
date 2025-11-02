import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Camera, CheckCircle, Calendar, Clock, User, Phone, MapPin, Package } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AssemblyOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_id: string;
  delivery_address: string;
  armado_fecha: string;
  armado_horario: string;
  armado_contacto_nombre: string;
  armado_contacto_telefono: string;
  armado_estado: string;
  products: any;
  total_amount: number;
  notes?: string;
  armado_confirmado_at?: string;
  armado_completado_at?: string;
}

interface AssemblyPhoto {
  id: string;
  photo_url: string;
  photo_type: string;
  created_at: string;
  notes?: string;
}

export const AssemblyPanel = () => {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<AssemblyOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<AssemblyOrder | null>(null);
  const [photos, setPhotos] = useState<AssemblyPhoto[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [changeDateModal, setChangeDateModal] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');

  useEffect(() => {
    fetchOrders();
    const subscription = supabase
      .channel('assembly_orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customers (
            name
          )
        `)
        .eq('requiere_armado', true)
        .order('armado_fecha', { ascending: true });

      if (error) throw error;

      const formattedOrders = (data || []).map((order: any) => ({
        id: order.id,
        order_number: order.order_number,
        customer_name: order.customers?.name || 'Cliente desconocido',
        customer_id: order.customer_id,
        delivery_address: order.delivery_address,
        armado_fecha: order.armado_fecha,
        armado_horario: order.armado_horario,
        armado_contacto_nombre: order.armado_contacto_nombre,
        armado_contacto_telefono: order.armado_contacto_telefono,
        armado_estado: order.armado_estado,
        products: order.products,
        total_amount: order.total_amount,
        notes: order.notes,
        armado_confirmado_at: order.armado_confirmado_at,
        armado_completado_at: order.armado_completado_at,
      }));

      setOrders(formattedOrders);
    } catch (error) {
      console.error('Error fetching assembly orders:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los pedidos de armado',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPhotos = async (orderId: string) => {
    try {
      const { data, error } = await supabase
        .from('assembly_photos')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPhotos(data || []);
    } catch (error) {
      console.error('Error fetching photos:', error);
    }
  };

  const handleViewDetails = (order: AssemblyOrder) => {
    setSelectedOrder(order);
    fetchPhotos(order.id);
    setShowDetailModal(true);
  };

  const handleConfirmAssembly = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          armado_estado: 'confirmado',
          armado_confirmado_por: profile?.user_id,
          armado_confirmado_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: 'Confirmado',
        description: 'Asistencia confirmada para este armado',
      });

      fetchOrders();
    } catch (error) {
      console.error('Error confirming assembly:', error);
      toast({
        title: 'Error',
        description: 'No se pudo confirmar la asistencia',
        variant: 'destructive',
      });
    }
  };

  const handleStartAssembly = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          armado_estado: 'en_progreso',
        })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: 'Iniciado',
        description: 'Armado iniciado correctamente',
      });

      fetchOrders();
    } catch (error) {
      console.error('Error starting assembly:', error);
      toast({
        title: 'Error',
        description: 'No se pudo iniciar el armado',
        variant: 'destructive',
      });
    }
  };

  const handleChangeDate = async () => {
    if (!selectedOrder || !newDate || !newTime) {
      toast({
        title: 'Error',
        description: 'Por favor completa la fecha y hora',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          armado_fecha: newDate,
          armado_horario: newTime,
        })
        .eq('id', selectedOrder.id);

      if (error) throw error;

      toast({
        title: 'Fecha actualizada',
        description: 'La fecha de armado se actualizó correctamente',
      });

      setChangeDateModal(false);
      setNewDate('');
      setNewTime('');
      fetchOrders();
    } catch (error) {
      console.error('Error changing date:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cambiar la fecha',
        variant: 'destructive',
      });
    }
  };

  const handleUploadPhoto = async (event: React.ChangeEvent<HTMLInputElement>, photoType: 'progreso' | 'completado') => {
    if (!selectedOrder || !event.target.files || event.target.files.length === 0) return;

    const file = event.target.files[0];
    setUploadingPhoto(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${selectedOrder.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('assembly-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('assembly-photos')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from('assembly_photos')
        .insert({
          order_id: selectedOrder.id,
          photo_url: publicUrl,
          photo_type: photoType,
          uploaded_by: profile?.user_id,
        });

      if (dbError) throw dbError;

      // Si es foto de completado, actualizar el estado del pedido
      if (photoType === 'completado') {
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            armado_estado: 'completado',
            armado_completado_at: new Date().toISOString(),
          })
          .eq('id', selectedOrder.id);

        if (updateError) throw updateError;
      }

      toast({
        title: 'Foto subida',
        description: 'La foto se subió correctamente',
      });

      fetchPhotos(selectedOrder.id);
      fetchOrders();
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: 'Error',
        description: 'No se pudo subir la foto',
        variant: 'destructive',
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pendiente: { label: 'Pendiente', variant: 'outline' },
      confirmado: { label: 'Confirmado', variant: 'secondary' },
      en_progreso: { label: 'En Progreso', variant: 'default' },
      completado: { label: 'Completado', variant: 'default' },
    };

    const config = statusConfig[status] || statusConfig.pendiente;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return <div className="p-6">Cargando pedidos de armado...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{order.order_number}</CardTitle>
                  <p className="text-sm text-muted-foreground">{order.customer_name}</p>
                </div>
                {getStatusBadge(order.armado_estado)}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(order.armado_fecha), 'dd/MM/yyyy', { locale: es })}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                <span>{order.armado_horario}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4" />
                <span>{order.armado_contacto_nombre}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4" />
                <span>{order.armado_contacto_telefono}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4" />
                <span className="line-clamp-1">{order.delivery_address}</span>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={() => handleViewDetails(order)}
                  className="w-full"
                >
                  Ver Detalles
                </Button>
                {order.armado_estado === 'pendiente' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleConfirmAssembly(order.id)}
                    className="w-full"
                  >
                    Confirmar Asistencia
                  </Button>
                )}
                {order.armado_estado === 'confirmado' && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleStartAssembly(order.id)}
                    className="w-full"
                  >
                    Iniciar Armado
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {orders.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No hay pedidos de armado pendientes
          </CardContent>
        </Card>
      )}

      {/* Modal de Detalles */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Armado - {selectedOrder?.order_number}</DialogTitle>
            <DialogDescription>
              {selectedOrder?.customer_name}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Fecha</Label>
                  <p className="font-medium">
                    {format(new Date(selectedOrder.armado_fecha), 'dd/MM/yyyy', { locale: es })}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Horario</Label>
                  <p className="font-medium">{selectedOrder.armado_horario}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Contacto</Label>
                  <p className="font-medium">{selectedOrder.armado_contacto_nombre}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Teléfono</Label>
                  <p className="font-medium">{selectedOrder.armado_contacto_telefono}</p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Dirección</Label>
                <p className="font-medium">{selectedOrder.delivery_address}</p>
              </div>

              <div>
                <Label className="text-muted-foreground">Estado</Label>
                <div className="mt-1">{getStatusBadge(selectedOrder.armado_estado)}</div>
              </div>

              <div>
                <Label className="text-muted-foreground">Productos</Label>
                <div className="mt-2 space-y-2">
                  {JSON.parse(selectedOrder.products).map((product: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                      <Package className="h-4 w-4" />
                      <span className="flex-1">{product.product_name}</span>
                      <Badge variant="outline">x{product.quantity}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              {selectedOrder.notes && (
                <div>
                  <Label className="text-muted-foreground">Notas</Label>
                  <p className="mt-1">{selectedOrder.notes}</p>
                </div>
              )}

              <div className="space-y-3">
                <Label>Acciones</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setChangeDateModal(true);
                      setNewDate(selectedOrder.armado_fecha);
                      setNewTime(selectedOrder.armado_horario);
                    }}
                  >
                    Cambiar Fecha
                  </Button>
                </div>
              </div>

              {selectedOrder.armado_estado === 'en_progreso' && (
                <div className="space-y-3">
                  <Label>Fotos del Progreso</Label>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUploadPhoto(e, 'progreso')}
                      className="hidden"
                      id="progress-photo"
                      disabled={uploadingPhoto}
                    />
                    <label htmlFor="progress-photo">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={uploadingPhoto}
                        asChild
                      >
                        <span>
                          <Camera className="h-4 w-4 mr-2" />
                          Subir Foto de Progreso
                        </span>
                      </Button>
                    </label>
                  </div>
                </div>
              )}

              {(selectedOrder.armado_estado === 'en_progreso' || selectedOrder.armado_estado === 'confirmado') && (
                <div className="space-y-3">
                  <Label>Finalizar Armado</Label>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUploadPhoto(e, 'completado')}
                      className="hidden"
                      id="complete-photo"
                      disabled={uploadingPhoto}
                    />
                    <label htmlFor="complete-photo">
                      <Button
                        type="button"
                        size="sm"
                        disabled={uploadingPhoto}
                        asChild
                      >
                        <span>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Finalizar con Foto
                        </span>
                      </Button>
                    </label>
                  </div>
                </div>
              )}

              {photos.length > 0 && (
                <div className="space-y-3">
                  <Label>Fotos</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {photos.map((photo) => (
                      <div key={photo.id} className="relative">
                        <img
                          src={photo.photo_url}
                          alt="Foto de armado"
                          className="w-full h-40 object-cover rounded"
                        />
                        <Badge
                          className="absolute top-2 right-2"
                          variant={photo.photo_type === 'completado' ? 'default' : 'secondary'}
                        >
                          {photo.photo_type === 'completado' ? 'Completado' : 'Progreso'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal para cambiar fecha */}
      <Dialog open={changeDateModal} onOpenChange={setChangeDateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar Fecha de Armado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new_date">Nueva Fecha</Label>
              <Input
                id="new_date"
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="new_time">Nuevo Horario</Label>
              <Input
                id="new_time"
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setChangeDateModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleChangeDate}>
                Guardar Cambios
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
