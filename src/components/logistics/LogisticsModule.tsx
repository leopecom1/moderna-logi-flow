import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Package, CheckCircle, Clock, MapPin, Truck } from "lucide-react";
import { MessageLoading } from "@/components/ui/message-loading";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface LogisticsMovement {
  id: string;
  order_id: string;
  order_number: string;
  product_id: string;
  product_name: string;
  product_code: string;
  quantity: number;
  source_warehouse_id: string;
  source_warehouse_name: string;
  target_warehouse_id?: string;
  target_warehouse_name: string;
  status: 'pendiente' | 'en_transito' | 'entregado';
  created_at: string;
  customer_name: string;
  delivery_date: string;
}

export function LogisticsModule() {
  const { profile } = useAuth();
  const [movements, setMovements] = useState<LogisticsMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchLogisticsMovements();
  }, []);

  const fetchLogisticsMovements = async () => {
    try {
      setLoading(true);
      
      // Por ahora, crear movimientos de ejemplo basados en las órdenes pendientes
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, order_number, products, delivery_date, customers(name)')
        .eq('status', 'pendiente')
        .limit(10);

      if (ordersError) throw ordersError;

      const mockMovements: LogisticsMovement[] = [];

      orders?.forEach(order => {
        try {
          const products = typeof order.products === 'string' 
            ? JSON.parse(order.products) 
            : (Array.isArray(order.products) ? order.products : []);
          
          products.forEach((product: any, index: number) => {
            if (product.needs_movement) {
              mockMovements.push({
                id: `${order.id}-${index}`,
                order_id: order.id,
                order_number: order.order_number,
                product_id: product.product_id,
                product_name: product.product_name || `Producto ${index + 1}`,
                product_code: `P${index + 1}`,
                quantity: product.quantity || 1,
                source_warehouse_id: product.warehouse_id || 'warehouse_1',
                source_warehouse_name: product.warehouse_name || 'Depósito Central',
                target_warehouse_name: 'Sucursal Destino',
                status: 'pendiente',
                created_at: new Date().toISOString(),
                customer_name: (order as any).customers?.name || 'Cliente',
                delivery_date: order.delivery_date || '',
              });
            }
          });
        } catch (parseError) {
          console.error('Error parsing products:', parseError);
        }
      });

      setMovements(mockMovements);
    } catch (error) {
      console.error('Error fetching logistics movements:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los movimientos logísticos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCollectProduct = async (movement: LogisticsMovement) => {
    if (!profile?.user_id) return;
    
    try {
      setProcessingId(movement.id);
      
      // Crear movimiento interno en la base de datos
      const { error: movementError } = await supabase
        .from('inventory_movements')
        .insert({
          inventory_item_id: null, // Se manejará después
          movement_type: 'movimiento_interno',
          quantity: movement.quantity,
          unit_cost: 0,
          notes: `Recolección para orden ${movement.order_number} - ${movement.product_name}`,
          reference_document: movement.order_number,
          user_id: profile.user_id,
        });

      if (movementError) throw movementError;

      toast({
        title: 'Producto recolectado',
        description: `${movement.product_name} marcado como recolectado`,
      });

      // Actualizar estado local
      setMovements(prev => prev.map(m => 
        m.id === movement.id 
          ? { ...m, status: 'en_transito' }
          : m
      ));

    } catch (error) {
      console.error('Error collecting product:', error);
      toast({
        title: 'Error',
        description: 'No se pudo recolectar el producto',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeliverProduct = async (movement: LogisticsMovement) => {
    if (!profile?.user_id) return;
    
    try {
      setProcessingId(movement.id);
      
      // Crear movimiento de entrega
      const { error: movementError } = await supabase
        .from('inventory_movements')
        .insert({
          inventory_item_id: null, // Se manejará después
          movement_type: 'movimiento_interno',
          quantity: movement.quantity,
          unit_cost: 0,
          notes: `Entrega para orden ${movement.order_number} - ${movement.product_name}`,
          reference_document: movement.order_number,
          user_id: profile.user_id,
        });

      if (movementError) throw movementError;

      toast({
        title: 'Producto entregado',
        description: `${movement.product_name} entregado exitosamente`,
      });

      // Actualizar estado local
      setMovements(prev => prev.map(m => 
        m.id === movement.id 
          ? { ...m, status: 'entregado' }
          : m
      ));

    } catch (error) {
      console.error('Error delivering product:', error);
      toast({
        title: 'Error',
        description: 'No se pudo entregar el producto',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendiente':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>;
      case 'en_transito':
        return <Badge variant="default"><Truck className="h-3 w-3 mr-1" />En Tránsito</Badge>;
      case 'entregado':
        return <Badge variant="outline"><CheckCircle className="h-3 w-3 mr-1" />Entregado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <MessageLoading />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Módulo Logístico</h2>
          <p className="text-muted-foreground">
            Gestión de movimientos de productos entre sucursales
          </p>
        </div>
        <Button variant="outline" onClick={fetchLogisticsMovements}>
          Actualizar
        </Button>
      </div>

      {movements.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay movimientos logísticos</h3>
            <p className="text-muted-foreground">
              No se encontraron productos que requieran movimiento entre sucursales
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Movimientos Requeridos ({movements.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Orden</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Desde</TableHead>
                  <TableHead>Hacia</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fecha Entrega</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell className="font-medium">{movement.order_number}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{movement.product_name}</p>
                        <p className="text-sm text-muted-foreground">{movement.product_code}</p>
                      </div>
                    </TableCell>
                    <TableCell>{movement.quantity}</TableCell>
                    <TableCell>{movement.source_warehouse_name}</TableCell>
                    <TableCell>{movement.target_warehouse_name}</TableCell>
                    <TableCell>{movement.customer_name}</TableCell>
                    <TableCell>
                      {movement.delivery_date && format(new Date(movement.delivery_date), 'dd/MM/yyyy', { locale: es })}
                    </TableCell>
                    <TableCell>{getStatusBadge(movement.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {movement.status === 'pendiente' && (
                          <Button
                            size="sm"
                            onClick={() => handleCollectProduct(movement)}
                            disabled={processingId === movement.id}
                          >
                            {processingId === movement.id ? 'Procesando...' : 'Recolectar'}
                          </Button>
                        )}
                        {movement.status === 'en_transito' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeliverProduct(movement)}
                            disabled={processingId === movement.id}
                          >
                            {processingId === movement.id ? 'Procesando...' : 'Entregar'}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}