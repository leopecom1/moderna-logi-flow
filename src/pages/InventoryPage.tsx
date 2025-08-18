import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InventoryProducts } from "@/components/inventory/InventoryProducts";
import { WarehouseManagement } from "@/components/inventory/WarehouseManagement";
import { Warehouse, Package, Settings } from "lucide-react";

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
                Administra productos, stock y depósitos de inventario
              </p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="products" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Productos e Inventario
              </TabsTrigger>
              <TabsTrigger value="warehouses" className="flex items-center gap-2">
                <Warehouse className="h-4 w-4" />
                Depósitos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="products" className="space-y-6">
              <InventoryProducts />
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