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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Globe, AlertCircle, Store, Package, Boxes, Warehouse } from "lucide-react";
import { CreateCategoryModal } from "./CreateCategoryModal";
import { ProductVariantConfig } from "./ProductVariantConfig";
import { WooCommerceImageUpload } from "./WooCommerceImageUpload";
import { useCreateWooCommerceProduct, useUpdateWooCommerceProduct } from "@/hooks/useWooCommerceProducts";
import { useWooCommerceCategories } from "@/hooks/useWooCommerceCategories";

const formSchema = z.object({
  name: z.string().min(1, "Nombre es requerido"),
  price_list_1: z.number().min(0, "El precio de lista 1 debe ser mayor a 0"),
  price_list_2: z.number().min(0, "El precio de lista 2 debe ser mayor a 0"),
  cost: z.number().min(0, "El costo debe ser mayor a 0"),
  category: z.string().default(""),
  brand: z.string().optional(),
  warranty_years: z.number().min(0).optional(),
  warranty_months: z.number().min(0).max(11).optional(),
  supplier_code: z.string().optional(),
  is_active: z.boolean().default(true),
  use_automatic_pricing: z.boolean().default(true),
  has_variants: z.boolean().default(false),
  createNewCategory: z.boolean().default(false),
  newCategoryName: z.string().default(""),
  currency: z.enum(['UYU', 'USD']).default('UYU'),
}).superRefine((data, ctx) => {
  if (data.createNewCategory) {
    if (!data.newCategoryName || data.newCategoryName.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El nombre de la nueva categoría es requerido",
        path: ["newCategoryName"],
      });
    }
  } else {
    if (!data.category || data.category === "" || data.category === "none") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Categoría es requerida",
        path: ["category"],
      });
    }
  }
});

type FormValues = z.infer<typeof formSchema>;

interface CreateProductModalProps {
  onProductCreated?: () => void;
}

interface PriceListConfig {
  price_list_1_name: string;
  price_list_2_name: string;
}

interface WooFormData {
  name: string;
  type: 'simple' | 'variable';
  short_description: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  status: 'publish' | 'draft';
  featured: boolean;
  categories: number[];
  images: string[];
}

interface WooStockConfig {
  mode: 'disabled' | 'virtual' | 'real';
  virtual_quantity: number;
  warehouse_id: string | null; // null = todos los depósitos
}

export function CreateProductModal({ onProductCreated }: CreateProductModalProps) {
  const [open, setOpen] = React.useState(false);
  const [priceListConfig, setPriceListConfig] = React.useState<PriceListConfig>({
    price_list_1_name: 'Lista 1',
    price_list_2_name: 'Lista 2'
  });
  const [createWooProduct, setCreateWooProduct] = React.useState(false);
  const [wooFormData, setWooFormData] = React.useState<WooFormData>({
    name: '',
    type: 'simple',
    short_description: '',
    regular_price: '',
    sale_price: '',
    on_sale: false,
    status: 'publish',
    featured: false,
    categories: [],
    images: [],
  });
  const [wooStockConfig, setWooStockConfig] = React.useState<WooStockConfig>({
    mode: 'virtual',
    virtual_quantity: 10,
    warehouse_id: null,
  });
  const [realStockPreview, setRealStockPreview] = React.useState<number | null>(null);
  const { toast } = useToast();

  const createWooMutation = useCreateWooCommerceProduct();
  const updateWooMutation = useUpdateWooCommerceProduct();
  const { data: wooCategories, isLoading: wooCategoriesLoading } = useWooCommerceCategories();

  // Fetch categories
  const { data: categories, refetch: refetchCategories } = useQuery({
    queryKey: ["categories"],
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
  });

  // Fetch brands
  const { data: brands, isLoading: brandsLoading, error: brandsError } = useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brands")
        .select("id, name, reference_number")
        .eq("is_active", true)
        .order("name");
      
      if (error) {
        console.error("Error fetching brands:", error);
        throw error;
      }
      return data;
    },
    enabled: open,
  });

  // Fetch warehouses
  const { data: warehouses } = useQuery({
    queryKey: ["warehouses-woo"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("warehouses")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: open,
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

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      price_list_1: 0,
      price_list_2: 0,
      cost: 0,
      category: "",
      brand: "",
      warranty_years: 0,
      warranty_months: 0,
      supplier_code: "",
      is_active: true,
      use_automatic_pricing: true,
      has_variants: false,
      createNewCategory: false,
      newCategoryName: "",
      currency: "UYU",
    },
  });

  const createNewCategory = form.watch("createNewCategory");
  const useAutomaticPricing = form.watch("use_automatic_pricing");
  const hasVariants = form.watch("has_variants");
  const watchedCost = form.watch("cost");
  const watchedName = form.watch("name");
  const watchedBrand = form.watch("brand");
  const watchedCurrency = form.watch("currency");
  
  // State for variants
  const [variants, setVariants] = React.useState<any[]>([]);

  // Sync name and brand to wooFormData
  React.useEffect(() => {
    if (watchedName) {
      setWooFormData(prev => ({
        ...prev,
        name: watchedBrand && watchedBrand !== 'none' && watchedBrand !== ''
          ? `${watchedBrand} ${watchedName}`
          : watchedName,
      }));
    }
  }, [watchedName, watchedBrand]);

  // Función para generar código automático
  const generateProductCode = async (categoryName: string): Promise<string> => {
    if (!categoryName || categoryName === "none") {
      return "GE001";
    }

    const categoryPrefix = categoryName.substring(0, 2).toUpperCase();

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

    const lastCode = existingProducts[0].code;
    const numberPart = lastCode.substring(2);
    const nextNumber = parseInt(numberPart) + 1;

    return `${categoryPrefix}${nextNumber.toString().padStart(3, '0')}`;
  };

  // Calcular stock real desde inventario
  const calculateRealStock = async (productId: string, warehouseId: string | null): Promise<number> => {
    let query = supabase
      .from('inventory_items')
      .select('current_stock')
      .eq('product_id', productId);
    
    if (warehouseId) {
      query = query.eq('warehouse_id', warehouseId);
    }
    
    const { data } = await query;
    return data?.reduce((sum, item) => sum + (item.current_stock || 0), 0) ?? 0;
  };

  const onSubmit = async (values: FormValues) => {
    try {
      let finalCategory = values.category;

      if (values.createNewCategory && values.newCategoryName) {
        const { data: newCategory, error: categoryError } = await supabase
          .from("categories")
          .insert([{ name: values.newCategoryName }])
          .select()
          .single();

        if (categoryError) throw categoryError;
        finalCategory = newCategory.id;
      }

      const generatedCode = await generateProductCode(finalCategory);

      const productData = {
        code: generatedCode,
        name: values.name,
        price: values.price_list_1,
        price_list_1: values.price_list_1,
        price_list_2: values.price_list_2,
        cost: values.cost,
        category_id: finalCategory === "none" ? null : finalCategory || null,
        brand: values.brand === "none" ? null : values.brand || null,
        warranty_years: values.warranty_years || null,
        warranty_months: values.warranty_months || null,
        supplier_code: values.supplier_code || null,
        is_active: values.is_active,
        use_automatic_pricing: values.use_automatic_pricing,
        has_variants: values.has_variants,
        currency: values.currency,
        // Web stock config (solo se establece si se crea con WooCommerce)
        web_stock_mode: createWooProduct && wooFormData.regular_price ? wooStockConfig.mode : 'virtual',
        web_virtual_stock: createWooProduct && wooFormData.regular_price ? wooStockConfig.virtual_quantity : 10,
        web_stock_warehouse_id: createWooProduct && wooFormData.regular_price && wooStockConfig.mode === 'real' ? wooStockConfig.warehouse_id : null,
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

      // Si se pidió crear también en WooCommerce
      if (createWooProduct && wooFormData.regular_price) {
        try {
          // Calcular stock según configuración
          let stockPayload: { manage_stock: boolean; stock_quantity?: number; backorders?: string } = {
            manage_stock: false
          };

          if (wooStockConfig.mode === 'virtual') {
            stockPayload = {
              manage_stock: true,
              stock_quantity: wooStockConfig.virtual_quantity,
              backorders: 'no'
            };
          } else if (wooStockConfig.mode === 'real') {
            const realStock = await calculateRealStock(product.id, wooStockConfig.warehouse_id);
            stockPayload = {
              manage_stock: true,
              stock_quantity: realStock,
              backorders: 'no'
            };
          }

          const wooPayload: any = {
            name: wooFormData.name,
            type: wooFormData.type,
            status: wooFormData.status,
            featured: wooFormData.featured,
            short_description: wooFormData.short_description || undefined,
            regular_price: wooFormData.regular_price,
            sale_price: wooFormData.on_sale && wooFormData.sale_price ? wooFormData.sale_price : undefined,
            categories: wooFormData.categories.map(id => ({ id })),
            images: wooFormData.images.map(src => ({ src })),
            ...stockPayload,
          };

          const wooResponse = await createWooMutation.mutateAsync(wooPayload);

          // Guardar el ID de WooCommerce en el producto interno
          if (wooResponse?.id) {
            await supabase
              .from('products')
              .update({ woocommerce_product_id: wooResponse.id })
              .eq('id', product.id);
          }

          toast({
            title: "Producto publicado en la tienda web",
            description: "El producto también fue creado exitosamente en WooCommerce.",
          });
        } catch (wooError: any) {
          console.error("Error creating WooCommerce product:", wooError);
          toast({
            title: "Advertencia: error en la tienda web",
            description: "El producto interno se creó correctamente, pero no se pudo publicar en WooCommerce. Verificá la configuración.",
            variant: "destructive",
          });
        }
      }

      form.reset();
      setVariants([]);
      setCreateWooProduct(false);
      setWooFormData({
        name: '',
        type: 'simple',
        short_description: '',
        regular_price: '',
        sale_price: '',
        on_sale: false,
        status: 'publish',
        featured: false,
        categories: [],
        images: [],
      });
      setWooStockConfig({ mode: 'virtual', virtual_quantity: 10, warehouse_id: null });
      setRealStockPreview(null);
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

  const toggleWooCategory = (categoryId: number) => {
    setWooFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter(id => id !== categoryId)
        : [...prev.categories, categoryId],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Producto
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Producto</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs defaultValue="interno" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="interno" className="flex items-center gap-2">
                  <Store className="h-4 w-4" />
                  Producto Interno
                </TabsTrigger>
                <TabsTrigger value="web" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Producto Web
                  {createWooProduct && (
                    <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">ON</Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* ─── PESTAÑA INTERNO ─── */}
              <TabsContent value="interno" className="space-y-4 mt-4">
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

                <div className="grid grid-cols-2 gap-4">
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
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Moneda</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar moneda" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="UYU">
                              <div className="flex items-center gap-2">
                                <span>🇺🇾</span>
                                <span>Pesos Uruguayos (UYU)</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="USD">
                              <div className="flex items-center gap-2">
                                <span>💵</span>
                                <span>Dólares (USD)</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
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

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="createNewCategory"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                              if (checked) {
                                form.setValue("category", "");
                                form.clearErrors("category");
                              } else {
                                form.setValue("newCategoryName", "");
                                form.clearErrors("newCategoryName");
                              }
                            }}
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
                              {!createNewCategory && categories?.grouped?.flatMap((category) => [
                                <SelectItem key={category.id} value={category.id}>
                                  {category.name} ({category.reference_number})
                                </SelectItem>,
                                ...(category.subcategories?.map((sub) => (
                                  <SelectItem key={sub.id} value={sub.id} className="pl-6">
                                    └ {sub.name} ({sub.reference_number})
                                  </SelectItem>
                                )) || []),
                              ])}
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
                                   {brand.name} ({brand.reference_number})
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
              </TabsContent>

              {/* ─── PESTAÑA WEB ─── */}
              <TabsContent value="web" className="space-y-4 mt-4">
                {/* Toggle principal */}
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <p className="text-base font-medium">Publicar también en la tienda web</p>
                    <p className="text-sm text-muted-foreground">
                      Al guardar, se creará el producto también en WooCommerce
                    </p>
                  </div>
                  <Switch
                    checked={createWooProduct}
                    onCheckedChange={setCreateWooProduct}
                  />
                </div>

                {!createWooProduct ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground space-y-2">
                    <Globe className="h-10 w-10 opacity-30" />
                    <p className="text-sm">Activá la opción para completar el producto web.</p>
                    <p className="text-xs opacity-70">Si no lo activás, solo se creará el producto interno.</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* Aviso moneda USD */}
                    {watchedCurrency === 'USD' && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Este producto tiene precio en USD. Ingresá el precio equivalente en <strong>pesos uruguayos</strong> para la tienda web.
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Nombre */}
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Nombre en la tienda web</label>
                      <Input
                        value={wooFormData.name}
                        onChange={(e) => setWooFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Nombre del producto"
                      />
                      <p className="text-xs text-muted-foreground">Pre-llenado desde el producto interno. Podés editarlo.</p>
                    </div>

                    {/* Tipo */}
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Tipo de producto</label>
                      <Select
                        value={wooFormData.type}
                        onValueChange={(val: 'simple' | 'variable') =>
                          setWooFormData(prev => ({ ...prev, type: val }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="simple">Simple</SelectItem>
                          <SelectItem value="variable">Variable</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Descripción corta */}
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Descripción corta (opcional)</label>
                      <Textarea
                        value={wooFormData.short_description}
                        onChange={(e) => setWooFormData(prev => ({ ...prev, short_description: e.target.value }))}
                        placeholder="Breve descripción del producto para la tienda..."
                        rows={3}
                      />
                    </div>

                    {/* Precio en UYU */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">Precio en la tienda web</label>
                        <Badge variant="outline" className="text-xs">🇺🇾 Pesos Uruguayos (UYU)</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">Precio regular *</label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={wooFormData.regular_price}
                            onChange={(e) => setWooFormData(prev => ({ ...prev, regular_price: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">Precio en oferta (opcional)</label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={wooFormData.sale_price}
                            onChange={(e) => setWooFormData(prev => ({ ...prev, sale_price: e.target.value }))}
                            disabled={!wooFormData.on_sale}
                            className={!wooFormData.on_sale ? "bg-muted" : ""}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={wooFormData.on_sale}
                          onCheckedChange={(val) => setWooFormData(prev => ({ ...prev, on_sale: val }))}
                        />
                        <span className="text-sm">Producto en oferta</span>
                      </div>
                    </div>

                    {/* ─── CONFIGURACIÓN DE STOCK WEB ─── */}
                    <div className="rounded-lg border p-4 space-y-4 bg-muted/30">
                      <div className="flex items-center gap-2">
                        <Boxes className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-semibold">Configuración de Stock en la Tienda Web</p>
                      </div>
                      <p className="text-xs text-muted-foreground">¿Cómo gestionar el stock online?</p>

                      <RadioGroup
                        value={wooStockConfig.mode}
                        onValueChange={(val: 'disabled' | 'virtual' | 'real') =>
                          setWooStockConfig(prev => ({ ...prev, mode: val }))
                        }
                        className="space-y-3"
                      >
                        {/* Sin gestión */}
                        <div className="flex items-start gap-3 rounded-md border bg-background p-3">
                          <RadioGroupItem value="disabled" id="stock-disabled" className="mt-0.5" />
                          <div className="space-y-0.5">
                            <Label htmlFor="stock-disabled" className="text-sm font-medium cursor-pointer">
                              Sin gestión de stock
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              El producto siempre aparecerá como "En stock" sin mostrar cantidad.
                            </p>
                          </div>
                        </div>

                        {/* Virtual */}
                        <div className="flex items-start gap-3 rounded-md border bg-background p-3">
                          <RadioGroupItem value="virtual" id="stock-virtual" className="mt-0.5" />
                          <div className="flex-1 space-y-2">
                            <Label htmlFor="stock-virtual" className="text-sm font-medium cursor-pointer">
                              Stock Virtual Simulado
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              Muestra una cantidad fija definida por vos, sin importar el inventario real.
                            </p>
                            {wooStockConfig.mode === 'virtual' && (
                              <div className="flex items-center gap-2 pt-1">
                                <Package className="h-4 w-4 text-muted-foreground" />
                                <label className="text-xs font-medium whitespace-nowrap">Cantidad a mostrar:</label>
                                <Input
                                  type="number"
                                  min={0}
                                  className="h-8 w-24 text-sm"
                                  value={wooStockConfig.virtual_quantity}
                                  onChange={(e) =>
                                    setWooStockConfig(prev => ({
                                      ...prev,
                                      virtual_quantity: parseInt(e.target.value) || 0
                                    }))
                                  }
                                />
                                <span className="text-xs text-muted-foreground">unidades</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Real */}
                        <div className="flex items-start gap-3 rounded-md border bg-background p-3">
                          <RadioGroupItem value="real" id="stock-real" className="mt-0.5" />
                          <div className="flex-1 space-y-2">
                            <Label htmlFor="stock-real" className="text-sm font-medium cursor-pointer">
                              Stock Real del Depósito
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              Sincroniza el stock desde el inventario real de tu depósito al guardar.
                            </p>
                            {wooStockConfig.mode === 'real' && (
                              <div className="space-y-2 pt-1">
                                <div className="flex items-center gap-2">
                                  <Warehouse className="h-4 w-4 text-muted-foreground" />
                                  <label className="text-xs font-medium">Depósito de referencia:</label>
                                </div>
                                <Select
                                  value={wooStockConfig.warehouse_id ?? 'all'}
                                  onValueChange={(val) =>
                                    setWooStockConfig(prev => ({
                                      ...prev,
                                      warehouse_id: val === 'all' ? null : val
                                    }))
                                  }
                                >
                                  <SelectTrigger className="h-8 text-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="all">Todos los depósitos (suma total)</SelectItem>
                                    {warehouses?.map(w => (
                                      <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground italic">
                                  El stock se sincronizará al guardar el producto.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Estado y visibilidad */}
                    <div className="space-y-3">
                      <p className="text-sm font-medium">Estado y visibilidad</p>
                      <div className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <p className="text-sm font-medium">Publicado</p>
                          <p className="text-xs text-muted-foreground">Visible en la tienda web</p>
                        </div>
                        <Switch
                          checked={wooFormData.status === 'publish'}
                          onCheckedChange={(val) =>
                            setWooFormData(prev => ({ ...prev, status: val ? 'publish' : 'draft' }))
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <p className="text-sm font-medium">Destacado</p>
                          <p className="text-xs text-muted-foreground">Aparece en secciones de destacados</p>
                        </div>
                        <Switch
                          checked={wooFormData.featured}
                          onCheckedChange={(val) => setWooFormData(prev => ({ ...prev, featured: val }))}
                        />
                      </div>
                    </div>

                    {/* Categorías WooCommerce */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Categorías de la tienda web</p>
                      {wooCategoriesLoading ? (
                        <p className="text-xs text-muted-foreground">Cargando categorías...</p>
                      ) : wooCategories && wooCategories.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {wooCategories.map((cat: any) => (
                            <Badge
                              key={cat.id}
                              variant={wooFormData.categories.includes(cat.id) ? "default" : "outline"}
                              className="cursor-pointer"
                              onClick={() => toggleWooCategory(cat.id)}
                            >
                              {cat.name}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">No hay categorías disponibles en la tienda web.</p>
                      )}
                    </div>

                    {/* Imágenes */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Imagen del producto (opcional)</p>
                      <WooCommerceImageUpload
                        onImageUploaded={(url) =>
                          setWooFormData(prev => ({ ...prev, images: [...prev.images, url] }))
                        }
                        onImageRemoved={(url) =>
                          setWooFormData(prev => ({ ...prev, images: prev.images.filter(i => i !== url) }))
                        }
                        maxFiles={5}
                        existingImages={wooFormData.images}
                      />
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <div className="flex justify-end space-x-2 pt-2 border-t">
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
                {createWooProduct ? "Crear Producto + Publicar en Web" : "Crear Producto"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
