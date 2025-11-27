import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShopifyConfigModal } from "@/components/forms/ShopifyConfigModal";
import { ProductMappingModal } from "@/components/forms/ProductMappingModal";
import { BulkTitleMatchModal } from "@/components/forms/BulkTitleMatchModal";
import { BulkSyncProgressModal, ProductSyncStatus } from "@/components/forms/BulkSyncProgressModal";
import { ProductList } from "@/components/sync/ProductList";
import { useShopifyConfig, useShopifyProductsPaginated } from "@/hooks/useShopifyProducts";
import { useWooCommerceProducts } from "@/hooks/useWooCommerceProducts";
import { useProductMappings, useCreateProductMapping } from "@/hooks/useProductMappings";
import { useUpdateWooCommerceProduct, useBatchCreateWooCommerceVariations, useWooCommerceVariations, useDeleteWooCommerceVariation } from "@/hooks/useWooCommerceProducts";
import { useQueryClient } from "@tanstack/react-query";
import { Settings, RefreshCw, Link2, GitMerge } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Custom hook for debouncing
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function ProductSyncPage() {
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [showBulkMatchModal, setShowBulkMatchModal] = useState(false);
  const [showBulkProgressModal, setShowBulkProgressModal] = useState(false);
  const [selectedWooCommerceId, setSelectedWooCommerceId] = useState<number | undefined>();
  const [selectedShopifyId, setSelectedShopifyId] = useState<number | undefined>();
  const [isSyncing, setIsSyncing] = useState(false);
  const [bulkSyncProducts, setBulkSyncProducts] = useState<ProductSyncStatus[]>([]);
  const [currentSyncIndex, setCurrentSyncIndex] = useState(0);
  
  const queryClient = useQueryClient();
  const createMapping = useCreateProductMapping();
  const updateWooProduct = useUpdateWooCommerceProduct();
  const batchCreateVariations = useBatchCreateWooCommerceVariations();
  
  // WooCommerce pagination, filters, and search
  const [wooPage, setWooPage] = useState(1);
  const [wooStatus, setWooStatus] = useState("all");
  const [wooSearch, setWooSearch] = useState("");
  const debouncedWooSearch = useDebounce(wooSearch, 500);
  
  // Shopify cursor-based pagination, filters y búsqueda server-side
  const [shopifyCursor, setShopifyCursor] = useState<string | null>(null);
  const [shopifyStatus, setShopifyStatus] = useState("all");
  const [shopifySearch, setShopifySearch] = useState("");
  const debouncedShopifySearch = useDebounce(shopifySearch, 500);

  // Resetear cursor cuando cambian búsqueda o estado
  useEffect(() => {
    setShopifyCursor(null);
  }, [debouncedShopifySearch, shopifyStatus]);

  const wooPerPage = 20;
  const shopifyPerPage = 250;

  const { data: shopifyConfig, isLoading: configLoading } = useShopifyConfig();
  
  // WooCommerce with server-side pagination and search
  const { data: wooData, isLoading: wooLoading } = useWooCommerceProducts(
    wooPage, 
    wooPerPage, 
    debouncedWooSearch || undefined, 
    undefined, 
    wooStatus === "all" ? undefined : wooStatus
  );
  
  // Shopify with cursor-based pagination and server-side search (GraphQL)
  const { data: shopifyData, isLoading: shopifyLoading } = useShopifyProductsPaginated(
    shopifyPerPage,
    shopifyCursor,
    debouncedShopifySearch,
    shopifyStatus
  );
  
  const { data: mappings = [] } = useProductMappings();

  const wooProducts = wooData?.products || [];
  const wooTotal = wooData?.total || 0;
  const wooTotalPages = wooData?.totalPages || 1;
  
  const shopifyProducts = shopifyData?.products || [];
  const hasNextShopify = shopifyData?.hasNext || false;
  const hasPrevShopify = shopifyData?.hasPrev || false;

  const mappedWooIds = new Set(mappings.map(m => m.woocommerce_product_id));
  const mappedShopifyIds = new Set(mappings.map(m => m.shopify_product_id));

  const selectedWooProduct = wooProducts.find(p => p.id === selectedWooCommerceId);
  const selectedShopifyProduct = shopifyProducts.find(p => p.id === selectedShopifyId);

  const handleNextShopify = () => {
    if (shopifyData?.nextCursor) {
      setShopifyCursor(shopifyData.nextCursor);
    }
  };

  const handlePrevShopify = () => {
    if (shopifyData?.prevCursor) {
      setShopifyCursor(shopifyData.prevCursor);
    }
  };

  const handleAssociate = () => {
    if (selectedWooCommerceId && selectedShopifyId) {
      setShowMappingModal(true);
    }
  };

  const handleSyncAll = async () => {
    setIsSyncing(true);
    toast.info("Sincronizando productos...");
    
    try {
      // Invalidate both queries to force refetch
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["woocommerce-products"] }),
        queryClient.invalidateQueries({ queryKey: ["shopify-products-paginated"] }),
        queryClient.invalidateQueries({ queryKey: ["product-mappings"] }),
      ]);
      
      toast.success("¡Productos sincronizados correctamente!");
    } catch (error) {
      console.error("Error syncing products:", error);
      toast.error("Error al sincronizar productos");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleStartBulkSync = async (matches: any[], copyOptions: any) => {
    // Initialize product sync status
    const syncProducts: ProductSyncStatus[] = matches.map(match => ({
      wooId: match.woocommerce.id,
      shopifyId: match.shopify.id,
      name: match.woocommerce.name,
      status: 'pending' as const,
    }));

    setBulkSyncProducts(syncProducts);
    setCurrentSyncIndex(0);
    setShowBulkProgressModal(true);

    // Process each product sequentially
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      setCurrentSyncIndex(i);

      // Update status to syncing
      setBulkSyncProducts(prev => 
        prev.map((p, idx) => idx === i ? { ...p, status: 'syncing' as const } : p)
      );

      try {
        // 1. Create mapping
        await createMapping.mutateAsync({
          woocommerce_product_id: match.woocommerce.id,
          shopify_product_id: match.shopify.id,
          woocommerce_product_name: match.woocommerce.name,
          shopify_product_name: match.shopify.title,
        });

        // 2. Save to sync history
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('product_sync_history').insert({
          woocommerce_product_id: match.woocommerce.id,
          woocommerce_product_name: match.woocommerce.name,
          shopify_product_id: Number(match.shopify.id),
          shopify_product_name: match.shopify.title,
          synced_by: user?.id,
        });

        // 3. Build update data based on copy options
        const updateData: any = {};
        
        if (copyOptions.description && match.shopify.body_html) {
          updateData.description = match.shopify.body_html;
        }

        if (copyOptions.images && match.shopify.images?.length > 0) {
          updateData.images = match.shopify.images.map((img: any) => ({
            src: img.src,
            alt: img.alt || match.shopify.title,
          }));
        }

        // 3. Handle variants or simple product
        const hasVariants = match.shopify.variants?.length > 1;

        if (copyOptions.variants && hasVariants) {
          // Variable product
          const attributes = match.shopify.options
            ?.filter((opt: any) => opt.values && opt.values.length > 0)
            .map((opt: any) => ({
              name: opt.name,
              options: opt.values,
              visible: true,
              variation: true,
            })) || [];

          updateData.type = 'variable';
          updateData.attributes = attributes;

          await updateWooProduct.mutateAsync({
            id: match.woocommerce.id,
            data: updateData,
          });

          // Delete existing variations
          const { data: existingVariations } = await queryClient.fetchQuery({
            queryKey: ['woocommerce-variations', match.woocommerce.id],
            queryFn: async () => {
              const endpoint = encodeURIComponent(`products/${match.woocommerce.id}/variations?per_page=100`);
              const response = await fetch(
                `https://ndusxjrjrjpauuqeruzg.supabase.co/functions/v1/woocommerce-products?endpoint=${endpoint}`,
                { headers: { Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kdXN4anJqcmpwYXV1cWVydXpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1MjUwODIsImV4cCI6MjA2ODEwMTA4Mn0.pfb6tHB0ekR-K4x1j5bj41Q13opC7YGGQt8LJ-GKTPk` } }
              );
              return response.json();
            },
          });

          if (existingVariations && Array.isArray(existingVariations)) {
            for (const variant of existingVariations) {
              const deleteEndpoint = encodeURIComponent(`products/${match.woocommerce.id}/variations/${variant.id}`);
              await fetch(
                `https://ndusxjrjrjpauuqeruzg.supabase.co/functions/v1/woocommerce-products?endpoint=${deleteEndpoint}&method=DELETE`,
                { method: 'POST', headers: { Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kdXN4anJqcmpwYXV1cWVydXpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1MjUwODIsImV4cCI6MjA2ODEwMTA4Mn0.pfb6tHB0ekR-K4x1j5bj41Q13opC7YGGQt8LJ-GKTPk` } }
              );
            }
          }

          // Create new variations
          const variationsToCreate = match.shopify.variants.map((variant: any) => {
            const attributes = match.shopify.options
              ?.filter((opt: any) => opt.position <= 3)
              .map((opt: any, idx: number) => ({
                name: opt.name,
                option: variant[`option${idx + 1}`] || '',
              }))
              .filter((attr: any) => attr.option) || [];

            const hasDiscount = variant.compare_at_price && parseFloat(variant.compare_at_price) > parseFloat(variant.price);
            const isInStock = (variant.inventory_quantity ?? 0) > 0;

            const variationData: any = {
              regular_price: hasDiscount ? variant.compare_at_price! : variant.price,
              attributes,
            };

            if (isInStock) {
              variationData.manage_stock = false;
              variationData.stock_status = 'instock';
            } else {
              variationData.manage_stock = true;
              variationData.stock_quantity = 0;
              variationData.stock_status = 'outofstock';
            }

            if (hasDiscount) {
              variationData.sale_price = variant.price;
            }

            if (variant.sku) {
              variationData.sku = variant.sku;
            }

            return variationData;
          });

          await batchCreateVariations.mutateAsync({
            productId: match.woocommerce.id,
            variations: variationsToCreate,
          });
        } else {
          // Simple product
          if (copyOptions.price && match.shopify.variants?.[0]) {
            const variant = match.shopify.variants[0];
            const hasDiscount = variant.compare_at_price && parseFloat(variant.compare_at_price) > parseFloat(variant.price);
            
            updateData.regular_price = hasDiscount ? variant.compare_at_price : variant.price;
            if (hasDiscount) {
              updateData.sale_price = variant.price;
            }
            if (variant.sku) {
              updateData.sku = variant.sku;
            }

            const isInStock = (variant.inventory_quantity ?? 0) > 0;
            if (isInStock) {
              updateData.manage_stock = false;
              updateData.stock_status = 'instock';
            } else {
              updateData.manage_stock = true;
              updateData.stock_quantity = 0;
              updateData.stock_status = 'outofstock';
            }
          }

          await updateWooProduct.mutateAsync({
            id: match.woocommerce.id,
            data: updateData,
          });
        }

        // Mark as completed
        setBulkSyncProducts(prev => 
          prev.map((p, idx) => idx === i ? { ...p, status: 'completed' as const } : p)
        );
      } catch (error) {
        console.error(`Error syncing product ${match.woocommerce.name}:`, error);
        setBulkSyncProducts(prev => 
          prev.map((p, idx) => 
            idx === i ? { 
              ...p, 
              status: 'error' as const, 
              error: error instanceof Error ? error.message : 'Error desconocido' 
            } : p
          )
        );
      }
    }

    // Invalidate queries after all products are processed
    await queryClient.invalidateQueries({ queryKey: ["product-mappings"] });
    await queryClient.invalidateQueries({ queryKey: ["woocommerce-products"] });
    
    toast.success(`Sincronización completada: ${matches.length} productos procesados`);
  };

  if (configLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">
          <p>Cargando configuración...</p>
        </div>
      </MainLayout>
    );
  }

  if (!shopifyConfig) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto py-12">
          <Card>
            <CardHeader>
              <CardTitle>🔄 Sincronización de Productos</CardTitle>
              <CardDescription>
                Conecta Shopify para sincronizar productos entre ambas plataformas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <AlertDescription>
                  Para comenzar, necesitas configurar la conexión con tu tienda Shopify
                </AlertDescription>
              </Alert>
              <Button onClick={() => setShowConfigModal(true)}>
                <Settings className="mr-2 h-4 w-4" />
                Configurar Shopify
              </Button>
            </CardContent>
          </Card>
        </div>

        <ShopifyConfigModal
          open={showConfigModal}
          onOpenChange={setShowConfigModal}
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">🔄 Sincronización de Productos</h1>
            <p className="text-muted-foreground">
              Conecta y sincroniza productos entre WooCommerce y Shopify
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowConfigModal(true)}>
              <Settings className="mr-2 h-4 w-4" />
              Config Shopify
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowBulkMatchModal(true)}
            >
              <GitMerge className="mr-2 h-4 w-4" />
              Asociar por Título
            </Button>
            <Button 
              variant="outline" 
              onClick={handleSyncAll}
              disabled={isSyncing}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? "Sincronizando..." : "Sincronizar Todo"}
            </Button>
          </div>
        </div>

        {/* Association button */}
        {selectedWooCommerceId && selectedShopifyId && (
          <Alert className="bg-primary/10 border-primary">
            <Link2 className="h-4 w-4" />
            <AlertDescription>
              Productos seleccionados. 
              <Button 
                size="sm" 
                className="ml-2"
                onClick={handleAssociate}
              >
                🔗 Asociar y Copiar
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Product lists */}
        <div className="grid grid-cols-2 gap-6">
          {/* WooCommerce products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🛒 WooCommerce
                <span className="text-sm font-normal text-muted-foreground">
                  ({wooTotal} productos)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProductList
                products={wooProducts}
                type="woocommerce"
                selectedId={selectedWooCommerceId}
                mappedIds={mappedWooIds}
                onSelect={setSelectedWooCommerceId}
                loading={wooLoading}
                currentPage={wooPage}
                totalPages={wooTotalPages}
                onPageChange={setWooPage}
                statusFilter={wooStatus}
                onStatusFilterChange={setWooStatus}
                searchTerm={wooSearch}
                onSearchChange={setWooSearch}
              />
            </CardContent>
          </Card>

          {/* Shopify products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🛍️ Shopify
                <span className="text-sm font-normal text-muted-foreground">
                  ({shopifyProducts.length} productos
                  {debouncedShopifySearch && ` - Buscando: "${debouncedShopifySearch}"`})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProductList
                products={shopifyProducts}
                type="shopify"
                selectedId={selectedShopifyId}
                mappedIds={mappedShopifyIds}
                onSelect={setSelectedShopifyId}
                loading={shopifyLoading}
                statusFilter={shopifyStatus}
                onStatusFilterChange={setShopifyStatus}
                searchTerm={shopifySearch}
                onSearchChange={setShopifySearch}
                useCursorPagination={true}
                hasNext={hasNextShopify}
                hasPrev={hasPrevShopify}
                onNext={handleNextShopify}
                onPrev={handlePrevShopify}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <ShopifyConfigModal
        open={showConfigModal}
        onOpenChange={setShowConfigModal}
      />

      <ProductMappingModal
        open={showMappingModal}
        onOpenChange={setShowMappingModal}
        woocommerceProduct={selectedWooProduct || null}
        shopifyProduct={selectedShopifyProduct || null}
      />

      <BulkTitleMatchModal
        open={showBulkMatchModal}
        onOpenChange={setShowBulkMatchModal}
        onStartSync={handleStartBulkSync}
      />

      <BulkSyncProgressModal
        open={showBulkProgressModal}
        products={bulkSyncProducts}
        currentIndex={currentSyncIndex}
      />
    </MainLayout>
  );
}
