import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Grid, List, Settings, Upload, Download, Package, TrendingUp, Table, Hash } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { MessageLoading } from "@/components/ui/message-loading";
import { CreateProductModal } from "@/components/forms/CreateProductModal";
import { EditProductModal } from "@/components/forms/EditProductModal";
import { ConfigurationModal } from "@/components/forms/ConfigurationModal";
import { VariantConfigModal } from "@/components/forms/VariantConfigModal";
import { PriceListsConfigModal } from "@/components/forms/PriceListsConfigModal";
import { ProductImportModal } from "@/components/forms/ProductImportModal";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import {
  Table as TableComponent,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Product {
  id: string;
  code: string;
  name: string;
  price: number;
  cost: number;
  price_list_1: number;
  price_list_2: number;
  margin_percentage?: number;
  category_id?: string;
  brand?: string;
  warranty_years?: number;
  warranty_months?: number;
  supplier_code?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  categories?: {
    id: string;
    name: string;
  };
}

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [showPriceListsConfig, setShowPriceListsConfig] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const navigate = useNavigate();

  const { data: products, isLoading, error, refetch } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          categories(id, name)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Product[];
    },
  });

  const filteredProducts = products?.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.categories?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.brand?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const activeProducts = products?.filter(p => p.is_active).length || 0;
  const totalProducts = products?.length || 0;
  const avgMargin = totalProducts > 0 ? filteredProducts.reduce((sum, product) => sum + (product.margin_percentage || 0), 0) / totalProducts : 0;

  const handleExportProducts = async () => {
    try {
      const productsData = filteredProducts.map(product => ({
        codigo: product.code,
        descripcion: product.name,
        anos_garantia: product.warranty_years || 0,
        meses_garantia: product.warranty_months || 0,
        costo: product.cost,
        precio_lista_1: product.price_list_1 || product.price,
        precio_lista_2: product.price_list_2 || 0,
        categoria: product.categories?.name || '',
        marca: product.brand || '',
        codigo_proveedor: product.supplier_code || '',
        activo: product.is_active ? 'Sí' : 'No'
      }));

      const ws = XLSX.utils.json_to_sheet(productsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Productos');
      
      const now = new Date();
      const timestamp = now.toISOString().split('T')[0];
      XLSX.writeFile(wb, `productos_${timestamp}.xlsx`);

      toast({
        title: "Exportación exitosa",
        description: `Se exportaron ${productsData.length} productos`,
      });
    } catch (error) {
      console.error('Error exporting products:', error);
      toast({
        title: "Error",
        description: "No se pudo exportar los productos",
        variant: "destructive",
      });
    }
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
        <h1 className="text-3xl font-bold">Gestión de Productos</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/references')}
          >
            <Hash className="mr-2 h-4 w-4" />
            Referencias
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowImportModal(true)}
          >
            <Upload className="mr-2 h-4 w-4" />
            Importar
          </Button>
          <Button
            variant="outline"
            onClick={handleExportProducts}
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <VariantConfigModal />
          <Button
            variant="outline"
            onClick={() => setShowPriceListsConfig(true)}
          >
            <Settings className="mr-2 h-4 w-4" />
            Listas de Precio
          </Button>
          <ConfigurationModal onConfigurationUpdated={refetch} />
          <CreateProductModal onProductCreated={refetch} />
        </div>
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

      {/* Búsqueda y controles de vista */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, código, categoría o marca..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === "cards" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("cards")}
          >
            <Grid className="h-4 w-4 mr-2" />
            Tarjetas
          </Button>
          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("table")}
          >
            <Table className="h-4 w-4 mr-2" />
            Tabla
          </Button>
        </div>
      </div>

      {/* Lista/Tabla de productos */}
      {viewMode === "cards" ? (
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
                {(product.categories?.name || product.brand) && (
                  <div className="flex flex-wrap gap-2">
                    {product.categories?.name && (
                      <Badge variant="outline" className="text-xs">
                        {product.categories.name}
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
                
                <div className="flex justify-end">
                  <EditProductModal 
                    product={product} 
                    onProductUpdated={refetch}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <TableComponent>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>Código Proveedor</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="text-right">Costo</TableHead>
                  <TableHead className="text-right">Margen</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.code}</TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>
                      {product.categories?.name ? (
                        <Badge variant="outline" className="text-xs">
                          {product.categories.name}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {product.brand ? (
                        <Badge variant="outline" className="text-xs">
                          {product.brand}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {product.supplier_code ? (
                        <span className="text-sm font-mono">
                          {product.supplier_code}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      ${product.price}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      ${product.cost}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-green-600 font-semibold">
                        {product.margin_percentage?.toFixed(2) || 0}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.is_active ? "default" : "secondary"}>
                        {product.is_active ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <EditProductModal 
                        product={product} 
                        onProductUpdated={refetch}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </TableComponent>
          </CardContent>
        </Card>
      )}

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
      
      <PriceListsConfigModal 
        open={showPriceListsConfig} 
        onOpenChange={setShowPriceListsConfig}
      />
      <ProductImportModal
        open={showImportModal}
        onOpenChange={setShowImportModal}
        onImportComplete={refetch}
      />
      </div>
    </MainLayout>
  );
}