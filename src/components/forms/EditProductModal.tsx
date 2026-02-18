import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Pencil,
  Globe,
  Store,
  Link2,
  Link2Off,
  CheckCircle2,
  PlusCircle,
  Search,
  Package,
  Boxes,
  Warehouse,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { ProductVariantConfig } from "./ProductVariantConfig";
import { WooCommerceImageUpload } from "./WooCommerceImageUpload";
import {
  useCreateWooCommerceProduct,
  useUpdateWooCommerceProduct,
  useWooCommerceProducts,
} from "@/hooks/useWooCommerceProducts";
import { useWooCommerceCategories } from "@/hooks/useWooCommerceCategories";

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
  currency: z.enum(['UYU', 'USD']).default('UYU'),
});

type FormValues = z.infer<typeof formSchema>;

interface WooStockConfig {
  mode: 'disabled' | 'virtual' | 'real';
  virtual_quantity: number;
  warehouse_id: string | null;
}

interface WooNewProductData {
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
  categories?: { id: string; name: string };
  brand?: string;
  is_active: boolean;
  use_automatic_pricing?: boolean;
  has_variants?: boolean;
  currency?: 'UYU' | 'USD';
  woocommerce_product_id?: number | null;
  web_stock_mode?: 'disabled' | 'virtual' | 'real';
  web_virtual_stock?: number;
  web_stock_warehouse_id?: string | null;
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

  // WooCommerce state
  const [wooLinked, setWooLinked] = React.useState<number | null>(product.woocommerce_product_id ?? null);
  const [wooStockConfig, setWooStockConfig] = React.useState<WooStockConfig>({
    mode: (product.web_stock_mode as WooStockConfig['mode']) || 'virtual',
    virtual_quantity: product.web_virtual_stock ?? 10,
    warehouse_id: product.web_stock_warehouse_id ?? null,
  });
  const [wooNewProductData, setWooNewProductData] = React.useState<WooNewProductData>({
    name: product.name,
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

  // Association sub-modal state
  const [showAssocModal, setShowAssocModal] = React.useState(false);
  const [assocSearch, setAssocSearch] = React.useState('');
  const [assocPage, setAssocPage] = React.useState(1);
  const [savingStock, setSavingStock] = React.useState(false);
  const [creatingWoo, setCreatingWoo] = React.useState(false);
  const [unlinking, setUnlinking] = React.useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createWooMutation = useCreateWooCommerceProduct();
  const updateWooMutation = useUpdateWooCommerceProduct();
  const { data: wooCategories, isLoading: wooCategoriesLoading } = useWooCommerceCategories();

  // WooCommerce products for association
  const { data: wooProductsData, isLoading: wooProductsLoading } = useWooCommerceProducts(
    assocPage, 20, assocSearch || undefined
  );

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

  // Fetch warehouses
  const { data: warehouses } = useQuery({
    queryKey: ["warehouses-woo-edit"],
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

  // Sync wooLinked and wooStockConfig when product changes or modal opens
  React.useEffect(() => {
    if (open) {
      setWooLinked(product.woocommerce_product_id ?? null);
      setWooStockConfig({
        mode: (product.web_stock_mode as WooStockConfig['mode']) || 'virtual',
        virtual_quantity: product.web_virtual_stock ?? 10,
        warehouse_id: product.web_stock_warehouse_id ?? null,
      });
      setWooNewProductData(prev => ({ ...prev, name: product.name }));
    }
  }, [open, product]);

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
      currency: product.currency || "UYU",
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
        currency: product.currency || "UYU",
      });
    }
  }, [open, product, form]);

  const useAutomaticPricing = form.watch("use_automatic_pricing");
  const watchedCost = form.watch("cost");
  const watchedCurrency = form.watch("currency");

  React.useEffect(() => {
    if (useAutomaticPricing && watchedCost > 0 && priceConfig) {
      const margin1 = priceConfig.margin_percentage_list_1 || 0;
      const margin2 = priceConfig.margin_percentage_list_2 || 0;
      form.setValue("price_list_1", watchedCost * (1 + margin1 / 100));
      form.setValue("price_list_2", watchedCost * (1 + margin2 / 100));
    }
  }, [useAutomaticPricing, watchedCost, priceConfig, form]);

  const price_list_1 = form.watch("price_list_1");
  const price_list_2 = form.watch("price_list_2");
  const cost = form.watch("cost");
  const margin1 = cost > 0 ? ((price_list_1 - cost) / cost * 100) : 0;
  const margin2 = cost > 0 ? ((price_list_2 - cost) / cost * 100) : 0;

  // Calculate real stock
  const calculateRealStock = async (warehouseId: string | null): Promise<number> => {
    let query = supabase
      .from('inventory_items')
      .select('current_stock')
      .eq('product_id', product.id);
    if (warehouseId) query = query.eq('warehouse_id', warehouseId);
    const { data } = await query;
    return data?.reduce((sum, item) => sum + (item.current_stock || 0), 0) ?? 0;
  };

  // Save internal product
  const onSubmit = async (values: FormValues) => {
    try {
      const { error } = await supabase
        .from("products")
        .update({
          code: values.code,
          name: values.name,
          price: values.price_list_1,
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
          currency: values.currency,
        })
        .eq("id", product.id);

      if (error) throw error;

      toast({ title: "Producto actualizado", description: "El producto ha sido actualizado exitosamente." });
      setOpen(false);
      onProductUpdated?.();
    } catch (error) {
      console.error("Error updating product:", error);
      toast({ title: "Error", description: "No se pudo actualizar el producto.", variant: "destructive" });
    }
  };

  const onDelete = async () => {
    if (!confirm("¿Estás seguro de que quieres eliminar este producto? Esta acción no se puede deshacer.")) return;
    try {
      const { error } = await supabase.from("products").delete().eq("id", product.id);
      if (error) throw error;
      toast({ title: "Producto eliminado", description: "El producto ha sido eliminado exitosamente." });
      setOpen(false);
      onProductUpdated?.();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({ title: "Error", description: "No se pudo eliminar el producto.", variant: "destructive" });
    }
  };

  // Save web stock config (update WooCommerce + Supabase)
  const handleSaveWebStock = async () => {
    if (!wooLinked) return;
    setSavingStock(true);
    try {
      let stockPayload: { manage_stock: boolean; stock_quantity?: number; backorders?: string } = { manage_stock: false };

      if (wooStockConfig.mode === 'virtual') {
        stockPayload = { manage_stock: true, stock_quantity: wooStockConfig.virtual_quantity, backorders: 'no' };
      } else if (wooStockConfig.mode === 'real') {
        const realStock = await calculateRealStock(wooStockConfig.warehouse_id);
        stockPayload = { manage_stock: true, stock_quantity: realStock, backorders: 'no' };
      }

      await updateWooMutation.mutateAsync({ id: wooLinked, data: stockPayload });

      await supabase.from('products').update({
        web_stock_mode: wooStockConfig.mode,
        web_virtual_stock: wooStockConfig.mode === 'virtual' ? wooStockConfig.virtual_quantity : product.web_virtual_stock ?? 10,
        web_stock_warehouse_id: wooStockConfig.mode === 'real' ? wooStockConfig.warehouse_id : null,
      }).eq('id', product.id);

      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: "Stock web actualizado", description: "La configuración de stock fue guardada y sincronizada con WooCommerce." });
      onProductUpdated?.();
    } catch (err: any) {
      toast({ title: "Error al guardar stock web", description: err?.message || "No se pudo guardar la configuración.", variant: "destructive" });
    } finally {
      setSavingStock(false);
    }
  };

  // Create new WooCommerce product and link
  const handleCreateAndLink = async () => {
    if (!wooNewProductData.regular_price) {
      toast({ title: "Precio requerido", description: "Ingresá el precio en pesos uruguayos para continuar.", variant: "destructive" });
      return;
    }
    setCreatingWoo(true);
    try {
      let stockPayload: any = { manage_stock: false };
      if (wooStockConfig.mode === 'virtual') {
        stockPayload = { manage_stock: true, stock_quantity: wooStockConfig.virtual_quantity, backorders: 'no' };
      } else if (wooStockConfig.mode === 'real') {
        const realStock = await calculateRealStock(wooStockConfig.warehouse_id);
        stockPayload = { manage_stock: true, stock_quantity: realStock, backorders: 'no' };
      }

      const wooPayload = {
        name: wooNewProductData.name,
        type: wooNewProductData.type,
        status: wooNewProductData.status,
        featured: wooNewProductData.featured,
        short_description: wooNewProductData.short_description || undefined,
        regular_price: wooNewProductData.regular_price,
        sale_price: wooNewProductData.on_sale && wooNewProductData.sale_price ? wooNewProductData.sale_price : undefined,
        categories: wooNewProductData.categories.map(id => ({ id })),
        images: wooNewProductData.images.map(src => ({ src })),
        ...stockPayload,
      };

      const wooResponse = await createWooMutation.mutateAsync(wooPayload);

      if (wooResponse?.id) {
        await supabase.from('products').update({
          woocommerce_product_id: wooResponse.id,
          web_stock_mode: wooStockConfig.mode,
          web_virtual_stock: wooStockConfig.virtual_quantity,
          web_stock_warehouse_id: wooStockConfig.mode === 'real' ? wooStockConfig.warehouse_id : null,
        }).eq('id', product.id);

        setWooLinked(wooResponse.id);
        queryClient.invalidateQueries({ queryKey: ['products'] });
        toast({ title: "Producto creado y vinculado", description: `Vinculado a WooCommerce ID ${wooResponse.id}.` });
        onProductUpdated?.();
      }
    } catch (err: any) {
      toast({ title: "Error al crear en WooCommerce", description: err?.message || "Verificá la configuración.", variant: "destructive" });
    } finally {
      setCreatingWoo(false);
    }
  };

  // Associate existing WooCommerce product
  const handleAssociate = async (wooId: number, wooName: string) => {
    try {
      let stockPayload: any = { manage_stock: false };
      if (wooStockConfig.mode === 'virtual') {
        stockPayload = { manage_stock: true, stock_quantity: wooStockConfig.virtual_quantity, backorders: 'no' };
      } else if (wooStockConfig.mode === 'real') {
        const realStock = await calculateRealStock(wooStockConfig.warehouse_id);
        stockPayload = { manage_stock: true, stock_quantity: realStock, backorders: 'no' };
      }

      // Sync stock config to WooCommerce
      await updateWooMutation.mutateAsync({ id: wooId, data: stockPayload });

      await supabase.from('products').update({
        woocommerce_product_id: wooId,
        web_stock_mode: wooStockConfig.mode,
        web_virtual_stock: wooStockConfig.virtual_quantity,
        web_stock_warehouse_id: wooStockConfig.mode === 'real' ? wooStockConfig.warehouse_id : null,
      }).eq('id', product.id);

      setWooLinked(wooId);
      setShowAssocModal(false);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: "Producto asociado", description: `"${wooName}" vinculado exitosamente (ID: ${wooId}).` });
      onProductUpdated?.();
    } catch (err: any) {
      toast({ title: "Error al asociar", description: err?.message || "No se pudo asociar el producto.", variant: "destructive" });
    }
  };

  // Unlink product
  const handleUnlink = async () => {
    if (!confirm("¿Desvincular este producto de WooCommerce? El producto en WooCommerce NO se eliminará.")) return;
    setUnlinking(true);
    try {
      await supabase.from('products').update({
        woocommerce_product_id: null,
        web_stock_mode: 'virtual',
        web_virtual_stock: 10,
        web_stock_warehouse_id: null,
      }).eq('id', product.id);

      setWooLinked(null);
      setWooStockConfig({ mode: 'virtual', virtual_quantity: 10, warehouse_id: null });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: "Producto desvinculado", description: "El vínculo con WooCommerce fue eliminado." });
      onProductUpdated?.();
    } catch (err: any) {
      toast({ title: "Error al desvincular", description: err?.message || "No se pudo desvincular.", variant: "destructive" });
    } finally {
      setUnlinking(false);
    }
  };

  const toggleWooCategory = (categoryId: number) => {
    setWooNewProductData(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter(id => id !== categoryId)
        : [...prev.categories, categoryId],
    }));
  };

  // Stock config panel (shared for both create and edit)
  const StockConfigPanel = () => (
    <div className="rounded-lg border p-4 space-y-4 bg-muted/30">
      <div className="flex items-center gap-2">
        <Boxes className="h-4 w-4 text-muted-foreground" />
        <p className="text-sm font-semibold">Configuración de Stock en la Tienda Web</p>
      </div>
      <RadioGroup
        value={wooStockConfig.mode}
        onValueChange={(val: WooStockConfig['mode']) =>
          setWooStockConfig(prev => ({ ...prev, mode: val }))
        }
        className="space-y-3"
      >
        {/* Sin gestión */}
        <div className="flex items-start gap-3 rounded-md border bg-background p-3">
          <RadioGroupItem value="disabled" id="edit-stock-disabled" className="mt-0.5" />
          <div className="space-y-0.5">
            <Label htmlFor="edit-stock-disabled" className="text-sm font-medium cursor-pointer">
              Sin gestión de stock
            </Label>
            <p className="text-xs text-muted-foreground">
              El producto siempre aparecerá como "En stock" sin mostrar cantidad.
            </p>
          </div>
        </div>

        {/* Virtual */}
        <div className="flex items-start gap-3 rounded-md border bg-background p-3">
          <RadioGroupItem value="virtual" id="edit-stock-virtual" className="mt-0.5" />
          <div className="flex-1 space-y-2">
            <Label htmlFor="edit-stock-virtual" className="text-sm font-medium cursor-pointer">
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
                    setWooStockConfig(prev => ({ ...prev, virtual_quantity: parseInt(e.target.value) || 0 }))
                  }
                />
                <span className="text-xs text-muted-foreground">unidades</span>
              </div>
            )}
          </div>
        </div>

        {/* Real */}
        <div className="flex items-start gap-3 rounded-md border bg-background p-3">
          <RadioGroupItem value="real" id="edit-stock-real" className="mt-0.5" />
          <div className="flex-1 space-y-2">
            <Label htmlFor="edit-stock-real" className="text-sm font-medium cursor-pointer">
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
                    setWooStockConfig(prev => ({ ...prev, warehouse_id: val === 'all' ? null : val }))
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
                  El stock se calculará desde el inventario al guardar.
                </p>
              </div>
            )}
          </div>
        </div>
      </RadioGroup>
    </div>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm">
            <Pencil className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Producto</DialogTitle>
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
                    {wooLinked && (
                      <Badge className="ml-1 h-4 px-1 text-[10px]" variant="default">Vinculado</Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                {/* ─── PESTAÑA INTERNO ─── */}
                <TabsContent value="interno" className="space-y-4 mt-4">
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
                              type="number" step="0.01" placeholder="0.00"
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
                              type="number" step="0.01" placeholder="0.00"
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
                            <Input type="number" placeholder="0" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
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
                            <Input type="number" placeholder="0" max="11" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
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

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="cost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Costo</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
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
                              <SelectItem value="UYU"><div className="flex items-center gap-2"><span>🇺🇾</span><span>Pesos Uruguayos (UYU)</span></div></SelectItem>
                              <SelectItem value="USD"><div className="flex items-center gap-2"><span>💵</span><span>Dólares (USD)</span></div></SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoría</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger><SelectValue placeholder="Seleccionar categoría" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Sin categoría</SelectItem>
                              {categories?.grouped?.map((category) => (
                                <React.Fragment key={category.id}>
                                  <SelectItem value={category.id}>{category.name} ({category.reference_number})</SelectItem>
                                  {category.subcategories?.map((sub) => (
                                    <SelectItem key={sub.id} value={sub.id} className="pl-6">└ {sub.name} ({sub.reference_number})</SelectItem>
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
                            <SelectTrigger><SelectValue placeholder="Seleccionar marca" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Sin marca</SelectItem>
                              {brands?.map((brand) => (
                                <SelectItem key={brand.id} value={brand.name}>{brand.name} ({brand.reference_number})</SelectItem>
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
                          <div className="text-sm text-muted-foreground">El producto tendrá variantes (color, tamaño, etc.)</div>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {form.watch("has_variants") && (
                    <ProductVariantConfig productId={product.id} isCreating={false} />
                  )}

                  <FormField
                    control={form.control}
                    name="use_automatic_pricing"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Usar Configuración Automática de Precios</FormLabel>
                          <div className="text-sm text-muted-foreground">Los precios se calcularán automáticamente según la configuración global</div>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
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
                          <div className="text-sm text-muted-foreground">El producto estará disponible para la venta</div>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-between pt-2">
                    <Button type="button" variant="destructive" onClick={onDelete}>Eliminar</Button>
                    <div className="flex space-x-2">
                      <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                      <Button type="submit">Actualizar</Button>
                    </div>
                  </div>
                </TabsContent>

                {/* ─── PESTAÑA WEB ─── */}
                <TabsContent value="web" className="space-y-5 mt-4">
                  {wooLinked ? (
                    /* ── Estado B: Vinculado ── */
                    <div className="space-y-5">
                      {/* Header vinculado */}
                      <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 p-4">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              Vinculado a WooCommerce
                            </p>
                            <p className="text-xs text-muted-foreground">
                              ID: {wooLinked} · <a
                                href="#"
                                className="underline"
                                onClick={(e) => { e.preventDefault(); window.open(`https://wp-admin/post.php?post=${wooLinked}&action=edit`, '_blank'); }}
                              >Ver en WooCommerce ↗</a>
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={handleUnlink}
                          disabled={unlinking}
                        >
                          {unlinking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2Off className="h-4 w-4" />}
                          <span className="ml-1 text-xs">Desvincular</span>
                        </Button>
                      </div>

                      <StockConfigPanel />

                      <div className="flex justify-end">
                        <Button
                          type="button"
                          onClick={handleSaveWebStock}
                          disabled={savingStock}
                          className="gap-2"
                        >
                          {savingStock ? <Loader2 className="h-4 w-4 animate-spin" /> : <Boxes className="h-4 w-4" />}
                          Guardar y sincronizar stock web
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* ── Estado A: Sin vinculación ── */
                    <div className="space-y-5">
                      <div className="rounded-lg border border-dashed p-6 text-center space-y-3">
                        <Globe className="h-10 w-10 text-muted-foreground mx-auto opacity-40" />
                        <p className="text-sm font-medium">Este producto no tiene un producto web asociado</p>
                        <p className="text-xs text-muted-foreground">
                          Podés crear un producto nuevo en WooCommerce o asociar uno existente.
                        </p>
                        <div className="flex gap-2 justify-center pt-2">
                          <Button
                            type="button"
                            variant="default"
                            size="sm"
                            onClick={() => setShowAssocModal(true)}
                          >
                            <Link2 className="h-4 w-4 mr-1" />
                            Asociar existente
                          </Button>
                        </div>
                      </div>

                      {/* Crear nuevo en WooCommerce */}
                      <Separator />
                      <div className="space-y-4">
                        <p className="text-sm font-semibold flex items-center gap-2">
                          <PlusCircle className="h-4 w-4" />
                          Crear nuevo producto en WooCommerce
                        </p>

                        {watchedCurrency === 'USD' && (
                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              Este producto tiene precio en USD. Ingresá el equivalente en <strong>pesos uruguayos</strong> para la tienda web.
                            </AlertDescription>
                          </Alert>
                        )}

                        <div className="space-y-1">
                          <label className="text-sm font-medium">Nombre en la tienda web</label>
                          <Input
                            value={wooNewProductData.name}
                            onChange={(e) => setWooNewProductData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Nombre del producto"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-sm font-medium">Tipo de producto</label>
                          <Select
                            value={wooNewProductData.type}
                            onValueChange={(val: 'simple' | 'variable') => setWooNewProductData(prev => ({ ...prev, type: val }))}
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="simple">Simple</SelectItem>
                              <SelectItem value="variable">Variable</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-sm font-medium">Descripción corta (opcional)</label>
                          <Textarea
                            value={wooNewProductData.short_description}
                            onChange={(e) => setWooNewProductData(prev => ({ ...prev, short_description: e.target.value }))}
                            placeholder="Breve descripción..."
                            rows={2}
                          />
                        </div>

                        {/* Precio UYU */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <label className="text-sm font-medium">Precio en la tienda web</label>
                            <Badge variant="outline" className="text-xs">🇺🇾 UYU</Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">Precio regular *</label>
                              <Input
                                type="number" step="0.01" placeholder="0.00"
                                value={wooNewProductData.regular_price}
                                onChange={(e) => setWooNewProductData(prev => ({ ...prev, regular_price: e.target.value }))}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">Precio oferta (opcional)</label>
                              <Input
                                type="number" step="0.01" placeholder="0.00"
                                value={wooNewProductData.sale_price}
                                onChange={(e) => setWooNewProductData(prev => ({ ...prev, sale_price: e.target.value }))}
                                disabled={!wooNewProductData.on_sale}
                                className={!wooNewProductData.on_sale ? "bg-muted" : ""}
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={wooNewProductData.on_sale}
                              onCheckedChange={(val) => setWooNewProductData(prev => ({ ...prev, on_sale: val }))}
                            />
                            <span className="text-sm">Producto en oferta</span>
                          </div>
                        </div>

                        <StockConfigPanel />

                        {/* Estado */}
                        <div className="flex items-center justify-between rounded-lg border p-3">
                          <div>
                            <p className="text-sm font-medium">Publicado</p>
                            <p className="text-xs text-muted-foreground">Visible en la tienda</p>
                          </div>
                          <Switch
                            checked={wooNewProductData.status === 'publish'}
                            onCheckedChange={(val) => setWooNewProductData(prev => ({ ...prev, status: val ? 'publish' : 'draft' }))}
                          />
                        </div>

                        {/* Categorías */}
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Categorías de la tienda web</p>
                          {wooCategoriesLoading ? (
                            <p className="text-xs text-muted-foreground">Cargando...</p>
                          ) : wooCategories && wooCategories.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {wooCategories.map((cat: any) => (
                                <Badge
                                  key={cat.id}
                                  variant={wooNewProductData.categories.includes(cat.id) ? "default" : "outline"}
                                  className="cursor-pointer"
                                  onClick={() => toggleWooCategory(cat.id)}
                                >
                                  {cat.name}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">No hay categorías en WooCommerce.</p>
                          )}
                        </div>

                        {/* Imágenes */}
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Imagen del producto (opcional)</p>
                          <WooCommerceImageUpload
                            onImageUploaded={(url) => setWooNewProductData(prev => ({ ...prev, images: [...prev.images, url] }))}
                            onImageRemoved={(url) => setWooNewProductData(prev => ({ ...prev, images: prev.images.filter(i => i !== url) }))}
                            maxFiles={5}
                            existingImages={wooNewProductData.images}
                          />
                        </div>

                        <Button
                          type="button"
                          className="w-full gap-2"
                          onClick={handleCreateAndLink}
                          disabled={creatingWoo || !wooNewProductData.regular_price}
                        >
                          {creatingWoo ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                          Crear en WooCommerce y vincular
                        </Button>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ── Sub-modal: Asociar producto existente de WooCommerce ── */}
      <Dialog open={showAssocModal} onOpenChange={setShowAssocModal}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Asociar producto de WooCommerce
            </DialogTitle>
          </DialogHeader>

          <div className="flex items-center gap-2 border-b pb-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre..."
              value={assocSearch}
              onChange={(e) => { setAssocSearch(e.target.value); setAssocPage(1); }}
              className="border-0 shadow-none focus-visible:ring-0 p-0 h-auto text-sm"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 py-2">
            {wooProductsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (wooProductsData?.products || wooProductsData || []).length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">No se encontraron productos.</p>
            ) : (
              (wooProductsData?.products || wooProductsData || []).map((wooProduct: any) => (
                <div
                  key={wooProduct.id}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 cursor-pointer"
                  onClick={() => handleAssociate(wooProduct.id, wooProduct.name)}
                >
                  <div className="flex items-center gap-3">
                    {wooProduct.images?.[0]?.src ? (
                      <img src={wooProduct.images[0].src} alt={wooProduct.name} className="h-10 w-10 rounded object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                        <Package className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium">{wooProduct.name}</p>
                      <p className="text-xs text-muted-foreground">ID: {wooProduct.id} · {wooProduct.status}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      ${wooProduct.price || wooProduct.regular_price || '—'}
                    </Badge>
                    <Button type="button" size="sm" variant="default">
                      Asociar
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-between items-center pt-3 border-t">
            <Button type="button" variant="outline" size="sm" disabled={assocPage <= 1} onClick={() => setAssocPage(p => p - 1)}>
              ← Anterior
            </Button>
            <span className="text-xs text-muted-foreground">Página {assocPage}</span>
            <Button type="button" variant="outline" size="sm" onClick={() => setAssocPage(p => p + 1)}>
              Siguiente →
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
