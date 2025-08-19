import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CreateSupplierModal } from "./CreateSupplierModal";
import { EditSupplierModal } from "./EditSupplierModal";

interface Supplier {
  id: string;
  name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  tax_id: string | null;
  payment_terms: string | null;
  is_active: boolean;
  created_at: string;
}

interface SupplierManagementPanelProps {
  onSupplierUpdated?: () => void;
}

export function SupplierManagementPanel({ onSupplierUpdated }: SupplierManagementPanelProps) {
  const { data: suppliers, refetch } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data as Supplier[];
    },
  });

  const handleSupplierUpdate = () => {
    refetch();
    onSupplierUpdated?.();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Gestión de Proveedores</h3>
          <p className="text-sm text-muted-foreground">
            Administra los proveedores del sistema
          </p>
        </div>
        <CreateSupplierModal onSupplierCreated={handleSupplierUpdate} />
      </div>

      <ScrollArea className="h-[400px]">
        <div className="grid gap-4">
          {suppliers?.map((supplier) => (
            <Card key={supplier.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{supplier.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={supplier.is_active ? "default" : "secondary"}>
                      {supplier.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                    <EditSupplierModal
                      supplier={supplier}
                      onSupplierUpdated={handleSupplierUpdate}
                    />
                  </div>
                </div>
                {supplier.contact_person && (
                  <CardDescription>
                    Contacto: {supplier.contact_person}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-sm space-y-1">
                  {supplier.email && (
                    <p className="text-muted-foreground">📧 {supplier.email}</p>
                  )}
                  {supplier.phone && (
                    <p className="text-muted-foreground">📞 {supplier.phone}</p>
                  )}
                  {supplier.country && (
                    <p className="text-muted-foreground">🌍 {supplier.country}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          
          {!suppliers?.length && (
            <div className="text-center py-8 text-muted-foreground">
              <Truck className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No hay proveedores registrados</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}