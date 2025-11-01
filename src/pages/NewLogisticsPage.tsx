import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { PickupsModule } from '@/components/logistics/PickupsModule';
import { ShipmentsModule } from '@/components/logistics/ShipmentsModule';
import { OrdersToAssembleModule } from '@/components/logistics/OrdersToAssembleModule';
import { Package, Truck, ClipboardList } from 'lucide-react';

export default function NewLogisticsPage() {
  const [counts, setCounts] = useState({
    toAssemble: 0,
    pickups: 0,
    shipments: 0,
  });

  useEffect(() => {
    fetchCounts();
    
    // Suscribirse a cambios en tiempo real
    const subscription = supabase
      .channel('logistics-counts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchCounts();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchCounts = async () => {
    try {
      // @ts-ignore - Complex Supabase query type inference
      const r1 = await supabase.from('orders').select('id', { count: 'exact', head: true }).in('status', ['pendiente_envio', 'pendiente_retiro']).or('entregar_ahora.is.null,entregar_ahora.eq.false');
      // @ts-ignore - Complex Supabase query type inference
      const r2 = await supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'armado').eq('retiro_en_sucursal', true).or('entregar_ahora.is.null,entregar_ahora.eq.false');
      // @ts-ignore - Complex Supabase query type inference
      const r3 = await supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'armado').eq('retiro_en_sucursal', false).or('entregar_ahora.is.null,entregar_ahora.eq.false');

      setCounts({
        toAssemble: r1.count || 0,
        pickups: r2.count || 0,
        shipments: r3.count || 0,
      });
    } catch (error) {
      console.error('Error fetching counts:', error);
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gestión de Pedidos</h1>
          <p className="text-muted-foreground">
            Administra pedidos para preparar, retiros y envíos
          </p>
        </div>

        {/* Tarjetas de resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4" />
                  Para Preparar
                </div>
                <Badge variant="secondary">{counts.toAssemble}</Badge>
              </CardTitle>
              <CardDescription>Pedidos pendientes de preparación</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Para Retiro
                </div>
                <Badge variant="secondary">{counts.pickups}</Badge>
              </CardTitle>
              <CardDescription>Listos para retirar en sucursal</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Para Envío
                </div>
                <Badge variant="secondary">{counts.shipments}</Badge>
              </CardTitle>
              <CardDescription>Listos para asignar a rutas</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Tabs para las diferentes vistas */}
        <Tabs defaultValue="to-assemble" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="to-assemble" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              Para Preparar
              {counts.toAssemble > 0 && (
                <Badge variant="secondary" className="ml-2">{counts.toAssemble}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="pickups" className="gap-2">
              <Package className="h-4 w-4" />
              Para Retiro
              {counts.pickups > 0 && (
                <Badge variant="secondary" className="ml-2">{counts.pickups}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="shipments" className="gap-2">
              <Truck className="h-4 w-4" />
              Para Envío
              {counts.shipments > 0 && (
                <Badge variant="secondary" className="ml-2">{counts.shipments}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="to-assemble">
            <OrdersToAssembleModule />
          </TabsContent>

          <TabsContent value="pickups">
            <PickupsModule />
          </TabsContent>

          <TabsContent value="shipments">
            <ShipmentsModule />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
