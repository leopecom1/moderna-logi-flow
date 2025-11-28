import React, { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { WooCommerceProduct } from '@/types/woocommerce';
import { useWooCommerceProducts } from '@/hooks/useWooCommerceProducts';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface CampaignProductSelectorProps {
  selectedProducts: WooCommerceProduct[];
  onSelectionChange: (products: WooCommerceProduct[]) => void;
}

export function CampaignProductSelector({ selectedProducts, onSelectionChange }: CampaignProductSelectorProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectAll, setSelectAll] = useState(false);
  
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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
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
          <Label htmlFor="select-all" className="cursor-pointer">
            Todos en página
          </Label>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        {selectedProducts.length} producto(s) seleccionado(s)
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
