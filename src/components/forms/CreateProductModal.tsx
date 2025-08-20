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
import { ProductVariantConfig } from "./ProductVariantConfig";

const formSchema = z.object({
  name: z.string().min(1, "Nombre es requerido"),
  price_list_1: z.number().min(0, "El precio de lista 1 debe ser mayor a 0"),
  price_list_2: z.number().min(0, "El precio de lista 2 debe ser mayor a 0"),
  cost: z.number().min(0, "El costo debe ser mayor a 0"),
  category: z.string().min(1, "Categoría es requerida"),
  brand: z.string().optional(),
  is_active: z.boolean().default(true),
  use_automatic_pricing: z.boolean().default(true),
  has_variants: z.boolean().default(false),
  createNewCategory: z.boolean().default(false),
  newCategoryName: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateProductModalProps {
  onProductCreated?: () => void;
}

interface PriceListConfig {
  price_list_1_name: string;
  price_list_2_name: string;
}

export function CreateProductModal({ onProductCreated }: CreateProductModalProps) {
  const [open, setOpen] = React.useState(false);
  const [priceListConfig, setPriceListConfig] = React.useState<PriceListConfig>({
    price_list_1_name: 'Lista 1',
    price_list_2_name: 'Lista 2'
  });
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

  // Fetch brands
  const { data: brands, isLoading: brandsLoading, error: brandsError } = useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brands")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      
      if (error) {
        console.error("Error fetching brands:", error);
        throw error;
      }
      console.log("Fetched brands:", data);
      return data;
    },
    enabled: open, // Only fetch when modal is open
  });

  
  // Fetch price list configuration
  const { data: priceConfig } = useQuery({
    queryKey: ["price_lists_config"],
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

  console.log("Brands data:", brands, "Loading:", brandsLoading, "Error:", brandsError); // Debug log

  

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      price_list_1: 0,
      price_list_2: 0,
      cost: 0,
      category: "",
      brand: "",
      is_active: true,
      use_automatic_pricing: true,
      has_variants: false,
      createNewCategory: false,
      newCategoryName: "",
    },
  });

  const createNewCategory = form.watch("createNewCategory");
  const useAutomaticPricing = form.watch("use_automatic_pricing");
  const hasVariants = form.watch("has_variants");
  const watchedCost = form.watch("cost");
  
  // State for variants
  const [variants, setVariants] = React.useState<any[]>([]);

  // Función para generar código automático
  const generateProductCode = async (categoryName: string): Promise<string> => {
    if (!categoryName || categoryName === "none") {
      return "GE001"; // Código genérico si no hay categoría
    }

    // Obtener las primeras 2 letras de la categoría
    const categoryPrefix = categoryName.substring(0, 2).toUpperCase();

    // Buscar el último código usado para esta categoría
    const { data: existingProducts, error } = await supabase
      .from("products")
      .select("code")
      .like("code", `${categoryPrefix}%`)
      .order("code", { ascending: false })
      .limit(1);

    if (error) {
      console.error("Error fetching existing codes:", error);
      return `${categoryPrefix}001`;
    }

    if (!existingProducts || existingProducts.length === 0) {
      return `${categoryPrefix}001`;
    }

    // Extraer el número del último código
    const lastCode = existingProducts[0].code;
    const numberPart = lastCode.substring(2);
    const nextNumber = parseInt(numberPart) + 1;

    // Formatear con ceros a la izquierda (3 dígitos)
    return `${categoryPrefix}${nextNumber.toString().padStart(3, '0')}`;
  };

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

      // Generar código automáticamente
      const generatedCode = await generateProductCode(finalCategory);

      const productData = {
        code: generatedCode,
        name: values.name,
        price: values.price_list_1, // Mantener compatibilidad con el campo price existente
        price_list_1: values.price_list_1,
        price_list_2: values.price_list_2,
        cost: values.cost,
        category: finalCategory === "none" ? null : finalCategory || null,
        brand: values.brand === "none" ? null : values.brand || null,
        is_active: values.is_active,
        use_automatic_pricing: values.use_automatic_pricing,
        has_variants: values.has_variants,
      };

      const { data: product, error: productError } = await supabase
        .from("products")
        .insert([productData])
        .select()
        .single();

      if (productError) throw productError;

      // Si tiene variantes, crear las variantes
      if (values.has_variants && variants.length > 0) {
        const variantData = variants.map(variant => ({
          product_id: product.id,
          variant_values: variant.values,
          sku: variant.sku || null,
          price_adjustment: variant.priceAdjustment || 0,
          is_active: true
        }));

        const { error: variantError } = await supabase
          .from("product_variants")
          .insert(variantData);

        if (variantError) throw variantError;
      }

      toast({
        title: "Producto creado",
        description: `El producto${values.has_variants ? ' y sus variantes han' : ' ha'} sido creado exitosamente.`,
      });

      form.reset();
      setVariants([]);
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

  // Calcular margen en tiempo real
  const price_list_1 = form.watch("price_list_1");
  const price_list_2 = form.watch("price_list_2");
  const cost = form.watch("cost");
  const margin1 = cost > 0 ? ((price_list_1 - cost) / cost * 100) : 0;
  const margin2 = cost > 0 ? ((price_list_2 - cost) / cost * 100) : 0;

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
                      <FormLabel>Categoría *</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar categoría" />
                          </SelectTrigger>
                        <SelectContent>
                          {!createNewCategory && categories?.grouped?.map((category) => (
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
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar marca" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin marca</SelectItem>
                          {brandsLoading && (
                            <SelectItem value="loading" disabled>
                              Cargando marcas...
                            </SelectItem>
                          )}
                          {!brandsLoading && brands?.map((brand) => (
                            <SelectItem key={brand.id} value={brand.name}>
                              {brand.name}
                            </SelectItem>
                          ))}
                          {!brandsLoading && (!brands || brands.length === 0) && (
                            <SelectItem value="no-brands" disabled>
                              No hay marcas disponibles
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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

            {/* Variant Configuration */}
            {hasVariants && (
              <div className="space-y-4">
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-4">Configuración de Variantes</h3>
                  <ProductVariantConfig
                    isCreating={true}
                    onVariantsChange={setVariants}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={hasVariants && variants.length === 0}
              >
                Crear Producto
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}