import { useState } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProductCard } from "./ProductCard";
import { WooCommerceProduct } from "@/types/woocommerce";
import { ShopifyProduct } from "@/types/shopify";
import { Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

interface ProductListProps {
  products: (WooCommerceProduct | ShopifyProduct)[];
  type: 'woocommerce' | 'shopify';
  selectedId?: number;
  mappedIds?: Set<number>;
  onSelect?: (id: number) => void;
  onCreateProduct?: (productId: number) => void;
  loading?: boolean;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  searchTerm?: string;
  onSearchChange?: (search: string) => void;
  hasNext?: boolean;
  hasPrev?: boolean;
  onNext?: () => void;
  onPrev?: () => void;
  useCursorPagination?: boolean;
}

export function ProductList({
  products,
  type,
  selectedId,
  mappedIds = new Set(),
  onSelect,
  onCreateProduct,
  loading,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  statusFilter,
  onStatusFilterChange,
  searchTerm: externalSearchTerm,
  onSearchChange,
  hasNext = false,
  hasPrev = false,
  onNext,
  onPrev,
  useCursorPagination = false,
}: ProductListProps) {
  const [internalSearchTerm, setInternalSearchTerm] = useState("");

  // Use external search if provided, otherwise use internal
  const searchTerm = externalSearchTerm !== undefined ? externalSearchTerm : internalSearchTerm;
  const setSearchTerm = onSearchChange || setInternalSearchTerm;

  // Only filter locally if not using server-side search
  const displayProducts = onSearchChange ? products : products.filter(product => {
    const name = type === 'woocommerce' 
      ? (product as WooCommerceProduct).name
      : (product as ShopifyProduct).title;
    const sku = type === 'woocommerce'
      ? (product as WooCommerceProduct).sku
      : (product as ShopifyProduct).variants[0]?.sku;
    
    const searchLower = searchTerm.toLowerCase();
    return name?.toLowerCase().includes(searchLower) || 
           sku?.toLowerCase().includes(searchLower);
  });

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger>
            <SelectValue placeholder="Estado del producto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los productos</SelectItem>
            <SelectItem value="publish">Solo activos</SelectItem>
            <SelectItem value="draft">Solo borradores</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">
          Cargando productos...
        </div>
      ) : (
        <>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-3">
              {displayProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No se encontraron productos
                </div>
              ) : (
                displayProducts.map(product => {
                  const id = type === 'woocommerce'
                    ? (product as WooCommerceProduct).id
                    : (product as ShopifyProduct).id;
                  
                  return (
                    <ProductCard
                      key={id}
                      product={product}
                      type={type}
                      selected={selectedId === id}
                      mapped={mappedIds.has(id)}
                      onSelect={onSelect ? () => onSelect(id) : undefined}
                      onCreateProduct={type === 'shopify' && onCreateProduct ? () => onCreateProduct(id) : undefined}
                    />
                  );
                })
              )}
            </div>
          </ScrollArea>

          {useCursorPagination ? (
            // Cursor-based pagination for Shopify
            (hasNext || hasPrev) && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={onPrev}
                      className={!hasPrev ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext 
                      onClick={onNext}
                      className={!hasNext ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )
          ) : (
            // Page-based pagination for WooCommerce
            totalPages > 1 && onPageChange && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          onClick={() => onPageChange(pageNum)}
                          isActive={currentPage === pageNum}
                          className="cursor-pointer"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )
          )}
        </>
      )}
    </div>
  );
}
