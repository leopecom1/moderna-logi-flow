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
import { CreateSaleModal } from "@/components/forms/CreateSaleModal";
import { Search, ShoppingCart, TrendingUp, DollarSign } from "lucide-react";

export default function SalesPage() {
  const [searchTerm, setSearchTerm] = React.useState("");

  const { data: sales, isLoading, refetch } = useQuery({
    queryKey: ["sales"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select(`
          *,
          customer:customers(name),
          product:products(name, code),
          location:locations(name),
          seller:profiles(full_name)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const filteredSales = sales?.filter(sale =>
    sale.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.product?.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.location?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Estadísticas
  const totalSales = sales?.length || 0;
  const totalRevenue = sales?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;
  const totalProfit = sales?.reduce((sum, sale) => sum + Number(sale.total_profit), 0) || 0;
  const avgMargin = sales?.length ? 
    sales.reduce((sum, sale) => sum + (Number(sale.margin_percentage) || 0), 0) / sales.length : 0;

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Cargando ventas...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestión de Ventas</h1>
        <CreateSaleModal onSaleCreated={refetch} />
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ventas</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSales}</div>
            <p className="text-xs text-muted-foreground">
              Ventas registradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              En ventas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ganancia Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalProfit.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Ganancia neta
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margen Promedio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgMargin.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Margen de ganancia
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Búsqueda */}
      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por cliente, producto o sucursal..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Tabla de ventas */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Ventas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Sucursal</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Precio Unit.</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Ganancia</TableHead>
                <TableHead>Margen</TableHead>
                <TableHead>Vendedor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>
                    {new Date(sale.sale_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{sale.customer?.name || "N/A"}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{sale.product?.name || "N/A"}</div>
                      <div className="text-sm text-muted-foreground">{sale.product?.code || "N/A"}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {sale.location ? (
                      <Badge variant="outline">{sale.location.name}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>{sale.quantity}</TableCell>
                  <TableCell>${Number(sale.unit_price).toFixed(2)}</TableCell>
                  <TableCell className="font-medium">
                    ${Number(sale.total_amount).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-green-600 font-medium">
                    ${Number(sale.total_profit).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={Number(sale.margin_percentage) > 0 ? "default" : "destructive"}>
                      {Number(sale.margin_percentage).toFixed(1)}%
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {Array.isArray(sale.seller) && sale.seller[0]?.full_name || "N/A"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredSales.length === 0 && (
            <div className="text-center py-12">
              <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">No hay ventas</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchTerm ? "No se encontraron ventas con ese criterio de búsqueda." : "Comienza registrando tu primera venta."}
              </p>
              {!searchTerm && (
                <div className="mt-6">
                  <CreateSaleModal onSaleCreated={refetch} />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}