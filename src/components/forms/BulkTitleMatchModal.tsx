import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Package } from "lucide-react";
import { useProductMappings } from "@/hooks/useProductMappings";
import { supabase } from "@/integrations/supabase/client";

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
  const [loadingProgress, setLoadingProgress] = useState('');
  const [wooProductsCount, setWooProductsCount] = useState(0);
  const [shopifyProductsCount, setShopifyProductsCount] = useState(0);
  const [copyOptions, setCopyOptions] = useState<CopyOptions>({
    images: true,
    description: true,
    price: true,
    variants: true,
  });

  const { data: mappings } = useProductMappings();

  // Fetch ALL WooCommerce products with pagination
  const fetchAllWooCommerceProducts = async () => {
    const allProducts: any[] = [];
    let page = 1;
    const perPage = 100; // Maximum allowed by WooCommerce API
    
    while (true) {
      const { data, error } = await supabase.functions.invoke(
        `woocommerce-products/products`,
        { 
          body: { 
            params: new URLSearchParams({ 
              page: page.toString(), 
              per_page: perPage.toString() 
            }).toString() 
          } 
        }
      );
      
      if (error || !data?.products?.length) break;
      
      allProducts.push(...data.products);
      setWooProductsCount(allProducts.length);
      
      // If we received fewer products than the max, we've reached the last page
      if (data.products.length < perPage) break;
      
      page++;
    }
    
    return allProducts;
  };

  // Fetch ALL Shopify products with cursor-based pagination
  const fetchAllShopifyProducts = async () => {
    const allProducts: any[] = [];
    let cursor: string | null = null;
    const limit = 250; // Maximum allowed by Shopify API
    
    while (true) {
      const params = new URLSearchParams({ limit: limit.toString() });
      if (cursor) params.set('page_info', cursor);
      
      const { data, error } = await supabase.functions.invoke(
        `shopify-products?${params.toString()}`
      );
      
      if (error || !data?.products?.length) break;
      
      allProducts.push(...data.products);
      setShopifyProductsCount(allProducts.length);
      
      // Get cursor for next page
      cursor = data.pagination?.nextCursor || null;
      if (!cursor || !data.pagination?.hasNext) break;
    }
    
    return allProducts;
  };

  useEffect(() => {
    if (!open) return;
    
    const loadAllProductsAndMatch = async () => {
      setIsLoading(true);
      setMatches([]);
      setWooProductsCount(0);
      setShopifyProductsCount(0);

      try {
        // Step 1: Load WooCommerce products
        setLoadingProgress('Cargando productos de WooCommerce...');
        const wooProducts = await fetchAllWooCommerceProducts();
        
        // Step 2: Load Shopify products
        setLoadingProgress('Cargando productos de Shopify...');
        const shopifyProducts = await fetchAllShopifyProducts();
        
        // Step 3: Find matches
        setLoadingProgress('Buscando coincidencias por título...');
        
        // Get already mapped product IDs
        const mappedWooIds = new Set(mappings?.map(m => m.woocommerce_product_id) || []);
        const mappedShopifyIds = new Set(mappings?.map(m => m.shopify_product_id) || []);

        const foundMatches: ProductMatch[] = [];

        for (const wooProduct of wooProducts) {
          // Skip already mapped products
          if (mappedWooIds.has(wooProduct.id)) continue;

          const normalizedWoo = normalizeTitle(wooProduct.name);
          
          const matchingShopify = shopifyProducts.find(
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
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setIsLoading(false);
        setLoadingProgress('');
      }
    };
    
    loadAllProductsAndMatch();
  }, [open, mappings]);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Productos con Nombre Coincidente</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div className="text-center">
              <p className="font-medium">{loadingProgress}</p>
              {wooProductsCount > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  WooCommerce: {wooProductsCount} productos
                </p>
              )}
              {shopifyProductsCount > 0 && (
                <p className="text-sm text-muted-foreground">
                  Shopify: {shopifyProductsCount} productos
                </p>
              )}
            </div>
          </div>
        ) : matches.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <p className="mb-2">No se encontraron productos con nombres coincidentes.</p>
            <p className="text-xs">
              Se compararon {wooProductsCount} productos de WooCommerce y {shopifyProductsCount} de Shopify.
            </p>
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
            disabled={isLoading || selectedCount === 0}
          >
            Sincronizar {selectedCount} producto{selectedCount !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
