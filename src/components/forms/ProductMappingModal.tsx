import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useCreateProductMapping } from "@/hooks/useProductMappings";
import { useUpdateWooCommerceProduct } from "@/hooks/useWooCommerceProducts";
import { WooCommerceProduct } from "@/types/woocommerce";
import { ShopifyProduct } from "@/types/shopify";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const [selectedFields, setSelectedFields] = useState({
    images: true,
    description: true,
    price: true,
    sku: true,
    variants: false,
  });

  const createMapping = useCreateProductMapping();
  const updateProduct = useUpdateWooCommerceProduct();
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
      // Create mapping first
      await createMapping.mutateAsync({
        woocommerce_product_id: woocommerceProduct.id,
        shopify_product_id: shopifyProduct.id,
        woocommerce_product_name: woocommerceProduct.name,
        shopify_product_name: shopifyProduct.title,
      });

      // Build update data based on selected fields
      const updateData: any = {};

      if (selectedFields.images) {
        updateData.images = shopifyProduct.images.map(img => ({ src: img.src }));
      }

      if (selectedFields.description) {
        updateData.description = shopifyProduct.body_html;
      }

      if (selectedFields.price && shopifyProduct.variants[0]) {
        updateData.regular_price = shopifyProduct.variants[0].price;
        if (shopifyProduct.variants[0].compare_at_price) {
          updateData.sale_price = shopifyProduct.variants[0].compare_at_price;
        }
      }

      if (selectedFields.sku && shopifyProduct.variants[0]) {
        updateData.sku = shopifyProduct.variants[0].sku;
      }

      if (selectedFields.variants && shopifyProduct.variants.length > 1) {
        updateData.type = 'variable';
        updateData.attributes = shopifyProduct.options.map((opt, idx) => ({
          name: opt.name,
          options: opt.values,
          visible: true,
          variation: true,
          position: idx,
        }));
      }

      // Update WooCommerce product
      await updateProduct.mutateAsync({
        id: woocommerceProduct.id,
        data: updateData,
      });

      toast({
        title: "Sincronización completada",
        description: "Los datos se copiaron correctamente de Shopify a WooCommerce",
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Error copying data:', error);
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

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            variant="secondary"
            onClick={handleMapOnly}
            disabled={createMapping.isPending}
          >
            🔗 Solo Asociar
          </Button>
          <Button
            onClick={handleMapAndCopy}
            disabled={createMapping.isPending || updateProduct.isPending}
          >
            {createMapping.isPending || updateProduct.isPending ? "Procesando..." : "📥 Asociar y Copiar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
