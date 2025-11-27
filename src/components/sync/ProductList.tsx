import { useState } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProductCard } from "./ProductCard";
import { WooCommerceProduct } from "@/types/woocommerce";
import { ShopifyProduct } from "@/types/shopify";
import { Search } from "lucide-react";

interface ProductListProps {
  products: (WooCommerceProduct | ShopifyProduct)[];
  type: 'woocommerce' | 'shopify';
  selectedId?: number;
  mappedIds?: Set<number>;
  onSelect?: (id: number) => void;
  loading?: boolean;
}

export function ProductList({
  products,
  type,
  selectedId,
  mappedIds = new Set(),
  onSelect,
  loading,
}: ProductListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProducts = products.filter(product => {
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
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre o SKU..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">
          Cargando productos...
        </div>
      ) : (
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-3">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No se encontraron productos
              </div>
            ) : (
              filteredProducts.map(product => {
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
                  />
                );
              })
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
