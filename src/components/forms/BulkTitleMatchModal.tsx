import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Package } from "lucide-react";
import { useWooCommerceProducts } from "@/hooks/useWooCommerceProducts";
import { useShopifyProductsPaginated } from "@/hooks/useShopifyProducts";
import { useProductMappings } from "@/hooks/useProductMappings";

interface ProductMatch {
  woocommerce: any;
  shopify: any;
  selected: boolean;
}

interface BulkTitleMatchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartSync: (matches: ProductMatch[], copyOptions: CopyOptions) => void;
}

interface CopyOptions {
  images: boolean;
  description: boolean;
  price: boolean;
  variants: boolean;
}

const normalizeTitle = (title: string) => 
  title.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export function BulkTitleMatchModal({ open, onOpenChange, onStartSync }: BulkTitleMatchModalProps) {
  const [matches, setMatches] = useState<ProductMatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copyOptions, setCopyOptions] = useState<CopyOptions>({
    images: true,
    description: true,
    price: true,
    variants: true,
  });

  const { data: mappings } = useProductMappings();
  
  // We'll need to fetch ALL products, so we use a large per_page value
  const { data: wooData, isLoading: wooLoading } = useWooCommerceProducts(1, 1000);
  const { data: shopifyData, isLoading: shopifyLoading } = useShopifyProductsPaginated(1000);

  useEffect(() => {
    if (!open) return;
    
    setIsLoading(true);
    
    if (!wooData?.products || !shopifyData?.products) {
      setIsLoading(false);
      return;
    }

    // Get already mapped product IDs
    const mappedWooIds = new Set(mappings?.map(m => m.woocommerce_product_id) || []);
    const mappedShopifyIds = new Set(mappings?.map(m => m.shopify_product_id) || []);

    // Find matches by normalized title
    const foundMatches: ProductMatch[] = [];

    for (const wooProduct of wooData.products) {
      // Skip already mapped products
      if (mappedWooIds.has(wooProduct.id)) continue;

      const normalizedWoo = normalizeTitle(wooProduct.name);
      
      const matchingShopify = shopifyData.products.find(
        sp => !mappedShopifyIds.has(sp.id) && normalizeTitle(sp.title) === normalizedWoo
      );
      
      if (matchingShopify) {
        foundMatches.push({
          woocommerce: wooProduct,
          shopify: matchingShopify,
          selected: true,
        });
      }
    }

    setMatches(foundMatches);
    setIsLoading(false);
  }, [open, wooData, shopifyData, mappings]);

  const toggleMatch = (index: number) => {
    setMatches(prev => 
      prev.map((m, i) => i === index ? { ...m, selected: !m.selected } : m)
    );
  };

  const toggleAll = () => {
    const allSelected = matches.every(m => m.selected);
    setMatches(prev => prev.map(m => ({ ...m, selected: !allSelected })));
  };

  const selectedCount = matches.filter(m => m.selected).length;

  const handleStartSync = () => {
    const selectedMatches = matches.filter(m => m.selected);
    if (selectedMatches.length > 0) {
      onStartSync(selectedMatches, copyOptions);
      onOpenChange(false);
    }
  };

  const isLoadingData = wooLoading || shopifyLoading || isLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Productos con Nombre Coincidente</DialogTitle>
        </DialogHeader>

        {isLoadingData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Buscando coincidencias...</span>
          </div>
        ) : matches.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No se encontraron productos con nombres coincidentes entre WooCommerce y Shopify.
          </div>
        ) : (
          <>
            <div className="flex items-center space-x-2 py-2 border-b">
              <Checkbox
                id="select-all"
                checked={matches.every(m => m.selected)}
                onCheckedChange={toggleAll}
              />
              <Label htmlFor="select-all" className="cursor-pointer">
                Seleccionar todos ({matches.length})
              </Label>
            </div>

            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-3">
                {matches.map((match, index) => (
                  <div
                    key={`${match.woocommerce.id}-${match.shopify.id}`}
                    className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <Checkbox
                      checked={match.selected}
                      onCheckedChange={() => toggleMatch(index)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{match.woocommerce.name}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        WooCommerce: ID {match.woocommerce.id} | Shopify: ID {match.shopify.id}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Package className="h-3 w-3" />
                        <span className="text-xs text-muted-foreground">
                          {match.shopify.variants?.length > 1 
                            ? `${match.shopify.variants.length} variantes`
                            : 'Simple'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="border-t pt-4">
              <Label className="text-sm font-medium mb-3 block">Opciones de Copia</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="copy-images"
                    checked={copyOptions.images}
                    onCheckedChange={(checked) => 
                      setCopyOptions(prev => ({ ...prev, images: checked as boolean }))
                    }
                  />
                  <Label htmlFor="copy-images" className="cursor-pointer">Imágenes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="copy-description"
                    checked={copyOptions.description}
                    onCheckedChange={(checked) => 
                      setCopyOptions(prev => ({ ...prev, description: checked as boolean }))
                    }
                  />
                  <Label htmlFor="copy-description" className="cursor-pointer">Descripción</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="copy-price"
                    checked={copyOptions.price}
                    onCheckedChange={(checked) => 
                      setCopyOptions(prev => ({ ...prev, price: checked as boolean }))
                    }
                  />
                  <Label htmlFor="copy-price" className="cursor-pointer">Precio</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="copy-variants"
                    checked={copyOptions.variants}
                    onCheckedChange={(checked) => 
                      setCopyOptions(prev => ({ ...prev, variants: checked as boolean }))
                    }
                  />
                  <Label htmlFor="copy-variants" className="cursor-pointer">Variantes</Label>
                </div>
              </div>
            </div>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleStartSync}
            disabled={isLoadingData || selectedCount === 0}
          >
            Sincronizar {selectedCount} producto{selectedCount !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
