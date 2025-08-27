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
import { ProductVariantConfig } from "./ProductVariantConfig";

const formSchema = z.object({
  code: z.string().min(1, "Código es requerido"),
  name: z.string().min(1, "Nombre es requerido"),
  price_list_1: z.number().min(0, "El precio de lista 1 debe ser mayor a 0"),
  price_list_2: z.number().min(0, "El precio de lista 2 debe ser mayor a 0"),
  cost: z.number().min(0, "Costo debe ser mayor a 0"),
  category: z.string(),
  brand: z.string(),
  warranty_years: z.number().min(0).optional(),
  warranty_months: z.number().min(0).max(11).optional(),
  supplier_code: z.string().optional(),
  is_active: z.boolean(),
  use_automatic_pricing: z.boolean().default(true),
  has_variants: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

interface Product {
  id: string;
  code: string;
  name: string;
  price: number;
  price_list_1: number;
  price_list_2: number;
  warranty_years?: number;
  warranty_months?: number;
  supplier_code?: string;
  cost: number;
  category_id?: string;
  categories?: {
    id: string;
    name: string;
  };
  brand?: string;
  is_active: boolean;
  use_automatic_pricing?: boolean;
  has_variants?: boolean;
}

interface EditProductModalProps {
  product: Product;
  onProductUpdated?: () => void;
}

export function EditProductModal({ product, onProductUpdated }: EditProductModalProps) {
  const [open, setOpen] = React.useState(false);
  const [priceListConfig, setPriceListConfig] = React.useState({
    price_list_1_name: 'Lista 1',
    price_list_2_name: 'Lista 2'
  });
  const { toast } = useToast();

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ["categories-edit"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, parent_id, reference_number")
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
        .select("id, name, reference_number")
        .eq("is_active", true)
        .order("name");
      
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Fetch price list configuration
  const { data: priceConfig } = useQuery({
    queryKey: ["price_lists_config_edit"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("price_lists_config")
        .select("price_list_1_name, price_list_2_name, auto_calculate_enabled, margin_percentage_list_1, margin_percentage_list_2")
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: open,
  });

  React.useEffect(() => {
    if (priceConfig) {
      setPriceListConfig({
        price_list_1_name: priceConfig.price_list_1_name,
        price_list_2_name: priceConfig.price_list_2_name,
      });
    }
  }, [priceConfig]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: product.code,
      name: product.name,
      price_list_1: product.price_list_1 || product.price,
      price_list_2: product.price_list_2 || 0,
      cost: product.cost,
      category: product.categories?.id || "none",
      brand: product.brand || "none",
      warranty_years: product.warranty_years || 0,
      warranty_months: product.warranty_months || 0,
      supplier_code: product.supplier_code || "",
      is_active: product.is_active,
      use_automatic_pricing: product.use_automatic_pricing ?? true,
      has_variants: product.has_variants ?? false,
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        code: product.code,
        name: product.name,
        price_list_1: product.price_list_1 || product.price,
        price_list_2: product.price_list_2 || 0,
        cost: product.cost,
        category: product.categories?.id || "none",
        brand: product.brand || "none",
        warranty_years: product.warranty_years || 0,
        warranty_months: product.warranty_months || 0,
        supplier_code: product.supplier_code || "",
        is_active: product.is_active,
        use_automatic_pricing: product.use_automatic_pricing ?? true,
        has_variants: product.has_variants ?? false,
      });
    }
  }, [open, product, form]);

  const useAutomaticPricing = form.watch("use_automatic_pricing");
  const watchedCost = form.watch("cost");
  
  // Calcular precios automáticamente si está habilitado
  React.useEffect(() => {
    if (useAutomaticPricing && watchedCost > 0 && priceConfig) {
      const margin1 = priceConfig.margin_percentage_list_1 || 0;
      const margin2 = priceConfig.margin_percentage_list_2 || 0;
      
      const calculatedPrice1 = watchedCost * (1 + margin1 / 100);
      const calculatedPrice2 = watchedCost * (1 + margin2 / 100);
      
      form.setValue("price_list_1", calculatedPrice1);
      form.setValue("price_list_2", calculatedPrice2);
    }
  }, [useAutomaticPricing, watchedCost, priceConfig, form]);

  const price_list_1 = form.watch("price_list_1");
  const price_list_2 = form.watch("price_list_2");
  const cost = form.watch("cost");
  const margin1 = cost > 0 ? ((price_list_1 - cost) / cost * 100) : 0;
  const margin2 = cost > 0 ? ((price_list_2 - cost) / cost * 100) : 0;

  const onSubmit = async (values: FormValues) => {
    try {
      const { error } = await supabase
        .from("products")
        .update({
          code: values.code,
          name: values.name,
          price: values.price_list_1, // Mantener compatibilidad
          price_list_1: values.price_list_1,
          price_list_2: values.price_list_2,
          cost: values.cost,
        category_id: values.category === "none" ? null : values.category,
        brand: values.brand === "none" ? null : values.brand,
        warranty_years: values.warranty_years || null,
        warranty_months: values.warranty_months || null,
        supplier_code: values.supplier_code || null,
          margin_percentage: margin1,
          is_active: values.is_active,
          use_automatic_pricing: values.use_automatic_pricing,
          has_variants: values.has_variants,
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
                name="price_list_1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{priceListConfig.price_list_1_name}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        disabled={useAutomaticPricing}
                        className={useAutomaticPricing ? "bg-muted" : ""}
                      />
                    </FormControl>
                    <FormMessage />
                    {cost > 0 && (
                      <div className="text-xs text-muted-foreground">
                        Margen: {margin1.toFixed(2)}%
                        {useAutomaticPricing && priceConfig && (
                          <span> ({priceConfig.margin_percentage_list_1 || 0}% configurado)</span>
                        )}
                      </div>
                    )}
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price_list_2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{priceListConfig.price_list_2_name}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        disabled={useAutomaticPricing}
                        className={useAutomaticPricing ? "bg-muted" : ""}
                      />
                    </FormControl>
                    <FormMessage />
                    {cost > 0 && (
                      <div className="text-xs text-muted-foreground">
                        Margen: {margin2.toFixed(2)}%
                        {useAutomaticPricing && priceConfig && (
                          <span> ({priceConfig.margin_percentage_list_2 || 0}% configurado)</span>
                        )}
                      </div>
                    )}
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="warranty_years"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Garantía (Años)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
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
                name="warranty_months"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Garantía (Meses)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        max="11"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="supplier_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código Proveedor</FormLabel>
                  <FormControl>
                    <Input placeholder="Código del proveedor" {...field} />
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
                            <SelectItem value={category.id}>
                              {category.name} ({category.reference_number})
                            </SelectItem>
                            {category.subcategories?.map((sub) => (
                              <SelectItem key={sub.id} value={sub.id} className="pl-6">
                                └ {sub.name} ({sub.reference_number})
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
                              {brand.name} ({brand.reference_number})
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
              name="has_variants"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Producto con Variantes</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      El producto tendrá variantes (color, tamaño, etc.)
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

            {/* Configuración de variantes */}
            {form.watch("has_variants") && (
              <ProductVariantConfig
                productId={product.id}
                isCreating={false}
              />
            )}

            <FormField
              control={form.control}
              name="use_automatic_pricing"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Usar Configuración Automática de Precios</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Los precios se calcularán automáticamente según la configuración global
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