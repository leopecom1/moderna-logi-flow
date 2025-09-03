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
      
      console.log('🚚 Fetching logistics movements...');
      
      // Obtener órdenes pendientes
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, order_number, products, delivery_date, customers(name)')
        .eq('status', 'pendiente')
        .limit(10);

      console.log('📋 Orders fetched:', { orders, ordersError });

      if (ordersError) throw ordersError;

      // Obtener datos reales de inventario
      const { data: inventoryItems, error: inventoryError } = await supabase
        .from('inventory_items')
        .select(`
          id,
          product_id,
          warehouse_id,
          current_stock,
          products!inner(id, name, code),
          warehouses!inner(id, name)
        `);

      console.log('📦 Inventory items fetched:', { inventoryItems, inventoryError });

      if (inventoryError) throw inventoryError;

      const mockMovements: LogisticsMovement[] = [];

      // Crear algunos movimientos de prueba basados en inventario real
      if (inventoryItems && inventoryItems.length > 0) {
        inventoryItems.slice(0, 3).forEach((item, index) => {
          const movement = {
            id: `movement-${index}`,
            order_id: `order-${index}`,
            order_number: `PED-${Date.now()}-${index}`,
            product_id: item.product_id,
            product_name: (item as any).products?.name || 'Producto',
            product_code: (item as any).products?.code || 'COD',
            quantity: 1,
            source_warehouse_id: item.warehouse_id,
            source_warehouse_name: (item as any).warehouses?.name || 'Depósito',
            target_warehouse_name: 'Sucursal Destino',
            status: 'pendiente' as const,
            created_at: new Date().toISOString(),
            customer_name: 'Cliente de Prueba',
            delivery_date: new Date().toISOString(),
          };
          
          console.log('🔄 Creating movement for real inventory item:', movement);
          mockMovements.push(movement);
        });
      }

      console.log('📊 Generated movements based on real inventory:', mockMovements);
      setMovements(mockMovements);
    } catch (error) {
      console.error('❌ Error fetching logistics movements:', error);
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
      
      console.log('🔍 Attempting to collect product:', {
        productId: movement.product_id,
        sourceWarehouseId: movement.source_warehouse_id,
        movement: movement
      });
      
      // Primero obtener el inventory_item_id correcto
      const { data: inventoryItem, error: inventoryError } = await supabase
        .from('inventory_items')
        .select('id, current_stock')
        .eq('product_id', movement.product_id)
        .eq('warehouse_id', movement.source_warehouse_id)
        .single();

      console.log('🏪 Inventory item query result:', {
        inventoryItem,
        inventoryError,
        productId: movement.product_id,
        warehouseId: movement.source_warehouse_id
      });

      if (inventoryError || !inventoryItem) {
        console.error('❌ Inventory item not found:', inventoryError);
        throw new Error(`No se encontró el item de inventario para producto ${movement.product_name}`);
      }

      if (inventoryItem.current_stock < movement.quantity) {
        throw new Error(`Stock insuficiente. Disponible: ${inventoryItem.current_stock}, Requerido: ${movement.quantity}`);
      }

      console.log('✅ Found inventory item:', inventoryItem.id);

      // Crear movimiento interno en la base de datos
      const movementData = {
        inventory_item_id: inventoryItem.id,
        movement_type: 'entrada',
        quantity: movement.quantity,
        unit_cost: 0,
        notes: `Recolección para orden ${movement.order_number} - ${movement.product_name}`,
        reference_document: movement.order_number,
        user_id: profile.user_id,
      };

      console.log('📦 Creating movement with data:', movementData);

      const { error: movementError } = await supabase
        .from('inventory_movements')
        .insert(movementData);

      if (movementError) {
        console.error('❌ Movement creation error:', movementError);
        throw movementError;
      }

      console.log('✅ Movement created successfully');

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
      console.error('❌ Error collecting product:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo recolectar el producto',
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
      
      // Obtener el inventory_item_id del producto
      const { data: inventoryItem, error: inventoryError } = await supabase
        .from('inventory_items')
        .select('id')
        .eq('product_id', movement.product_id)
        .eq('warehouse_id', movement.source_warehouse_id)
        .maybeSingle();

      if (inventoryError) {
        throw new Error('Error al verificar el inventario');
      }

      // Crear movimiento de entrega
      const { error: movementError } = await supabase
        .from('inventory_movements')
        .insert({
          inventory_item_id: inventoryItem?.id || null,
          movement_type: 'entrada',
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