import { useState } from "react";
import { Settings } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { StockRulesPanel } from "./StockRulesPanel";

interface InventoryConfigModalProps {
  onConfigurationUpdated?: () => void;
}

export function InventoryConfigModal({ onConfigurationUpdated }: InventoryConfigModalProps) {
  const [open, setOpen] = useState(false);

  const handleConfigurationUpdate = () => {
    onConfigurationUpdated?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Configuración
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configuración de Inventario</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="stock-rules" className="w-full">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="stock-rules">Reglas de Stock</TabsTrigger>
          </TabsList>

          <TabsContent value="stock-rules">
            <StockRulesPanel onRulesUpdated={handleConfigurationUpdate} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}