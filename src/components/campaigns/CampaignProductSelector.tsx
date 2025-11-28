import React, { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { WooCommerceProduct } from '@/types/woocommerce';
import { useWooCommerceProducts } from '@/hooks/useWooCommerceProducts';
import { Search, ChevronLeft, ChevronRight, Loader2, CheckSquare, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { callWooCommerceAPI } from '@/hooks/useWooCommerceProducts';

interface CampaignProductSelectorProps {
  selectedProducts: WooCommerceProduct[];
  onSelectionChange: (products: WooCommerceProduct[]) => void;
}

export function CampaignProductSelector({ selectedProducts, onSelectionChange }: CampaignProductSelectorProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectAll, setSelectAll] = useState(false);
  const [loadingAllProducts, setLoadingAllProducts] = useState(false);
  const [loadProgress, setLoadProgress] = useState({ current: 0, total: 0 });
  
  const { data: productsData, isLoading } = useWooCommerceProducts(page, 20, search);

  const handleToggleProduct = (product: WooCommerceProduct) => {
    const isSelected = selectedProducts.some(p => p.id === product.id);
    if (isSelected) {
      onSelectionChange(selectedProducts.filter(p => p.id !== product.id));
    } else {
      onSelectionChange([...selectedProducts, product]);
    }
  };

  const handleSelectAll = () => {
    if (!productsData?.products) return;
    
    if (selectAll) {
      // Deseleccionar todos de la página actual
      const currentPageIds = productsData.products.map(p => p.id);
      onSelectionChange(selectedProducts.filter(p => !currentPageIds.includes(p.id)));
    } else {
      // Seleccionar todos de la página actual
      const newProducts = productsData.products.filter(
        p => !selectedProducts.some(sp => sp.id === p.id)
      );
      onSelectionChange([...selectedProducts, ...newProducts]);
    }
    setSelectAll(!selectAll);
  };

  const isProductSelected = (productId: number) => {
    return selectedProducts.some(p => p.id === productId);
  };

  const handleSelectAllActive = async () => {
    setLoadingAllProducts(true);
    try {
      // Primera llamada para obtener el total de páginas
      const firstPageData = await callWooCommerceAPI('/products', 'GET', null, { 
        per_page: 100, 
        status: 'publish',
        page: 1 
      });
      
      const totalPages = firstPageData.totalPages || 1;
      let allProducts: WooCommerceProduct[] = firstPageData.products || [];
      
      setLoadProgress({ current: 1, total: totalPages });
      
      // Cargar las páginas restantes
      for (let currentPage = 2; currentPage <= totalPages; currentPage++) {
        const pageData = await callWooCommerceAPI('/products', 'GET', null, { 
          per_page: 100, 
          status: 'publish',
          page: currentPage 
        });
        allProducts = [...allProducts, ...(pageData.products || [])];
        setLoadProgress({ current: currentPage, total: totalPages });
      }
      
      onSelectionChange(allProducts);
    } catch (error) {
      console.error('Error loading all active products:', error);
    } finally {
      setLoadingAllProducts(false);
      setLoadProgress({ current: 0, total: 0 });
    }
  };

  const handleClearSelection = () => {
    onSelectionChange([]);
    setSelectAll(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar productos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="select-all"
            checked={selectAll}
            onCheckedChange={handleSelectAll}
          />
          <Label htmlFor="select-all" className="cursor-pointer whitespace-nowrap">
            Todos en página
          </Label>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="text-sm text-muted-foreground">
          {selectedProducts.length} producto(s) seleccionado(s)
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAllActive}
            disabled={loadingAllProducts}
          >
            {loadingAllProducts ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Cargando... ({loadProgress.current}/{loadProgress.total})
              </>
            ) : (
              <>
                <CheckSquare className="h-4 w-4 mr-2" />
                Seleccionar todos los activos
              </>
            )}
          </Button>
          
          {selectedProducts.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearSelection}
            >
              <X className="h-4 w-4 mr-2" />
              Limpiar
            </Button>
          )}
        </div>
      </div>

      <div className="border rounded-lg max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-10 w-10 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : productsData?.products && productsData.products.length > 0 ? (
          <div className="divide-y">
            {productsData.products.map((product) => (
              <label
                key={product.id}
                className="flex items-center gap-3 p-3 hover:bg-muted cursor-pointer"
              >
                <Checkbox
                  checked={isProductSelected(product.id)}
                  onCheckedChange={() => handleToggleProduct(product)}
                />
                {product.images?.[0] && (
                  <img
                    src={product.images[0].src}
                    alt={product.name}
                    className="w-10 h-10 object-cover rounded"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{product.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {product.type === 'variable' ? 'Variable' : 'Simple'} • ${product.price || product.regular_price}
                  </p>
                </div>
              </label>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            No se encontraron productos
          </div>
        )}
      </div>

      {productsData && productsData.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {page} de {productsData.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => p + 1)}
            disabled={page >= productsData.totalPages}
          >
            Siguiente
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
