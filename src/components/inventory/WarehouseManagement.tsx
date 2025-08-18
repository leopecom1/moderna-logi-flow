import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Search, Warehouse, MapPin, User, Edit } from "lucide-react";
import { MessageLoading } from "@/components/ui/message-loading";
import { useToast } from "@/hooks/use-toast";

const warehouseSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  address: z.string().optional(),
  city: z.string().min(1, "La ciudad es requerida"),
  manager_id: z.string().optional(),
});

type WarehouseForm = z.infer<typeof warehouseSchema>;

interface WarehouseData {
  id: string;
  name: string;
  address?: string | null;
  city: string | null;
  manager_id?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  profiles?: { full_name: string } | null;
  _count?: {
    inventory_items: number;
  };
}

interface Profile {
  user_id: string;
  full_name: string;
}

export function WarehouseManagement() {
  const [warehouses, setWarehouses] = useState<WarehouseData[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<WarehouseData | null>(null);
  const { toast } = useToast();

  const form = useForm<WarehouseForm>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: {
      name: "",
      address: "",
      city: "Santa Fe",
    },
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (editingWarehouse) {
      form.reset({
        name: editingWarehouse.name,
        address: editingWarehouse.address || "",
        city: editingWarehouse.city,
        manager_id: editingWarehouse.manager_id || "",
      });
    } else {
      form.reset({
        name: "",
        address: "",
        city: "Santa Fe",
        manager_id: "",
      });
    }
  }, [editingWarehouse, form]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch warehouses and profiles separately
      const [warehousesResponse, profilesResponse] = await Promise.all([
        supabase.from("warehouses").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("user_id, full_name").eq("is_active", true).order("full_name")
      ]);

      if (warehousesResponse.error) throw warehousesResponse.error;
      if (profilesResponse.error) throw profilesResponse.error;

      // Create profile map for lookup
      const profilesMap = new Map(profilesResponse.data?.map(p => [p.user_id, p]) || []);

      // Get inventory count for each warehouse and enrich with profile data
      const warehousesWithCount = await Promise.all(
        (warehousesResponse.data || []).map(async (warehouse) => {
          const { count } = await supabase
            .from("inventory_items")
            .select("*", { count: "exact", head: true })
            .eq("warehouse_id", warehouse.id);
          
          return {
            ...warehouse,
            profiles: warehouse.manager_id ? profilesMap.get(warehouse.manager_id) : null,
            _count: { inventory_items: count || 0 }
          };
        })
      );

      setWarehouses(warehousesWithCount);
      setProfiles(profilesResponse.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: WarehouseForm) => {
    try {
      if (editingWarehouse) {
        const { error } = await supabase
          .from("warehouses")
          .update({
            name: data.name,
            address: data.address || null,
            city: data.city,
            manager_id: data.manager_id || null,
          })
          .eq("id", editingWarehouse.id);

        if (error) throw error;

        toast({
          title: "Éxito",
          description: "Depósito actualizado correctamente",
        });
      } else {
        const { error } = await supabase
          .from("warehouses")
          .insert([{
            name: data.name,
            address: data.address || null,
            city: data.city,
            manager_id: data.manager_id || null,
          }]);

        if (error) throw error;

        toast({
          title: "Éxito",
          description: "Depósito creado correctamente",
        });
      }

      setShowCreateModal(false);
      setEditingWarehouse(null);
      form.reset();
      fetchData();
    } catch (error: any) {
      console.error("Error saving warehouse:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el depósito",
        variant: "destructive",
      });
    }
  };

  const toggleWarehouseStatus = async (warehouse: WarehouseData) => {
    try {
      const { error } = await supabase
        .from("warehouses")
        .update({ is_active: !warehouse.is_active })
        .eq("id", warehouse.id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: `Depósito ${warehouse.is_active ? 'desactivado' : 'activado'} correctamente`,
      });

      fetchData();
    } catch (error: any) {
      console.error("Error updating warehouse status:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el estado del depósito",
        variant: "destructive",
      });
    }
  };

  const openEditModal = (warehouse: WarehouseData) => {
    setEditingWarehouse(warehouse);
    setShowCreateModal(true);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingWarehouse(null);
    form.reset();
  };

  const filteredWarehouses = warehouses.filter((warehouse) =>
    warehouse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    warehouse.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    warehouse.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <MessageLoading />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar depósitos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full sm:w-64"
          />
        </div>
        
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Depósito
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredWarehouses.map((warehouse) => (
          <Card key={warehouse.id} className={!warehouse.is_active ? "opacity-60" : ""}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Warehouse className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{warehouse.name}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={warehouse.is_active ? "default" : "secondary"}>
                    {warehouse.is_active ? "Activo" : "Inactivo"}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditModal(warehouse)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {warehouse.address && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{warehouse.address}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{warehouse.city}</span>
              </div>

              {warehouse.profiles?.full_name && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Encargado: {warehouse.profiles.full_name}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm pt-2 border-t">
                <div>
                  <p className="text-muted-foreground">Productos</p>
                  <p className="font-semibold">{warehouse._count?.inventory_items || 0}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Estado</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleWarehouseStatus(warehouse)}
                    className={warehouse.is_active ? "text-red-600" : "text-green-600"}
                  >
                    {warehouse.is_active ? "Desactivar" : "Activar"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredWarehouses.length === 0 && (
        <div className="text-center py-12">
          <Warehouse className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No hay depósitos registrados</h3>
          <p className="text-muted-foreground mb-4">
            Crea tu primer depósito para comenzar a gestionar inventario
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Crear Primer Depósito
          </Button>
        </div>
      )}

      <Dialog open={showCreateModal} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingWarehouse ? "Editar Depósito" : "Crear Nuevo Depósito"}
            </DialogTitle>
            <DialogDescription>
              {editingWarehouse 
                ? "Modifica la información del depósito"
                : "Configura un nuevo depósito para gestionar inventario"
              }
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Depósito</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ej: Depósito Central" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección (Opcional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ej: Av. Principal 123" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ciudad</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ej: Santa Fe" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="manager_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Encargado (Opcional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar encargado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Sin encargado</SelectItem>
                        {profiles.map((profile) => (
                          <SelectItem key={profile.user_id} value={profile.user_id}>
                            {profile.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeModal}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingWarehouse ? "Actualizar" : "Crear"} Depósito
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}