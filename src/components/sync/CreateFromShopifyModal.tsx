import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ShopifyProduct } from "@/types/shopify";
import { useCreateWooCommerceProduct, useBatchCreateWooCommerceVariations } from "@/hooks/useWooCommerceProducts";
import { useCreateProductMapping } from "@/hooks/useProductMappings";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Package, Image, FileText, DollarSign, Tag, GitBranch, Link2 } from "lucide-react";

interface CreateFromShopifyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shopifyProduct: ShopifyProduct | null;
}

export function CreateFromShopifyModal({ open, onOpenChange, shopifyProduct }: CreateFromShopifyModalProps) {
  const [copyImages, setCopyImages] = useState(true);
  const [copyDescription, setCopyDescription] = useState(true);
  const [copyPrice, setCopyPrice] = useState(true);
  const [copySku, setCopySku] = useState(true);
  const [copyVariants, setCopyVariants] = useState(true);
  const [createMapping, setCreateMapping] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [progress, setProgress] = useState(0);

  const createProduct = useCreateWooCommerceProduct();
  const batchCreateVariations = useBatchCreateWooCommerceVariations();
  const createProductMapping = useCreateProductMapping();

  if (!shopifyProduct) return null;

  const hasMultipleVariants = shopifyProduct.variants.length > 1;
  const firstVariant = shopifyProduct.variants[0];
  const imageCount = shopifyProduct.images.length;

  const handleCreate = async () => {
    setIsCreating(true);
    setProgress(0);

    try {
      // Preparar imágenes
      const images = copyImages
        ? shopifyProduct.images.map(img => ({ src: img.src }))
        : [];

      setProgress(20);

      // Preparar atributos si es producto variable
      const isVariable = hasMultipleVariants && copyVariants;
      let attributes: any[] = [];

      if (isVariable) {
        // Extraer atributos únicos de las opciones de Shopify
        const optionsMap = new Map<string, Set<string>>();

        shopifyProduct.options.forEach(option => {
          if (option.values.length > 0) {
            optionsMap.set(option.name, new Set(option.values));
          }
        });

        // Si no hay opciones pero hay variantes con option1/option2/option3, extraer de ahí
        if (optionsMap.size === 0) {
          const option1Values = new Set<string>();
          const option2Values = new Set<string>();
          const option3Values = new Set<string>();

          shopifyProduct.variants.forEach(variant => {
            if (variant.option1) option1Values.add(variant.option1);
            if (variant.option2) option2Values.add(variant.option2);
            if (variant.option3) option3Values.add(variant.option3);
          });

          if (option1Values.size > 0) {
            optionsMap.set("Opción 1", option1Values);
          }
          if (option2Values.size > 0) {
            optionsMap.set("Opción 2", option2Values);
          }
          if (option3Values.size > 0) {
            optionsMap.set("Opción 3", option3Values);
          }
        }

        attributes = Array.from(optionsMap.entries()).map(([name, values]) => ({
          name,
          options: Array.from(values),
          visible: true,
          variation: true,
        }));
      }

      setProgress(40);

      // Crear producto en WooCommerce
      const productData: any = {
        name: shopifyProduct.title,
        type: isVariable ? 'variable' : 'simple',
        status: shopifyProduct.status === 'active' ? 'publish' : 'draft',
        description: copyDescription ? shopifyProduct.body_html : '',
        images,
      };

      // Si es producto simple, agregar precio y SKU
      if (!isVariable) {
        if (copyPrice) {
          productData.regular_price = firstVariant.price;
          if (firstVariant.compare_at_price) {
            productData.sale_price = firstVariant.price;
            productData.regular_price = firstVariant.compare_at_price;
          }
        }
        if (copySku) {
          productData.sku = firstVariant.sku || '';
        }
        productData.manage_stock = true;
        productData.stock_quantity = firstVariant.inventory_quantity || 0;
        productData.stock_status = firstVariant.inventory_quantity > 0 ? 'instock' : 'outofstock';
      }

      // Si es producto variable, agregar atributos
      if (isVariable) {
        productData.attributes = attributes;
      }

      const wooProduct = await createProduct.mutateAsync(productData);

      setProgress(60);

      // Si es producto variable, crear variaciones
      if (isVariable && wooProduct?.id) {
        const variations = shopifyProduct.variants.map(variant => {
          const variantAttributes: any[] = [];

          // Mapear option1, option2, option3 a atributos
          if (variant.option1) {
            const attrName = attributes[0]?.name || "Opción 1";
            variantAttributes.push({ name: attrName, option: variant.option1 });
          }
          if (variant.option2) {
            const attrName = attributes[1]?.name || "Opción 2";
            variantAttributes.push({ name: attrName, option: variant.option2 });
          }
          if (variant.option3) {
            const attrName = attributes[2]?.name || "Opción 3";
            variantAttributes.push({ name: attrName, option: variant.option3 });
          }

          return {
            status: 'publish' as const,
            sku: copySku ? (variant.sku || '') : '',
            regular_price: copyPrice ? (variant.compare_at_price || variant.price) : '0',
            sale_price: copyPrice && variant.compare_at_price ? variant.price : undefined,
            manage_stock: true,
            stock_quantity: variant.inventory_quantity || 0,
            stock_status: (variant.inventory_quantity > 0 ? 'instock' : 'outofstock') as 'instock' | 'outofstock',
            attributes: variantAttributes,
          };
        });

        await batchCreateVariations.mutateAsync({
          productId: wooProduct.id,
          variations,
        });
      }

      setProgress(80);

      // Crear mapeo si se seleccionó
      if (createMapping && wooProduct?.id) {
        await createProductMapping.mutateAsync({
          woocommerce_product_id: wooProduct.id,
          shopify_product_id: shopifyProduct.id,
          woocommerce_product_name: shopifyProduct.title,
          shopify_product_name: shopifyProduct.title,
        });
      }

      setProgress(100);

      toast.success(
        `✅ Producto "${shopifyProduct.title}" creado exitosamente en WooCommerce` +
        (isVariable ? ` con ${shopifyProduct.variants.length} variantes` : '')
      );

      onOpenChange(false);
      
      // Reset states
      setTimeout(() => {
        setIsCreating(false);
        setProgress(0);
      }, 500);

    } catch (error: any) {
      console.error('Error creating product:', error);
      toast.error(`Error al crear producto: ${error.message}`);
      setIsCreating(false);
      setProgress(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Producto en WooCommerce</DialogTitle>
          <DialogDescription>
            Crear un nuevo producto en WooCommerce desde Shopify
          </DialogDescription>
        </DialogHeader>

        {/* Preview del producto */}
        <div className="border rounded-lg p-4 bg-muted/30">
          <div className="flex gap-4">
            {shopifyProduct.images[0] && (
              <img
                src={shopifyProduct.images[0].src}
                alt={shopifyProduct.title}
                className="w-20 h-20 object-cover rounded"
              />
            )}
            <div className="flex-1">
              <h3 className="font-semibold">{shopifyProduct.title}</h3>
              <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  ${firstVariant.price}
                </span>
                {hasMultipleVariants && (
                  <span className="flex items-center gap-1">
                    <GitBranch className="h-3 w-3" />
                    {shopifyProduct.variants.length} variantes
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Opciones de copia */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Seleccionar campos a copiar:</h4>

          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="images"
                checked={copyImages}
                onCheckedChange={(checked) => setCopyImages(checked as boolean)}
              />
              <div className="flex-1">
                <Label htmlFor="images" className="flex items-center gap-2 cursor-pointer">
                  <Image className="h-4 w-4" />
                  Imágenes
                  <span className="text-muted-foreground text-xs">
                    ({imageCount} {imageCount === 1 ? 'imagen' : 'imágenes'})
                  </span>
                </Label>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="description"
                checked={copyDescription}
                onCheckedChange={(checked) => setCopyDescription(checked as boolean)}
              />
              <div className="flex-1">
                <Label htmlFor="description" className="flex items-center gap-2 cursor-pointer">
                  <FileText className="h-4 w-4" />
                  Descripción
                </Label>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="price"
                checked={copyPrice}
                onCheckedChange={(checked) => setCopyPrice(checked as boolean)}
              />
              <div className="flex-1">
                <Label htmlFor="price" className="flex items-center gap-2 cursor-pointer">
                  <DollarSign className="h-4 w-4" />
                  Precio
                  <span className="text-muted-foreground text-xs">
                    (${firstVariant.price})
                  </span>
                </Label>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="sku"
                checked={copySku}
                onCheckedChange={(checked) => setCopySku(checked as boolean)}
              />
              <div className="flex-1">
                <Label htmlFor="sku" className="flex items-center gap-2 cursor-pointer">
                  <Tag className="h-4 w-4" />
                  SKU
                  {firstVariant.sku && (
                    <span className="text-muted-foreground text-xs">
                      ({firstVariant.sku})
                    </span>
                  )}
                </Label>
              </div>
            </div>

            {hasMultipleVariants && (
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="variants"
                  checked={copyVariants}
                  onCheckedChange={(checked) => setCopyVariants(checked as boolean)}
                />
                <div className="flex-1">
                  <Label htmlFor="variants" className="flex items-center gap-2 cursor-pointer">
                    <GitBranch className="h-4 w-4" />
                    Variantes
                    <span className="text-muted-foreground text-xs">
                      ({shopifyProduct.variants.length} variantes con atributos: {shopifyProduct.options.map(o => o.name).join(', ')})
                    </span>
                  </Label>
                </div>
              </div>
            )}
          </div>

          <div className="border-t pt-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="mapping"
                checked={createMapping}
                onCheckedChange={(checked) => setCreateMapping(checked as boolean)}
              />
              <div className="flex-1">
                <Label htmlFor="mapping" className="flex items-center gap-2 cursor-pointer">
                  <Link2 className="h-4 w-4" />
                  Crear mapeo automático
                  <span className="text-muted-foreground text-xs">
                    (para futuras sincronizaciones)
                  </span>
                </Label>
              </div>
            </div>
          </div>
        </div>

        {/* Progress indicator */}
        {isCreating && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-sm text-muted-foreground text-center">
              Creando producto... {progress}%
            </p>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCreating}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isCreating}
            className="bg-green-600 hover:bg-green-700"
          >
            <Package className="h-4 w-4 mr-2" />
            {isCreating ? "Creando..." : "Crear Producto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
