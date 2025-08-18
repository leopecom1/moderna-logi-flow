import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Tag, Package } from "lucide-react";
import { EditBrandModal } from "./EditBrandModal";
import { CreateBrandModal } from "./CreateBrandModal";

interface Brand {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

interface BrandManagementPanelProps {
  onBrandUpdated?: () => void;
}

export function BrandManagementPanel({ onBrandUpdated }: BrandManagementPanelProps) {
  const { data: brands, refetch } = useQuery({
    queryKey: ["brands-management"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brands")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data as Brand[];
    },
  });

  const handleBrandUpdate = () => {
    refetch();
    onBrandUpdated?.();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <CreateBrandModal onBrandCreated={handleBrandUpdate} />
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {brands?.map((brand) => (
          <Card key={brand.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-medium">{brand.name}</h3>
                    <Badge variant={brand.is_active ? "default" : "secondary"}>
                      {brand.is_active ? "Activa" : "Inactiva"}
                    </Badge>
                  </div>
                  {brand.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {brand.description}
                    </p>
                  )}
                </div>
                <EditBrandModal 
                  brand={brand} 
                  onBrandUpdated={handleBrandUpdate}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {brands?.length === 0 && (
        <div className="text-center py-8">
          <Package className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-semibold">No hay marcas</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Crea tu primera marca para organizar los productos.
          </p>
        </div>
      )}
    </div>
  );
}