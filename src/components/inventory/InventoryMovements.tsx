import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Search, TrendingUp, TrendingDown, ArrowRightLeft, Settings } from "lucide-react";
import { MessageLoading } from "@/components/ui/message-loading";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const movementSchema = z.object({
  inventory_item_id: z.string().min(1, "Selecciona un producto"),
  movement_type: z.enum(["entrada", "salida", "transferencia", "ajuste"]),
  quantity: z.number().min(1, "La cantidad debe ser mayor a 0"),
  unit_cost: z.number().min(0, "El costo no puede ser negativo"),
  reference_document: z.string().optional(),
  from_warehouse_id: z.string().optional(),
  to_warehouse_id: z.string().optional(),
  movement_date: z.string(),
  notes: z.string().optional(),
});

type MovementForm = z.infer<typeof movementSchema>;

interface Movement {
  id: string;
  movement_type: string;
  quantity: number;
  unit_cost: number;
  total_value: number;
  reference_document?: string;
  movement_date: string;
  notes?: string;
  created_at: string;
  inventory_items: {
    products: { name: string; code: string };
    warehouses: { name: string };
  };
  from_warehouse_id?: string;
  to_warehouse_id?: string;
}

interface InventoryItem {
  id: string;
  current_stock: number;
  products: { name: string; code: string };
  warehouses: { name: string };
}

interface Warehouse {
  id: string;
  name: string;
}

export function InventoryMovements() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { toast } = useToast();

  const form = useForm<MovementForm>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      quantity: 1,
      unit_cost: 0,
      movement_date: new Date().toISOString().split('T')[0],
    },
  });

  const watchedMovementType = form.watch("movement_type");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch movements with related data
      const { data: movementsData, error: movementsError } = await supabase
        .from("inventory_movements")
        .select(`
          *,
          inventory_items(
            products(name, code),
            warehouses(name)
          )
        `)
        .order("created_at", { ascending: false });

      if (movementsError) throw movementsError;

      // Fetch inventory items for the form
      const { data: itemsData, error: itemsError } = await supabase
        .from("inventory_items")
        .select(`
          id,
          current_stock,
          products(name, code),
          warehouses(name)
        `)
        .order("products(name)");

      if (itemsError) throw itemsError;

      // Fetch warehouses for transfers
      const { data: warehousesData, error: warehousesError } = await supabase
        .from("warehouses")
        .select("id, name")
        .eq("is_active", true)
        .order("name");

      if (warehousesError) throw warehousesError;

      setMovements(movementsData || []);
      setInventoryItems(itemsData || []);
      setWarehouses(warehousesData || []);
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

  const onSubmit = async (data: MovementForm) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const movementData = {
        ...data,
        user_id: user.id,
        quantity: data.movement_type === 'salida' ? -Math.abs(data.quantity) : Math.abs(data.quantity),
      };

      const { error } = await supabase
        .from("inventory_movements")
        .insert([movementData]);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Movimiento registrado correctamente",
      });

      setShowCreateModal(false);
      form.reset();
      fetchData();
    } catch (error: any) {
      console.error("Error creating movement:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo registrar el movimiento",
        variant: "destructive",
      });
    }
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'entrada':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'salida':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'transferencia':
        return <ArrowRightLeft className="h-4 w-4 text-blue-600" />;
      case 'ajuste':
        return <Settings className="h-4 w-4 text-yellow-600" />;
      default:
        return <TrendingUp className="h-4 w-4" />;
    }
  };

  const getMovementBadge = (type: string) => {
    switch (type) {
      case 'entrada':
        return <Badge className="bg-green-100 text-green-800">Entrada</Badge>;
      case 'salida':
        return <Badge className="bg-red-100 text-red-800">Salida</Badge>;
      case 'transferencia':
        return <Badge className="bg-blue-100 text-blue-800">Transferencia</Badge>;
      case 'ajuste':
        return <Badge className="bg-yellow-100 text-yellow-800">Ajuste</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  const filteredMovements = movements.filter((movement) => {
    const matchesSearch = 
      movement.inventory_items?.products?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.inventory_items?.products?.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.reference_document?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === "all" || movement.movement_type === selectedType;
    
    return matchesSearch && matchesType;
  });

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
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar movimientos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>
          
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="entrada">Entradas</SelectItem>
              <SelectItem value="salida">Salidas</SelectItem>
              <SelectItem value="transferencia">Transferencias</SelectItem>
              <SelectItem value="ajuste">Ajustes</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Movimiento
        </Button>
      </div>

      <div className="space-y-4">
        {filteredMovements.map((movement) => (
          <Card key={movement.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {getMovementIcon(movement.movement_type)}
                  <div>
                    <CardTitle className="text-lg">
                      {movement.inventory_items?.products?.name || 'Producto no encontrado'}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {movement.inventory_items?.products?.code || 'N/A'}
                    </p>
                  </div>
                </div>
                {getMovementBadge(movement.movement_type)}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Cantidad</p>
                  <p className="font-semibold">{Math.abs(movement.quantity)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Costo Unitario</p>
                  <p className="font-semibold">${movement.unit_cost}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Valor Total</p>
                  <p className="font-semibold">${movement.total_value}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Fecha</p>
                  <p className="font-semibold">
                    {format(new Date(movement.movement_date), "dd/MM/yyyy", { locale: es })}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground">Depósito</p>
                <p className="font-medium">{movement.inventory_items?.warehouses?.name || 'N/A'}</p>
              </div>

              {movement.reference_document && (
                <div>
                  <p className="text-sm text-muted-foreground">Documento de Referencia</p>
                  <p className="font-medium">{movement.reference_document}</p>
                </div>
              )}

              {movement.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notas</p>
                  <p className="text-sm">{movement.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMovements.length === 0 && (
        <div className="text-center py-12">
          <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No hay movimientos registrados</h3>
          <p className="text-muted-foreground mb-4">
            Registra movimientos de inventario para llevar control del stock
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Registrar Primer Movimiento
          </Button>
        </div>
      )}

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Registrar Movimiento de Inventario</DialogTitle>
            <DialogDescription>
              Registra entradas, salidas, transferencias o ajustes de stock
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="inventory_item_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Producto</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar producto" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {inventoryItems.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.products.name} ({item.products.code}) - Stock: {item.current_stock}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="movement_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Movimiento</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="entrada">Entrada (Agregar stock)</SelectItem>
                        <SelectItem value="salida">Salida (Quitar stock)</SelectItem>
                        <SelectItem value="ajuste">Ajuste (Establecer stock)</SelectItem>
                        <SelectItem value="transferencia">Transferencia</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {watchedMovementType === 'ajuste' ? 'Nuevo Stock' : 'Cantidad'}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unit_cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Costo Unitario</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="movement_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha del Movimiento</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reference_document"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Documento de Referencia (Opcional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ej: Factura #001, Orden #123" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Observaciones adicionales..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  Registrar Movimiento
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}