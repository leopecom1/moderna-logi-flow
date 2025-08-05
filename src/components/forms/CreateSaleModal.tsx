import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Plus } from "lucide-react";

const formSchema = z.object({
  customer_id: z.string().min(1, "Cliente es requerido"),
  product_id: z.string().min(1, "Producto es requerido"),
  location_id: z.string().nullable().optional(),
  sale_date: z.string().min(1, "Fecha de venta es requerida"),
  quantity: z.number().min(1, "La cantidad debe ser mayor a 0"),
  unit_price: z.number().min(0, "El precio debe ser mayor a 0"),
  unit_cost: z.number().min(0, "El costo debe ser mayor a 0"),
  notes: z.string().nullable().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateSaleModalProps {
  onSaleCreated?: () => void;
  customerId?: string;
}

export function CreateSaleModal({ onSaleCreated, customerId }: CreateSaleModalProps) {
  const [open, setOpen] = React.useState(false);
  const [customers, setCustomers] = React.useState<any[]>([]);
  const [products, setProducts] = React.useState<any[]>([]);
  const [locations, setLocations] = React.useState<any[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customer_id: customerId || "",
      product_id: "",
      location_id: "",
      sale_date: new Date().toISOString().split('T')[0],
      quantity: 1,
      unit_price: 0,
      unit_cost: 0,
      notes: "",
    },
  });

  // Cargar datos necesarios
  React.useEffect(() => {
    const loadData = async () => {
      try {
        const [customersResult, productsResult, locationsResult] = await Promise.all([
          supabase.from("customers").select("id, name"),
          supabase.from("products").select("id, name, code, price, cost").eq('is_active', true),
          supabase.from("locations").select("id, name").eq('is_active', true),
        ]);

        if (customersResult.data) setCustomers(customersResult.data);
        if (productsResult.data) setProducts(productsResult.data);
        if (locationsResult.data) setLocations(locationsResult.data);
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    if (open) {
      loadData();
    }
  }, [open]);

  // Actualizar precios cuando se selecciona un producto
  const selectedProduct = products.find(p => p.id === form.watch("product_id"));
  React.useEffect(() => {
    if (selectedProduct) {
      form.setValue("unit_price", selectedProduct.price);
      form.setValue("unit_cost", selectedProduct.cost);
    }
  }, [selectedProduct, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      if (!user) throw new Error("Usuario no autenticado");

      const { error } = await supabase
        .from("sales")
        .insert([{
          ...values,
          seller_id: user.id,
        }]);

      if (error) throw error;

      toast({
        title: "Venta registrada",
        description: "La venta ha sido registrada exitosamente.",
      });

      form.reset({
        customer_id: customerId || "",
        product_id: "",
        location_id: "",
        sale_date: new Date().toISOString().split('T')[0],
        quantity: 1,
        unit_price: 0,
        unit_cost: 0,
        notes: "",
      });
      setOpen(false);
      onSaleCreated?.();
    } catch (error) {
      console.error("Error creating sale:", error);
      toast({
        title: "Error",
        description: "No se pudo registrar la venta.",
        variant: "destructive",
      });
    }
  };

  // Calcular totales en tiempo real
  const quantity = form.watch("quantity");
  const unitPrice = form.watch("unit_price");
  const unitCost = form.watch("unit_cost");
  const totalAmount = quantity * unitPrice;
  const totalCost = quantity * unitCost;
  const totalProfit = totalAmount - totalCost;
  const margin = unitCost > 0 ? ((unitPrice - unitCost) / unitCost * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Venta
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Nueva Venta</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customer_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!customerId}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar cliente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name}
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
                name="location_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sucursal</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar sucursal" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {locations.map((location) => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                          {product.code} - {product.name}
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
                name="sale_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Venta</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cantidad</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
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
                name="unit_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio Unitario</FormLabel>
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

            {quantity > 0 && unitPrice > 0 && (
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="text-sm font-medium">Resumen de la Venta:</div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>Total: ${totalAmount.toFixed(2)}</div>
                  <div>Costo Total: ${totalCost.toFixed(2)}</div>
                  <div>Ganancia: ${totalProfit.toFixed(2)}</div>
                  <div>Margen: {margin.toFixed(2)}%</div>
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Notas adicionales..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Registrar Venta</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}