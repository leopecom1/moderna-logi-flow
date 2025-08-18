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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import { CreateCategoryModal } from "./CreateCategoryModal";

const formSchema = z.object({
  code: z.string().min(1, "Código es requerido"),
  name: z.string().min(1, "Nombre es requerido"),
  price: z.number().min(0, "El precio debe ser mayor a 0"),
  cost: z.number().min(0, "El costo debe ser mayor a 0"),
  category: z.string().optional(),
  brand: z.string().optional(),
  is_active: z.boolean().default(true),
  createNewCategory: z.boolean().default(false),
  newCategoryName: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateProductModalProps {
  onProductCreated?: () => void;
}

export function CreateProductModal({ onProductCreated }: CreateProductModalProps) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();

  // Fetch categories
  const { data: categories, refetch: refetchCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, parent_id")
        .eq("is_active", true)
        .order("parent_id", { ascending: true, nullsFirst: true })
        .order("name");
      
      if (error) throw error;
      
      // Group categories with their subcategories for better display
      const mainCategories = data?.filter(cat => !cat.parent_id) || [];
      const subcategories = data?.filter(cat => cat.parent_id) || [];
      
      const grouped = mainCategories.map(main => ({
        ...main,
        subcategories: subcategories.filter(sub => sub.parent_id === main.id)
      }));
      
      return { grouped, all: data };
    },
  });

  console.log("Categories data:", categories); // Debug log

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      name: "",
      price: 0,
      cost: 0,
      category: "",
      brand: "",
      is_active: true,
      createNewCategory: false,
      newCategoryName: "",
    },
  });

  const createNewCategory = form.watch("createNewCategory");

  const onSubmit = async (values: FormValues) => {
    try {
      let finalCategory = values.category;

      // Si se eligió crear una nueva categoría, crearla primero
      if (values.createNewCategory && values.newCategoryName) {
        const { data: newCategory, error: categoryError } = await supabase
          .from("categories")
          .insert([{ name: values.newCategoryName }])
          .select()
          .single();

        if (categoryError) throw categoryError;
        finalCategory = newCategory.name;
      }

      const productData = {
        code: values.code,
        name: values.name,
        price: values.price,
        cost: values.cost,
        category: finalCategory === "none" ? null : finalCategory || null,
        brand: values.brand || null,
        is_active: values.is_active,
      };

      const { error } = await supabase
        .from("products")
        .insert([productData]);

      if (error) throw error;

      toast({
        title: "Producto creado",
        description: "El producto ha sido creado exitosamente.",
      });

      form.reset();
      setOpen(false);
      onProductCreated?.();
      refetchCategories?.();
    } catch (error) {
      console.error("Error creating product:", error);
      toast({
        title: "Error",
        description: "No se pudo crear el producto.",
        variant: "destructive",
      });
    }
  };

  // Calcular margen en tiempo real
  const price = form.watch("price");
  const cost = form.watch("cost");
  const margin = cost > 0 ? ((price - cost) / cost * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Producto
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Producto</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: PROD001" {...field} />
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
                  <FormLabel>Nombre del Producto</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre del producto" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            {cost > 0 && (
              <div className="text-sm text-muted-foreground">
                Margen: {margin.toFixed(2)}%
              </div>
            )}

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="createNewCategory"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Crear nueva categoría</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {createNewCategory ? (
                <FormField
                  control={form.control}
                  name="newCategoryName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nueva Categoría</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre de la nueva categoría" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
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
              )}

              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marca</FormLabel>
                    <FormControl>
                      <Input placeholder="Marca" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Producto Activo</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      El producto estará disponible para ventas
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

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Crear Producto</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}