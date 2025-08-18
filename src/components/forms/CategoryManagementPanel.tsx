import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Folder } from "lucide-react";
import { EditCategoryModal } from "./EditCategoryModal";
import { CreateCategoryModal } from "./CreateCategoryModal";

interface Category {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  parent_id?: string;
  created_at: string;
}

interface CategoryManagementPanelProps {
  onCategoryUpdated?: () => void;
}

export function CategoryManagementPanel({ onCategoryUpdated }: CategoryManagementPanelProps) {
  const { data: categories, refetch } = useQuery({
    queryKey: ["categories-management-panel"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("parent_id", { ascending: true, nullsFirst: true })
        .order("name");
      
      if (error) throw error;
      return data as Category[];
    },
  });

  const mainCategories = categories?.filter(cat => !cat.parent_id) || [];
  const getSubcategories = (parentId: string) => 
    categories?.filter(cat => cat.parent_id === parentId) || [];

  const handleCategoryUpdate = () => {
    refetch();
    onCategoryUpdated?.();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <CreateCategoryModal onCategoryCreated={handleCategoryUpdate} />
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {mainCategories.map((category) => (
          <div key={category.id} className="space-y-2">
            <Card>
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
                  <div className="flex items-center gap-2">
                    <CreateCategoryModal 
                      parentId={category.id} 
                      onCategoryCreated={handleCategoryUpdate}
                      triggerText="+ Sub"
                      triggerSize="sm"
                    />
                    <EditCategoryModal 
                      category={category} 
                      onCategoryUpdated={handleCategoryUpdate}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Subcategories */}
            <div className="ml-6 space-y-2">
              {getSubcategories(category.id).map((subcategory) => (
                <Card key={subcategory.id} className="bg-muted/30">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-l-2 border-b-2 border-muted-foreground/30 ml-1"></div>
                          <Folder className="h-3 w-3 text-muted-foreground" />
                          <h4 className="text-sm font-medium">{subcategory.name}</h4>
                          <Badge variant={subcategory.is_active ? "default" : "secondary"}>
                            {subcategory.is_active ? "Activa" : "Inactiva"}
                          </Badge>
                        </div>
                        {subcategory.description && (
                          <p className="text-xs text-muted-foreground mt-1 ml-7">
                            {subcategory.description}
                          </p>
                        )}
                      </div>
                      <EditCategoryModal 
                        category={subcategory} 
                        onCategoryUpdated={handleCategoryUpdate}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {mainCategories.length === 0 && (
        <div className="text-center py-8">
          <Folder className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-semibold">No hay categorías</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Crea tu primera categoría para organizar los productos.
          </p>
        </div>
      )}
    </div>
  );
}