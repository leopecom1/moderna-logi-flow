import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useCreateProductMapping } from "@/hooks/useProductMappings";
import { useUpdateWooCommerceProduct, useBatchCreateWooCommerceVariations } from "@/hooks/useWooCommerceProducts";
import { WooCommerceProduct } from "@/types/woocommerce";
import { ShopifyProduct } from "@/types/shopify";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ProductMappingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  woocommerceProduct: WooCommerceProduct | null;
  shopifyProduct: ShopifyProduct | null;
}

export function ProductMappingModal({
  open,
  onOpenChange,
  woocommerceProduct,
  shopifyProduct,
}: ProductMappingModalProps) {
  const hasVariants = shopifyProduct && shopifyProduct.variants.length > 1;
  
  const [selectedFields, setSelectedFields] = useState({
    images: true,
    description: true,
    price: true,
    sku: true,
    variants: hasVariants,
  });

  const [syncProgress, setSyncProgress] = useState<string>("");

  const createMapping = useCreateProductMapping();
  const updateProduct = useUpdateWooCommerceProduct();
  const batchCreateVariations = useBatchCreateWooCommerceVariations();
  const { toast } = useToast();

  const handleToggleField = (field: string) => {
    setSelectedFields(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleMapOnly = async () => {
    if (!woocommerceProduct || !shopifyProduct) return;

    await createMapping.mutateAsync({
      woocommerce_product_id: woocommerceProduct.id,
      shopify_product_id: shopifyProduct.id,
      woocommerce_product_name: woocommerceProduct.name,
      shopify_product_name: shopifyProduct.title,
    });

    onOpenChange(false);
  };

  const handleMapAndCopy = async () => {
    if (!woocommerceProduct || !shopifyProduct) return;

    try {
      // Debug logging
      console.log('Shopify product options:', shopifyProduct.options);
      console.log('Shopify product variants:', shopifyProduct.variants);
      
      setSyncProgress("Creando mapeo...");
      
      // Create mapping first
      await createMapping.mutateAsync({
        woocommerce_product_id: woocommerceProduct.id,
        shopify_product_id: shopifyProduct.id,
        woocommerce_product_name: woocommerceProduct.name,
        shopify_product_name: shopifyProduct.title,
      });

      // Function to extract attributes from variants if options is empty
      const extractAttributesFromVariants = () => {
        const attributeMap: Record<string, Set<string>> = {};
        
        shopifyProduct.variants.forEach(variant => {
          if (shopifyProduct.options.length > 0) {
            // Use option names from shopify
            shopifyProduct.options.forEach((opt, idx) => {
              const value = idx === 0 ? variant.option1 : idx === 1 ? variant.option2 : variant.option3;
              if (value) {
                if (!attributeMap[opt.name]) attributeMap[opt.name] = new Set();
                attributeMap[opt.name].add(value);
              }
            });
          } else {
            // Infer generic names from variant values
            if (variant.option1) {
              if (!attributeMap['Opción 1']) attributeMap['Opción 1'] = new Set();
              attributeMap['Opción 1'].add(variant.option1);
            }
            if (variant.option2) {
              if (!attributeMap['Opción 2']) attributeMap['Opción 2'] = new Set();
              attributeMap['Opción 2'].add(variant.option2);
            }
            if (variant.option3) {
              if (!attributeMap['Opción 3']) attributeMap['Opción 3'] = new Set();
              attributeMap['Opción 3'].add(variant.option3);
            }
          }
        });

        return Object.entries(attributeMap).map(([name, values], idx) => ({
          name,
          options: Array.from(values),
          visible: true,
          variation: true,
          position: idx,
        }));
      };

      // Build update data based on selected fields
      const updateData: any = {};

      if (selectedFields.images) {
        updateData.images = shopifyProduct.images.map(img => ({ src: img.src }));
      }

      if (selectedFields.description) {
        updateData.description = shopifyProduct.body_html;
      }

      // Only add price to parent if NOT creating variants
      if (selectedFields.price && shopifyProduct.variants[0] && !selectedFields.variants) {
        const firstVariant = shopifyProduct.variants[0];
        const hasDiscount = firstVariant.compare_at_price && 
                          parseFloat(firstVariant.compare_at_price) > parseFloat(firstVariant.price);
        
        updateData.regular_price = hasDiscount ? firstVariant.compare_at_price : firstVariant.price;
        if (hasDiscount) {
          updateData.sale_price = firstVariant.price;
        }
      }

      // Only add SKU to parent if NOT creating variants
      if (selectedFields.sku && shopifyProduct.variants[0] && !selectedFields.variants) {
        updateData.sku = shopifyProduct.variants[0].sku;
      }

      if (selectedFields.variants && shopifyProduct.variants.length > 1) {
        updateData.type = 'variable';
        
        // Use options if available, otherwise extract from variants
        if (shopifyProduct.options.length > 0) {
          updateData.attributes = shopifyProduct.options.map((opt, idx) => ({
            name: opt.name,
            options: opt.values,
            visible: true,
            variation: true,
            position: idx,
          }));
        } else {
          // Fallback: extract attributes from variants
          updateData.attributes = extractAttributesFromVariants();
        }
        
        console.log('Attributes to send to WooCommerce:', updateData.attributes);
      }

      setSyncProgress("Actualizando producto...");
      
      // Update WooCommerce product
      await updateProduct.mutateAsync({
        id: woocommerceProduct.id,
        data: updateData,
      });

      // Create variations if selected
      if (selectedFields.variants && shopifyProduct.variants.length > 1) {
        // Step 1: Get existing variations
        setSyncProgress("Obteniendo variantes existentes...");
        const { data: existingVariations } = await supabase.functions.invoke(
          `woocommerce-products/products/${woocommerceProduct.id}/variations`,
          { method: 'GET' }
        );

        // Step 2: Delete existing variations if any
        if (existingVariations && existingVariations.length > 0) {
          setSyncProgress(`Eliminando ${existingVariations.length} variantes anteriores...`);
          const deleteIds = existingVariations.map((v: any) => v.id);
          
          await supabase.functions.invoke(
            `woocommerce-products/products/${woocommerceProduct.id}/variations/batch`,
            { 
              method: 'POST',
              body: { delete: deleteIds }
            }
          );
        }
        setSyncProgress(`Creando ${shopifyProduct.variants.length} variantes...`);
        
        // Log stock data for debugging
        console.log('Variation stock data:', shopifyProduct.variants.map(v => ({
          title: v.title,
          inventory_quantity: v.inventory_quantity
        })));
        
        const wooVariations = shopifyProduct.variants.map(variant => {
          let attributes: { name: string; option: string }[] = [];
          
          if (shopifyProduct.options.length > 0) {
            // Use option names from Shopify options
            attributes = shopifyProduct.options.map((opt, idx) => ({
              name: opt.name,
              option: (idx === 0 ? variant.option1 : idx === 1 ? variant.option2 : variant.option3) || '',
            })).filter(attr => attr.option);
          } else {
            // Use generic names for attributes
            if (variant.option1) attributes.push({ name: 'Opción 1', option: variant.option1 });
            if (variant.option2) attributes.push({ name: 'Opción 2', option: variant.option2 });
            if (variant.option3) attributes.push({ name: 'Opción 3', option: variant.option3 });
          }

          // Handle pricing: if compare_at_price exists and is higher, use it as regular_price
          const hasDiscount = variant.compare_at_price && 
                            parseFloat(variant.compare_at_price) > parseFloat(variant.price);

          // Determine stock status based on Shopify inventory
          const isInStock = (variant.inventory_quantity ?? 0) > 0;

          // Build base variation data - only status, no quantity management
          const variationData: any = {
            regular_price: hasDiscount ? variant.compare_at_price! : variant.price,
            manage_stock: false,
            stock_status: isInStock ? 'instock' : 'outofstock',
            attributes,
          };

          // Add optional properties only if they have values
          if (hasDiscount) {
            variationData.sale_price = variant.price;
          }
          
          if (variant.sku) {
            variationData.sku = variant.sku;
          }

          return variationData;
        });
        
        console.log('Variations to send to WooCommerce:', wooVariations);

        await batchCreateVariations.mutateAsync({
          productId: woocommerceProduct.id,
          variations: wooVariations,
        });
      }

      setSyncProgress("");
      
      toast({
        title: "Sincronización completada",
        description: selectedFields.variants 
          ? `Producto y ${shopifyProduct.variants.length} variantes copiados correctamente`
          : "Los datos se copiaron correctamente de Shopify a WooCommerce",
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Error copying data:', error);
      setSyncProgress("");
      toast({
        title: "Error",
        description: "Ocurrió un error al copiar los datos",
        variant: "destructive",
      });
    }
  };

  if (!woocommerceProduct || !shopifyProduct) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>🔗 Asociar y Copiar Producto</DialogTitle>
          <DialogDescription>
            Selecciona qué información copiar de Shopify a WooCommerce
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product comparison */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">WooCommerce</Label>
              <div className="border rounded-lg p-3">
                {woocommerceProduct.images[0] && (
                  <img
                    src={woocommerceProduct.images[0].src}
                    alt={woocommerceProduct.name}
                    className="w-full h-32 object-cover rounded mb-2"
                  />
                )}
                <p className="font-medium text-sm">{woocommerceProduct.name}</p>
                <p className="text-xs text-muted-foreground">SKU: {woocommerceProduct.sku}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground">Shopify</Label>
              <div className="border rounded-lg p-3">
                {shopifyProduct.images[0] && (
                  <img
                    src={shopifyProduct.images[0].src}
                    alt={shopifyProduct.title}
                    className="w-full h-32 object-cover rounded mb-2"
                  />
                )}
                <p className="font-medium text-sm">{shopifyProduct.title}</p>
                <p className="text-xs text-muted-foreground">SKU: {shopifyProduct.variants[0]?.sku}</p>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <Label className="text-base font-semibold mb-3 block">
              📋 ¿Qué información deseas copiar de Shopify?
            </Label>

            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="images"
                  checked={selectedFields.images}
                  onCheckedChange={() => handleToggleField('images')}
                />
                <div className="space-y-1">
                  <Label htmlFor="images" className="cursor-pointer">
                    Imágenes ({shopifyProduct.images.length} disponibles)
                  </Label>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="description"
                  checked={selectedFields.description}
                  onCheckedChange={() => handleToggleField('description')}
                />
                <Label htmlFor="description" className="cursor-pointer">
                  Descripción
                </Label>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="price"
                  checked={selectedFields.price}
                  onCheckedChange={() => handleToggleField('price')}
                />
                <Label htmlFor="price" className="cursor-pointer">
                  Precio (${shopifyProduct.variants[0]?.price})
                </Label>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="sku"
                  checked={selectedFields.sku}
                  onCheckedChange={() => handleToggleField('sku')}
                />
                <Label htmlFor="sku" className="cursor-pointer">
                  SKU
                </Label>
              </div>

              {shopifyProduct.variants.length > 1 && (
                <>
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="variants"
                      checked={selectedFields.variants}
                      onCheckedChange={() => handleToggleField('variants')}
                    />
                    <div className="space-y-1">
                      <Label htmlFor="variants" className="cursor-pointer">
                        Variantes ({shopifyProduct.variants.length} variantes: {shopifyProduct.options.map(o => o.name).join(', ')})
                      </Label>
                    </div>
                  </div>
                  {selectedFields.variants && (
                    <Alert variant="destructive" className="ml-6">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        Esto reemplazará las variantes existentes del producto en WooCommerce
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {syncProgress && (
          <Alert>
            <AlertDescription className="text-sm flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              {syncProgress}
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={!!syncProgress}
          >
            Cancelar
          </Button>
          <Button
            variant="secondary"
            onClick={handleMapOnly}
            disabled={createMapping.isPending || !!syncProgress}
          >
            🔗 Solo Asociar
          </Button>
          <Button
            onClick={handleMapAndCopy}
            disabled={createMapping.isPending || updateProduct.isPending || batchCreateVariations.isPending || !!syncProgress}
          >
            {syncProgress ? syncProgress : "📥 Asociar y Copiar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
