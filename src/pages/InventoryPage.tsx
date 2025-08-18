import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InventoryProducts } from "@/components/inventory/InventoryProducts";
import { InventoryMovements } from "@/components/inventory/InventoryMovements";
import { InventoryReports } from "@/components/inventory/InventoryReports";
import { WarehouseManagement } from "@/components/inventory/WarehouseManagement";
import { Warehouse, Package, BarChart3, TrendingUp } from "lucide-react";

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState("products");

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Gestión de Inventario</h1>
              <p className="text-muted-foreground">
                Administra productos, stock, depósitos y movimientos de inventario
              </p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="products" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Productos
              </TabsTrigger>
              <TabsTrigger value="movements" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Movimientos
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Reportes
              </TabsTrigger>
              <TabsTrigger value="warehouses" className="flex items-center gap-2">
                <Warehouse className="h-4 w-4" />
                Depósitos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="products" className="space-y-6">
              <InventoryProducts />
            </TabsContent>

            <TabsContent value="movements" className="space-y-6">
              <InventoryMovements />
            </TabsContent>

            <TabsContent value="reports" className="space-y-6">
              <InventoryReports />
            </TabsContent>

            <TabsContent value="warehouses" className="space-y-6">
              <WarehouseManagement />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
}