import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShopifyConfigModal } from "@/components/forms/ShopifyConfigModal";
import { ProductMappingModal } from "@/components/forms/ProductMappingModal";
import { ProductList } from "@/components/sync/ProductList";
import { useShopifyConfig, useShopifyProducts } from "@/hooks/useShopifyProducts";
import { useWooCommerceProducts } from "@/hooks/useWooCommerceProducts";
import { useProductMappings } from "@/hooks/useProductMappings";
import { Settings, RefreshCw, Link2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ProductSyncPage() {
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [selectedWooCommerceId, setSelectedWooCommerceId] = useState<number | undefined>();
  const [selectedShopifyId, setSelectedShopifyId] = useState<number | undefined>();
  
  // WooCommerce pagination and filters
  const [wooPage, setWooPage] = useState(1);
  const [wooStatus, setWooStatus] = useState("all");
  
  // Shopify pagination and filters
  const [shopifyPage, setShopifyPage] = useState(1);
  const [shopifyStatus, setShopifyStatus] = useState("all");

  const perPage = 20;

  const { data: shopifyConfig, isLoading: configLoading } = useShopifyConfig();
  const { data: shopifyProducts = [], isLoading: shopifyLoading } = useShopifyProducts(100);
  const { data: wooData, isLoading: wooLoading } = useWooCommerceProducts(
    1, 
    100, 
    undefined, 
    undefined, 
    wooStatus === "all" ? undefined : wooStatus
  );
  const { data: mappings = [] } = useProductMappings();

  const allWooProducts = wooData?.products || [];
  const allShopifyProducts = shopifyProducts || [];
  
  // Filter and paginate WooCommerce products
  const filteredWooProducts = allWooProducts.filter(p => {
    if (wooStatus === "all") return true;
    return p.status === wooStatus;
  });
  const wooTotalPages = Math.ceil(filteredWooProducts.length / perPage);
  const wooProducts = filteredWooProducts.slice((wooPage - 1) * perPage, wooPage * perPage);

  // Filter and paginate Shopify products
  const filteredShopifyProducts = allShopifyProducts.filter(p => {
    if (shopifyStatus === "all") return true;
    return p.status === shopifyStatus;
  });
  const shopifyTotalPages = Math.ceil(filteredShopifyProducts.length / perPage);
  const paginatedShopifyProducts = filteredShopifyProducts.slice((shopifyPage - 1) * perPage, shopifyPage * perPage);

  const mappedWooIds = new Set(mappings.map(m => m.woocommerce_product_id));
  const mappedShopifyIds = new Set(mappings.map(m => m.shopify_product_id));

  const selectedWooProduct = allWooProducts.find(p => p.id === selectedWooCommerceId);
  const selectedShopifyProduct = allShopifyProducts.find(p => p.id === selectedShopifyId);

  const handleAssociate = () => {
    if (selectedWooCommerceId && selectedShopifyId) {
      setShowMappingModal(true);
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
            <Button variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Sincronizar Todo
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
                  ({filteredWooProducts.length} productos)
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
              />
            </CardContent>
          </Card>

          {/* Shopify products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🛍️ Shopify
                <span className="text-sm font-normal text-muted-foreground">
                  ({filteredShopifyProducts.length} productos)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProductList
                products={paginatedShopifyProducts}
                type="shopify"
                selectedId={selectedShopifyId}
                mappedIds={mappedShopifyIds}
                onSelect={setSelectedShopifyId}
                loading={shopifyLoading}
                currentPage={shopifyPage}
                totalPages={shopifyTotalPages}
                onPageChange={setShopifyPage}
                statusFilter={shopifyStatus}
                onStatusFilterChange={setShopifyStatus}
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
    </MainLayout>
  );
}
