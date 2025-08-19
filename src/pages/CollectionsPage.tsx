import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { CreateCollectionModal } from "@/components/forms/CreateCollectionModal";
import { Search, DollarSign, TrendingUp, Calendar } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { MessageLoading } from "@/components/ui/message-loading";

export default function CollectionsPage() {
  const [searchTerm, setSearchTerm] = React.useState("");

  const { data: collections, isLoading, refetch } = useQuery({
    queryKey: ["collections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .select(`
          *,
          customer:customers(name),
          order:orders(order_number, total_amount),
          collector:profiles(full_name)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const filteredCollections = collections?.filter(collection =>
    collection.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    collection.payment_method_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    collection.payment_reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    collection.receipt_number?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Estadísticas
  const totalCollections = collections?.length || 0;
  const totalAmount = collections?.reduce((sum, collection) => sum + Number(collection.amount), 0) || 0;
  const confirmedAmount = collections?.filter(c => c.collection_status === 'confirmado')
    .reduce((sum, collection) => sum + Number(collection.amount), 0) || 0;
  const pendingAmount = collections?.filter(c => c.collection_status === 'pendiente')
    .reduce((sum, collection) => sum + Number(collection.amount), 0) || 0;

  const paymentMethodLabels = {
    efectivo: "Efectivo",
    transferencia: "Transferencia",
    mercado_pago: "Mercado Pago",
    tarjeta_credito: "Tarjeta Crédito",
    tarjeta_debito: "Tarjeta Débito",
    cheque: "Cheque",
    otros: "Otros",
  };

  const getStatusBadge = (status: string) => {
    const config = {
      confirmado: { label: 'Confirmado', variant: 'default' as const },
      pendiente: { label: 'Pendiente', variant: 'secondary' as const },
      rechazado: { label: 'Rechazado', variant: 'destructive' as const },
      reversado: { label: 'Reversado', variant: 'outline' as const },
    };
    const statusConfig = config[status as keyof typeof config];
    return <Badge variant={statusConfig?.variant || 'secondary'}>{statusConfig?.label || status}</Badge>;
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <MessageLoading />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestión de Cobros</h1>
        <CreateCollectionModal onCollectionCreated={refetch} />
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cobros</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCollections}</div>
            <p className="text-xs text-muted-foreground">
              Cobros registrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monto Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              En cobros
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmados</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${confirmedAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Cobros confirmados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">${pendingAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Cobros pendientes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Búsqueda */}
      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por cliente, método de pago o referencia..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Tabla de cobros */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Cobros</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Método de Pago</TableHead>
                <TableHead>Referencia</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Orden</TableHead>
                <TableHead>Recibo</TableHead>
                <TableHead>Cobrador</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCollections.map((collection) => (
                <TableRow key={collection.id}>
                  <TableCell>
                    {new Date(collection.collection_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{collection.customer?.name || "N/A"}</TableCell>
                  <TableCell className="font-medium">
                    ${Number(collection.amount).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {paymentMethodLabels[collection.payment_method_type as keyof typeof paymentMethodLabels]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {collection.payment_reference || "-"}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(collection.collection_status)}
                  </TableCell>
                   <TableCell>
                     {collection.order ? (
                       <div className="text-sm">
                         <div>Orden: #{collection.order.order_number}</div>
                         <div className="text-muted-foreground">${collection.order.total_amount}</div>
                       </div>
                     ) : (
                       <span className="text-muted-foreground">-</span>
                     )}
                   </TableCell>
                  <TableCell>
                    {collection.receipt_number || "-"}
                  </TableCell>
                  <TableCell>
                    {Array.isArray(collection.collector) && collection.collector[0]?.full_name || "N/A"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredCollections.length === 0 && (
            <div className="text-center py-12">
              <DollarSign className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">No hay cobros</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchTerm ? "No se encontraron cobros con ese criterio de búsqueda." : "Comienza registrando tu primer cobro."}
              </p>
              {!searchTerm && (
                <div className="mt-6">
                  <CreateCollectionModal onCollectionCreated={refetch} />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </MainLayout>
  );
}