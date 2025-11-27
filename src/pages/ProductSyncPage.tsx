import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShopifyConfigModal } from "@/components/forms/ShopifyConfigModal";
import { ProductMappingModal } from "@/components/forms/ProductMappingModal";
import { BulkTitleMatchModal } from "@/components/forms/BulkTitleMatchModal";
import { BulkSyncProgressModal, ProductSyncStatus } from "@/components/forms/BulkSyncProgressModal";
import { BackgroundSyncProgressModal } from "@/components/forms/BackgroundSyncProgressModal";
import { ProductList } from "@/components/sync/ProductList";
import { useShopifyConfig, useShopifyProductsPaginated } from "@/hooks/useShopifyProducts";
import { useWooCommerceProducts, useUpdateWooCommerceProduct, useBatchCreateWooCommerceVariations, useBatchDeleteWooCommerceVariations } from "@/hooks/useWooCommerceProducts";
import { useProductMappings, useCreateProductMapping } from "@/hooks/useProductMappings";
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
  const [backgroundSyncOpen, setBackgroundSyncOpen] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [activeJobs, setActiveJobs] = useState<any[]>([]);
  
  const queryClient = useQueryClient();
  const createMapping = useCreateProductMapping();
  const updateWooProduct = useUpdateWooCommerceProduct();
  const batchCreateVariations = useBatchCreateWooCommerceVariations();
  const batchDeleteVariations = useBatchDeleteWooCommerceVariations();
  
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

  // Fetch active jobs
  useEffect(() => {
    const fetchActiveJobs = async () => {
      const { data } = await supabase
        .from('sync_jobs')
        .select('*')
        .in('status', ['pending', 'processing'])
        .order('created_at', { ascending: false });
      
      if (data) {
        setActiveJobs(data);
      }
    };

    fetchActiveJobs();
    const interval = setInterval(fetchActiveJobs, 5000);
    return () => clearInterval(interval);
  }, []);

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
    try {
      // Create sync job
      const { data: user } = await supabase.auth.getUser();
      
      const { data: job, error: jobError } = await supabase
        .from('sync_jobs')
        .insert({
          status: 'pending',
          total_products: matches.length,
          copy_options: {
            copyImages: copyOptions.images,
            copyDescription: copyOptions.description,
            copyPrice: copyOptions.price,
            copyVariants: copyOptions.variants,
          },
          created_by: user.user?.id,
        })
        .select()
        .single();

      if (jobError || !job) {
        throw new Error('Failed to create sync job');
      }

      // Create sync job items
      const items = matches.map(match => ({
        job_id: job.id,
        woocommerce_product_id: match.woocommerce.id,
        woocommerce_product_name: match.woocommerce.name,
        shopify_product_id: match.shopify.id,
        shopify_product_name: match.shopify.title,
        status: 'pending',
      }));

      const { error: itemsError } = await supabase
        .from('sync_job_items')
        .insert(items);

      if (itemsError) {
        throw new Error('Failed to create sync job items');
      }

      // Start background sync
      const { error: functionError } = await supabase.functions.invoke('background-sync', {
        body: { job_id: job.id },
      });

      if (functionError) {
        throw new Error(`Failed to start background sync: ${functionError.message}`);
      }

      setCurrentJobId(job.id);
      setBackgroundSyncOpen(true);

      toast.success("Sincronización iniciada en segundo plano");
    } catch (error: any) {
      console.error('Error starting bulk sync:', error);
      toast.error(`Error al iniciar sincronización: ${error.message}`);
    }
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
        {/* Active jobs banner */}
        {activeJobs.length > 0 && (
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <RefreshCw className="h-5 w-5 animate-spin text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">
                    Hay {activeJobs.length} sincronización{activeJobs.length > 1 ? 'es' : ''} en progreso
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    Los procesos continúan en segundo plano aunque cierres el navegador
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCurrentJobId(activeJobs[0].id);
                  setBackgroundSyncOpen(true);
                }}
              >
                Ver progreso
              </Button>
            </div>
          </div>
        )}

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

      <BackgroundSyncProgressModal
        open={backgroundSyncOpen}
        onClose={() => setBackgroundSyncOpen(false)}
        jobId={currentJobId}
      />
    </MainLayout>
  );
}
