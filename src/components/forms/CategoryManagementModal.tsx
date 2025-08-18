import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Settings, Folder } from "lucide-react";
import { EditCategoryModal } from "./EditCategoryModal";
import { CreateCategoryModal } from "./CreateCategoryModal";

interface Category {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

interface CategoryManagementModalProps {
  onCategoryUpdated?: () => void;
}

export function CategoryManagementModal({ onCategoryUpdated }: CategoryManagementModalProps) {
  const [open, setOpen] = React.useState(false);

  const { data: categories, refetch } = useQuery({
    queryKey: ["categories-management"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data as Category[];
    },
    enabled: open,
  });

  const handleCategoryUpdate = () => {
    refetch();
    onCategoryUpdated?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Settings className="mr-2 h-4 w-4" />
          Gestionar Categorías
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Gestión de Categorías</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex justify-end">
            <CreateCategoryModal onCategoryCreated={handleCategoryUpdate} />
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {categories?.map((category) => (
              <Card key={category.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Folder className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-medium">{category.name}</h3>
                        <Badge variant={category.is_active ? "default" : "secondary"}>
                          {category.is_active ? "Activa" : "Inactiva"}
                        </Badge>
                      </div>
                      {category.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {category.description}
                        </p>
                      )}
                    </div>
                    <EditCategoryModal 
                      category={category} 
                      onCategoryUpdated={handleCategoryUpdate}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {categories?.length === 0 && (
            <div className="text-center py-8">
              <Folder className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">No hay categorías</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Crea tu primera categoría para organizar los productos.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}