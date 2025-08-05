import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { CreateProductModal } from "@/components/forms/CreateProductModal";
import { Search, Package, TrendingUp } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { MainLayout } from "@/components/layout/MainLayout";
import { MessageLoading } from "@/components/ui/message-loading";

type Product = Tables<"products">;

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = React.useState("");

  const { data: products, isLoading, refetch } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Product[];
    },
  });

  const filteredProducts = products?.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.brand?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const activeProducts = products?.filter(p => p.is_active).length || 0;
  const totalProducts = products?.length || 0;
  const avgMargin = products?.length ? 
    products.reduce((sum, p) => sum + (p.margin_percentage || 0), 0) / products.length : 0;

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
        <h1 className="text-3xl font-bold">Gestión de Productos</h1>
        <CreateProductModal onProductCreated={refetch} />
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              {activeProducts} activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos Activos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProducts}</div>
            <p className="text-xs text-muted-foreground">
              {totalProducts > 0 ? ((activeProducts / totalProducts) * 100).toFixed(1) : 0}% del total
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
          placeholder="Buscar por nombre, código, categoría o marca..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Lista de productos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">Código: {product.code}</p>
                </div>
                <Badge variant={product.is_active ? "default" : "secondary"}>
                  {product.is_active ? "Activo" : "Inactivo"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {(product.category || product.brand) && (
                <div className="flex flex-wrap gap-2">
                  {product.category && (
                    <Badge variant="outline" className="text-xs">
                      {product.category}
                    </Badge>
                  )}
                  {product.brand && (
                    <Badge variant="outline" className="text-xs">
                      {product.brand}
                    </Badge>
                  )}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Precio</p>
                  <p className="font-semibold">${product.price}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Costo</p>
                  <p className="font-semibold">${product.cost}</p>
                </div>
              </div>
              
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Margen</p>
                <p className="text-lg font-bold text-green-600">
                  {product.margin_percentage?.toFixed(2) || 0}%
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-semibold">No hay productos</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchTerm ? "No se encontraron productos con ese criterio de búsqueda." : "Comienza creando tu primer producto."}
          </p>
          {!searchTerm && (
            <div className="mt-6">
              <CreateProductModal onProductCreated={refetch} />
            </div>
          )}
        </div>
      )}
      </div>
    </MainLayout>
  );
}