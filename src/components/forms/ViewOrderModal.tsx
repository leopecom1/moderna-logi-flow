import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, User, Phone, MapPin, Package, Wrench } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ViewOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: any;
}

export const ViewOrderModal = ({ open, onOpenChange, order }: ViewOrderModalProps) => {
  if (!order) return null;

  const getStatusConfig = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pendiente: { label: 'Pendiente', variant: 'outline' },
      pendiente_compra: { label: 'Pendiente Compra', variant: 'secondary' },
      movimiento_interno_pendiente: { label: 'Movimiento Interno Pendiente', variant: 'secondary' },
      pendiente_confirmacion_transferencia: { label: 'Pendiente Confirmación', variant: 'secondary' },
      pendiente_envio: { label: 'Pendiente Envío', variant: 'outline' },
      pendiente_retiro: { label: 'Pendiente Retiro', variant: 'outline' },
      armado: { label: 'Armado', variant: 'default' },
      en_ruta: { label: 'En Ruta', variant: 'default' },
      entregado: { label: 'Entregado', variant: 'default' },
      cancelado: { label: 'Cancelado', variant: 'destructive' },
    };

    const config = statusConfig[status] || statusConfig.pendiente;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      efectivo: 'Efectivo',
      transferencia: 'Transferencia',
      tarjeta_credito: 'Tarjeta de Crédito',
      tarjeta_debito: 'Tarjeta de Débito',
      credito_moderna: 'Crédito Moderna',
      cuenta_corriente: 'Cuenta Corriente',
    };
    return methods[method] || method;
  };

  const getArmadoEstadoBadge = (estado: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pendiente: { label: 'Pendiente', variant: 'outline' },
      confirmado: { label: 'Confirmado', variant: 'secondary' },
      en_progreso: { label: 'En Progreso', variant: 'default' },
      completado: { label: 'Completado', variant: 'default' },
    };

    const config = statusConfig[estado] || statusConfig.pendiente;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalles del Pedido - {order.order_number}</DialogTitle>
          <DialogDescription>
            Cliente: {order.customer?.name || 'N/A'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Estado y Pago */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Estado</Label>
              <div className="mt-1">{getStatusConfig(order.status)}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">Método de Pago</Label>
              <p className="font-medium">{getPaymentMethodLabel(order.payment_method)}</p>
            </div>
          </div>

          {/* Monto y Sucursal */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Monto Total</Label>
              <p className="font-medium text-lg">
                ${parseFloat(order.total_amount).toLocaleString('es-UY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Sucursal</Label>
              <p className="font-medium">{order.branch?.name || 'N/A'}</p>
            </div>
          </div>

          <Separator />

          {/* Entrega */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Información de Entrega
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {order.delivery_date && (
                <div>
                  <Label className="text-muted-foreground">Fecha de Entrega</Label>
                  <p className="font-medium">
                    {format(new Date(order.delivery_date + 'T00:00:00'), 'dd/MM/yyyy', { locale: es })}
                  </p>
                </div>
              )}
              {order.delivery_time_slot && (
                <div>
                  <Label className="text-muted-foreground">Horario</Label>
                  <p className="font-medium">{order.delivery_time_slot}</p>
                </div>
              )}
            </div>
            <div>
              <Label className="text-muted-foreground">Dirección</Label>
              <p className="font-medium">{order.delivery_address}</p>
            </div>
            {order.delivery_neighborhood && (
              <div>
                <Label className="text-muted-foreground">Barrio</Label>
                <p className="font-medium">{order.delivery_neighborhood}</p>
              </div>
            )}
            {order.delivery_departamento && (
              <div>
                <Label className="text-muted-foreground">Departamento</Label>
                <p className="font-medium">{order.delivery_departamento}</p>
              </div>
            )}

            {order.retiro_en_sucursal && (
              <Badge variant="secondary" className="w-fit">Retiro en Sucursal</Badge>
            )}
            {order.entregar_ahora && (
              <Badge variant="default" className="w-fit">Entrega Inmediata</Badge>
            )}
          </div>

          {/* Armado - Solo si requiere armado */}
          {order.requiere_armado && (
            <>
              <Separator />
              <div className="space-y-4 bg-muted/50 p-4 rounded-lg">
                <h3 className="font-semibold flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  Información de Armado
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Estado de Armado</Label>
                    <div className="mt-1">{getArmadoEstadoBadge(order.armado_estado)}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Fecha de Armado</Label>
                    <p className="font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(order.armado_fecha + 'T00:00:00'), 'dd/MM/yyyy', { locale: es })}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Horario</Label>
                    <p className="font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {order.armado_horario}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Contacto</Label>
                    <p className="font-medium flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {order.armado_contacto_nombre}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Teléfono</Label>
                    <p className="font-medium flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {order.armado_contacto_telefono}
                    </p>
                  </div>
                </div>
                {order.armado_confirmado_at && (
                  <div>
                    <Label className="text-muted-foreground">Confirmado</Label>
                    <p className="text-sm">
                      {format(new Date(order.armado_confirmado_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </p>
                  </div>
                )}
                {order.armado_completado_at && (
                  <div>
                    <Label className="text-muted-foreground">Completado</Label>
                    <p className="text-sm">
                      {format(new Date(order.armado_completado_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          <Separator />

          {/* Productos */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Package className="h-4 w-4" />
              Productos
            </h3>
            <div className="space-y-2">
              {JSON.parse(order.products).map((product: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded">
                  <div className="flex-1">
                    <p className="font-medium">{product.product_name}</p>
                    {product.warehouse_name && (
                      <p className="text-sm text-muted-foreground">Depósito: {product.warehouse_name}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">x{product.quantity}</Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      ${parseFloat(product.unit_price).toLocaleString('es-UY', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notas */}
          {order.notes && (
            <>
              <Separator />
              <div>
                <Label className="text-muted-foreground">Notas</Label>
                <p className="mt-1">{order.notes}</p>
              </div>
            </>
          )}

          {/* Fechas */}
          <Separator />
          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              <Label className="text-muted-foreground">Creado</Label>
              <p>{format(new Date(order.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Actualizado</Label>
              <p>{format(new Date(order.updated_at), 'dd/MM/yyyy HH:mm', { locale: es })}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
