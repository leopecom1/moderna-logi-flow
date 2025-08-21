import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Folder, Tag, Truck, Building2 } from "lucide-react";
import { CategoryManagementPanel } from "./CategoryManagementPanel";
import { BrandManagementPanel } from "./BrandManagementPanel";
import { SupplierManagementPanel } from "./SupplierManagementPanel";
import { BranchManagementPanel } from "./BranchManagementPanel";

interface ConfigurationModalProps {
  onConfigurationUpdated?: () => void;
}

export function ConfigurationModal({ onConfigurationUpdated }: ConfigurationModalProps) {
  const [open, setOpen] = React.useState(false);

  const handleConfigUpdate = () => {
    onConfigurationUpdated?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Settings className="mr-2 h-4 w-4" />
          Configuración
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Configuración del Sistema</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="categories" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <Folder className="h-4 w-4" />
              Categorías
            </TabsTrigger>
            <TabsTrigger value="brands" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Marcas
            </TabsTrigger>
            <TabsTrigger value="suppliers" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Proveedores
            </TabsTrigger>
            <TabsTrigger value="branches" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Sucursales
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="categories" className="mt-4">
            <CategoryManagementPanel onCategoryUpdated={handleConfigUpdate} />
          </TabsContent>
          
          <TabsContent value="brands" className="mt-4">
            <BrandManagementPanel onBrandUpdated={handleConfigUpdate} />
          </TabsContent>
          
          <TabsContent value="suppliers" className="mt-4">
            <SupplierManagementPanel onSupplierUpdated={handleConfigUpdate} />
          </TabsContent>
          
          <TabsContent value="branches" className="mt-4">
            <BranchManagementPanel onBranchUpdated={handleConfigUpdate} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}