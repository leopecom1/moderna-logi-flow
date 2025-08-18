import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery } from "@tanstack/react-query";
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Pencil } from "lucide-react";

const formSchema = z.object({
  code: z.string().min(1, "Código es requerido"),
  name: z.string().min(1, "Nombre es requerido"),
  price: z.number().min(0, "Precio debe ser mayor a 0"),
  cost: z.number().min(0, "Costo debe ser mayor a 0"),
  category: z.string(),
  brand: z.string(),
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface Product {
  id: string;
  code: string;
  name: string;
  price: number;
  cost: number;
  category?: string;
  brand?: string;
  is_active: boolean;
}

interface EditProductModalProps {
  product: Product;
  onProductUpdated?: () => void;
}

export function EditProductModal({ product, onProductUpdated }: EditProductModalProps) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ["categories-edit"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, parent_id")
        .eq("is_active", true)
        .order("parent_id", { ascending: true, nullsFirst: true })
        .order("name");
      
      if (error) throw error;
      
      const mainCategories = data?.filter(cat => !cat.parent_id) || [];
      const subcategories = data?.filter(cat => cat.parent_id) || [];
      
      const grouped = mainCategories.map(main => ({
        ...main,
        subcategories: subcategories.filter(sub => sub.parent_id === main.id)
      }));
      
      return { grouped, all: data };
    },
    enabled: open,
  });

  // Fetch brands
  const { data: brands } = useQuery({
    queryKey: ["brands-edit"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brands")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: product.code,
      name: product.name,
      price: product.price,
      cost: product.cost,
      category: product.category || "none",
      brand: product.brand || "none",
      is_active: product.is_active,
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        code: product.code,
        name: product.name,
        price: product.price,
        cost: product.cost,
        category: product.category || "none",
        brand: product.brand || "none",
        is_active: product.is_active,
      });
    }
  }, [open, product, form]);

  const price = form.watch("price");
  const cost = form.watch("cost");
  const marginPercentage = price > 0 && cost > 0 ? ((price - cost) / price * 100) : 0;

  const onSubmit = async (values: FormValues) => {
    try {
      const { error } = await supabase
        .from("products")
        .update({
          code: values.code,
          name: values.name,
          price: values.price,
          cost: values.cost,
          category: values.category === "none" ? null : values.category,
          brand: values.brand === "none" ? null : values.brand,
          margin_percentage: marginPercentage,
          is_active: values.is_active,
        })
        .eq("id", product.id);

      if (error) throw error;

      toast({
        title: "Producto actualizado",
        description: "El producto ha sido actualizado exitosamente.",
      });

      setOpen(false);
      onProductUpdated?.();
    } catch (error) {
      console.error("Error updating product:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el producto.",
        variant: "destructive",
      });
    }
  };

  const onDelete = async () => {
    if (!confirm("¿Estás seguro de que quieres eliminar este producto? Esta acción no se puede deshacer.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", product.id);

      if (error) throw error;

      toast({
        title: "Producto eliminado",
        description: "El producto ha sido eliminado exitosamente.",
      });

      setOpen(false);
      onProductUpdated?.();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el producto.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Producto</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código</FormLabel>
                    <FormControl>
                      <Input placeholder="Código del producto" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre del producto" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio de Venta</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
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
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Costo</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {marginPercentage > 0 && (
              <div className="text-sm text-muted-foreground">
                Margen de ganancia: {marginPercentage.toFixed(2)}%
              </div>
            )}

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin categoría</SelectItem>
                        {categories?.grouped?.map((category) => (
                          <React.Fragment key={category.id}>
                            <SelectItem value={category.name}>
                              {category.name}
                            </SelectItem>
                            {category.subcategories?.map((sub) => (
                              <SelectItem key={sub.id} value={sub.name} className="pl-6">
                                └ {sub.name}
                              </SelectItem>
                            ))}
                          </React.Fragment>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="brand"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Marca</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar marca" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin marca</SelectItem>
                        {brands?.map((brand) => (
                          <SelectItem key={brand.id} value={brand.name}>
                            {brand.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Producto Activo</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      El producto estará disponible para la venta
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-between">
              <Button
                type="button"
                variant="destructive"
                onClick={onDelete}
              >
                Eliminar
              </Button>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">Actualizar</Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}