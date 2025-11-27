import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function ProductSyncHistoryPage() {
  const { data: history, isLoading } = useQuery({
    queryKey: ['product-sync-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_sync_history')
        .select('*')
        .order('sync_date', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <MainLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Historial de Sincronizaciones</h1>
          <p className="text-muted-foreground">
            Registro de productos sincronizados entre WooCommerce y Shopify
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sincronizaciones Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !history || history.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay sincronizaciones registradas todavía.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Producto WooCommerce</TableHead>
                      <TableHead>ID WooCommerce</TableHead>
                      <TableHead>Producto Shopify</TableHead>
                      <TableHead>ID Shopify</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          {format(new Date(record.sync_date), "dd/MM/yyyy HH:mm", { locale: es })}
                        </TableCell>
                        <TableCell className="font-medium">
                          {record.woocommerce_product_name || 'Sin nombre'}
                        </TableCell>
                        <TableCell>{record.woocommerce_product_id}</TableCell>
                        <TableCell>{record.shopify_product_name || 'Sin nombre'}</TableCell>
                        <TableCell>{record.shopify_product_id}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
