import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Calendar, Percent, Package } from 'lucide-react';
import { useEcommerceCampaign, useCampaignProducts } from '@/hooks/useEcommerceCampaigns';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ViewCampaignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string | null;
}

export function ViewCampaignModal({ open, onOpenChange, campaignId }: ViewCampaignModalProps) {
  const { data: campaign, isLoading: loadingCampaign } = useEcommerceCampaign(campaignId);
  const { data: products, isLoading: loadingProducts } = useCampaignProducts(campaignId);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Borrador', variant: 'outline' as const },
      active: { label: 'Activa', variant: 'default' as const },
      completed: { label: 'Completada', variant: 'secondary' as const },
      cancelled: { label: 'Cancelada', variant: 'destructive' as const },
      reverted: { label: 'Revertida', variant: 'outline' as const },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getProductStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pendiente', className: 'bg-gray-500' },
      applied: { label: 'Aplicado', className: 'bg-green-500' },
      error: { label: 'Error', className: 'bg-red-500' },
      reverted: { label: 'Revertido', className: 'bg-blue-500' },
      skipped: { label: 'Omitido', className: 'bg-yellow-500' },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  if (loadingCampaign || loadingProducts) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!campaign) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">{campaign.name}</DialogTitle>
            {getStatusBadge(campaign.status)}
          </div>
          {campaign.description && (
            <p className="text-muted-foreground text-sm mt-2">{campaign.description}</p>
          )}
        </DialogHeader>

        {/* Campaign Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Percent className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{campaign.markup_percentage}%</p>
                  <p className="text-xs text-muted-foreground">Porcentaje de aumento</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{campaign.products_count || 0}</p>
                  <p className="text-xs text-muted-foreground">Productos en campaña</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {campaign.applied_at 
                      ? format(new Date(campaign.applied_at), 'dd MMM yyyy', { locale: es })
                      : 'No aplicada'
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {campaign.applied_at ? 'Fecha de aplicación' : 'Estado'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Products Table */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Productos de la Campaña</h3>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Precio Original</TableHead>
                  <TableHead className="text-right">Nuevo Regular</TableHead>
                  <TableHead className="text-right">Nuevo Oferta</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products && products.length > 0 ? (
                  products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {product.product_name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {product.product_type === 'simple' ? 'Simple' : 'Variable'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        ${product.original_sale_price?.toLocaleString() || product.original_regular_price?.toLocaleString() || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        ${product.new_regular_price?.toLocaleString() || '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        ${product.new_sale_price?.toLocaleString() || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {getProductStatusBadge(product.status)}
                          {product.error_message && (
                            <p className="text-xs text-destructive mt-1">
                              {product.error_message}
                            </p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No hay productos en esta campaña
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
