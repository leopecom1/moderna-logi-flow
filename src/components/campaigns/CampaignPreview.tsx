import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { WooCommerceProduct } from '@/types/woocommerce';
import { Badge } from '@/components/ui/badge';

interface CampaignPreviewProps {
  products: WooCommerceProduct[];
  markupPercentage: number;
}

export function CampaignPreview({ products, markupPercentage }: CampaignPreviewProps) {
  const calculatePrices = (product: WooCommerceProduct) => {
    const currentPrice = parseFloat(product.price || product.regular_price);
    const newRegularPrice = currentPrice * (1 + markupPercentage / 100);
    const discount = Math.round((1 - currentPrice / newRegularPrice) * 100);

    return {
      currentPrice,
      newRegularPrice: Math.round(newRegularPrice * 100) / 100,
      discount,
    };
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-muted rounded-lg">
        <p className="text-sm font-medium mb-2">Resumen de la Campaña</p>
        <ul className="text-sm space-y-1">
          <li>• Total de productos: {products.length}</li>
          <li>• Porcentaje de aumento: {markupPercentage}%</li>
          <li>• Los precios actuales se convertirán en precios de oferta</li>
          <li>• Los precios regulares se calcularán automáticamente</li>
        </ul>
      </div>

      <div className="border rounded-lg max-h-96 overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Precio Actual</TableHead>
              <TableHead className="text-right">Nuevo Regular</TableHead>
              <TableHead className="text-right">Nuevo Oferta</TableHead>
              <TableHead className="text-right">Descuento</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => {
              const { currentPrice, newRegularPrice, discount } = calculatePrices(product);
              return (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {product.images?.[0] && (
                        <img
                          src={product.images[0].src}
                          alt={product.name}
                          className="w-8 h-8 object-cover rounded"
                        />
                      )}
                      <span className="font-medium truncate max-w-xs">{product.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {product.type === 'variable' ? 'Variable' : 'Simple'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">${currentPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-medium">${newRegularPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right text-primary">${currentPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="default">{discount}% OFF</Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
