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
import { Settings, Truck } from "lucide-react";
import { SupplierManagementPanel } from "./SupplierManagementPanel";

interface PurchasesConfigurationModalProps {
  onConfigurationUpdated?: () => void;
}

export function PurchasesConfigurationModal({ onConfigurationUpdated }: PurchasesConfigurationModalProps) {
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
      <DialogContent className="sm:max-w-[800px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Configuración de Compras</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="suppliers" className="w-full">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="suppliers" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Proveedores
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="suppliers" className="mt-4">
            <SupplierManagementPanel onSupplierUpdated={handleConfigUpdate} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}