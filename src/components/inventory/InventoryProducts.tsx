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
import { Plus, Search, Package, AlertTriangle } from "lucide-react";
import { MessageLoading } from "@/components/ui/message-loading";
import { useToast } from "@/hooks/use-toast";

const inventoryItemSchema = z.object({
  product_id: z.string().min(1, "Selecciona un producto"),
  warehouse_id: z.string().min(1, "Selecciona un depósito"),
  current_stock: z.number().min(0, "El stock no puede ser negativo"),
  minimum_stock: z.number().min(0, "El stock mínimo no puede ser negativo"),
  maximum_stock: z.number().min(0, "El stock máximo no puede ser negativo"),
  unit_cost: z.number().min(0, "El costo no puede ser negativo"),
});

type InventoryItemForm = z.infer<typeof inventoryItemSchema>;

interface InventoryItem {
  id: string;
  product_id: string;
  warehouse_id: string;
  current_stock: number;
  minimum_stock: number;
  maximum_stock: number;
  unit_cost: number;
  last_updated: string;
  product_name?: string;
  product_code?: string;
  warehouse_name?: string;
}

interface Product {
  id: string;
  name: string;
  code: string;
  category?: string;
  brand?: string;
}

interface Warehouse {
  id: string;
  name: string;
}

export function InventoryProducts() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { toast } = useToast();

  const form = useForm<InventoryItemForm>({
    resolver: zodResolver(inventoryItemSchema),
    defaultValues: {
      current_stock: 0,
      minimum_stock: 0,
      maximum_stock: 0,
      unit_cost: 0,
    },
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch inventory items, products, and warehouses separately
      const [inventoryResponse, productsResponse, warehousesResponse] = await Promise.all([
        supabase.from("inventory_items").select("*").order("created_at", { ascending: false }),
        supabase.from("products").select("id, name, code, category, brand").eq("is_active", true).order("name"),
        supabase.from("warehouses").select("id, name").eq("is_active", true).order("name")
      ]);

      if (inventoryResponse.error) throw inventoryResponse.error;
      if (productsResponse.error) throw productsResponse.error;
      if (warehousesResponse.error) throw warehousesResponse.error;

      // Create maps for faster lookup
      const productsMap = new Map(productsResponse.data?.map(p => [p.id, p]) || []);
      const warehousesMap = new Map(warehousesResponse.data?.map(w => [w.id, w]) || []);

      // Combine data
      const enrichedItems = inventoryResponse.data?.map(item => ({
        ...item,
        product_name: productsMap.get(item.product_id)?.name || 'Producto no encontrado',
        product_code: productsMap.get(item.product_id)?.code || 'N/A',
        warehouse_name: warehousesMap.get(item.warehouse_id)?.name || 'Depósito no encontrado',
      })) || [];

      setItems(enrichedItems);
      setProducts(productsResponse.data || []);
      setWarehouses(warehousesResponse.data || []);
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

  const onSubmit = async (data: InventoryItemForm) => {
    try {
      const { error } = await supabase
        .from("inventory_items")
        .insert([data]);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Producto agregado al inventario correctamente",
      });

      setShowCreateModal(false);
      form.reset();
      fetchData();
    } catch (error: any) {
      console.error("Error creating inventory item:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo agregar el producto al inventario",
        variant: "destructive",
      });
    }
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.current_stock <= item.minimum_stock) {
      return { status: "low", color: "destructive", text: "Stock Bajo" };
    } else if (item.current_stock >= item.maximum_stock) {
      return { status: "high", color: "secondary", text: "Stock Alto" };
    }
    return { status: "normal", color: "default", text: "Stock Normal" };
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = 
      item.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.warehouse_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesWarehouse = selectedWarehouse === "all" || item.warehouse_id === selectedWarehouse;
    
    return matchesSearch && matchesWarehouse;
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
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>
          
          <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filtrar por depósito" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los depósitos</SelectItem>
              {warehouses.map((warehouse) => (
                <SelectItem key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Agregar Producto
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredItems.map((item) => {
          const stockStatus = getStockStatus(item);
          return (
            <Card key={item.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{item.product_name}</CardTitle>
                  </div>
                  <Badge variant={stockStatus.color as any}>
                    {stockStatus.text}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{item.product_code}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Stock Actual</p>
                    <p className="font-semibold">{item.current_stock}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Costo Unitario</p>
                    <p className="font-semibold">${item.unit_cost}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Stock Mín.</p>
                    <p className="font-semibold">{item.minimum_stock}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Stock Máx.</p>
                    <p className="font-semibold">{item.maximum_stock}</p>
                  </div>
                </div>
                
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground">Depósito</p>
                  <p className="font-medium">{item.warehouse_name}</p>
                </div>

                {item.current_stock <= item.minimum_stock && (
                  <div className="flex items-center gap-2 p-2 bg-destructive/10 rounded-md">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <span className="text-sm text-destructive font-medium">
                      Requiere reposición
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No hay productos en inventario</h3>
          <p className="text-muted-foreground mb-4">
            Agrega productos al inventario para comenzar a gestionar tu stock
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Agregar Primer Producto
          </Button>
        </div>
      )}

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Agregar Producto al Inventario</DialogTitle>
            <DialogDescription>
              Selecciona un producto y depósito para agregarlo al inventario
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="product_id"
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
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} ({product.code})
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
                name="warehouse_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Depósito</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar depósito" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {warehouses.map((warehouse) => (
                          <SelectItem key={warehouse.id} value={warehouse.id}>
                            {warehouse.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="current_stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock Actual</FormLabel>
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

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="minimum_stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock Mínimo</FormLabel>
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
                  name="maximum_stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock Máximo</FormLabel>
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
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  Agregar Producto
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}