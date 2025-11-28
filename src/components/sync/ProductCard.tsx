import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WooCommerceProduct } from "@/types/woocommerce";
import { ShopifyProduct } from "@/types/shopify";
import { Check, Plus } from "lucide-react";

interface ProductCardProps {
  product: WooCommerceProduct | ShopifyProduct;
  type: 'woocommerce' | 'shopify';
  selected?: boolean;
  mapped?: boolean;
  onSelect?: () => void;
  onCreateProduct?: () => void;
}

export function ProductCard({ product, type, selected, mapped, onSelect, onCreateProduct }: ProductCardProps) {
  const isWooCommerce = type === 'woocommerce';
  const wcProduct = isWooCommerce ? product as WooCommerceProduct : null;
  const shopifyProduct = !isWooCommerce ? product as ShopifyProduct : null;

  const name = isWooCommerce ? wcProduct?.name : shopifyProduct?.title;
  const price = isWooCommerce ? wcProduct?.price : shopifyProduct?.variants[0]?.price;
  const sku = isWooCommerce ? wcProduct?.sku : shopifyProduct?.variants[0]?.sku;
  
  // Handle images with fallback for both WooCommerce and Shopify
  const imageUrl = isWooCommerce 
    ? (wcProduct?.images && wcProduct.images.length > 0 ? wcProduct.images[0].src : null)
    : (shopifyProduct?.images && shopifyProduct.images.length > 0 ? shopifyProduct.images[0].src : null);

  return (
    <Card className={`relative cursor-pointer transition-all hover:shadow-md ${selected ? 'ring-2 ring-primary' : ''}`}>
      <CardContent className="p-4">
        <div className="flex gap-3">
          {imageUrl && (
            <img
              src={imageUrl}
              alt={name}
              className="w-16 h-16 object-cover rounded"
            />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate">{name}</h3>
            {sku && <p className="text-sm text-muted-foreground">SKU: {sku}</p>}
            <p className="text-sm font-semibold mt-1">${price}</p>
            {mapped && (
              <Badge variant="outline" className="mt-2 bg-green-50 border-green-200 text-green-800">
                ✅ Mapeado
              </Badge>
            )}
          </div>
          <div className="flex flex-col gap-2">
            {onSelect && (
              <Button
                size="sm"
                variant={selected ? "default" : "outline"}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect();
                }}
                disabled={mapped}
              >
                {selected ? <Check className="h-4 w-4" /> : "Seleccionar"}
              </Button>
            )}
            
            {type === 'shopify' && onCreateProduct && !mapped && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateProduct();
                }}
                className="text-green-600 border-green-600 hover:bg-green-50"
              >
                <Plus className="h-4 w-4 mr-1" />
                Crear
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
