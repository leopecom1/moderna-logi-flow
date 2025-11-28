import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Eye, RotateCcw } from 'lucide-react';
import { EcommerceCampaign, useDeleteCampaign } from '@/hooks/useEcommerceCampaigns';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CampaignsListProps {
  campaigns: EcommerceCampaign[];
  onViewCampaign: (campaign: EcommerceCampaign) => void;
  onRevertCampaign: (campaign: EcommerceCampaign) => void;
}

export function CampaignsList({ campaigns, onViewCampaign, onRevertCampaign }: CampaignsListProps) {
  const [campaignToDelete, setCampaignToDelete] = useState<string | null>(null);
  const deleteCampaign = useDeleteCampaign();

  const getStatusBadge = (status: EcommerceCampaign['status']) => {
    const variants: Record<typeof status, { variant: "default" | "secondary" | "outline" | "destructive"; label: string }> = {
      draft: { variant: 'secondary', label: 'Borrador' },
      active: { variant: 'default', label: 'Activa' },
      completed: { variant: 'outline', label: 'Completada' },
      cancelled: { variant: 'destructive', label: 'Cancelada' },
      reverted: { variant: 'outline', label: 'Revertida' },
    };
    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleDelete = (id: string) => {
    deleteCampaign.mutate(id, {
      onSuccess: () => setCampaignToDelete(null),
    });
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">% Aumento</TableHead>
              <TableHead className="text-right">Productos</TableHead>
              <TableHead>Fecha Creación</TableHead>
              <TableHead>Fecha Aplicación</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No hay campañas creadas. Haz clic en "Nueva Campaña" para comenzar.
                </TableCell>
              </TableRow>
            ) : (
              campaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                  <TableCell className="text-right">{campaign.markup_percentage}%</TableCell>
                  <TableCell className="text-right">{campaign.products_count}</TableCell>
                  <TableCell>
                    {format(new Date(campaign.created_at), 'dd MMM yyyy', { locale: es })}
                  </TableCell>
                  <TableCell>
                    {campaign.applied_at
                      ? format(new Date(campaign.applied_at), 'dd MMM yyyy HH:mm', { locale: es })
                      : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onViewCampaign(campaign)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {campaign.status === 'active' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onRevertCampaign(campaign)}
                          title="Revertir campaña"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                      {campaign.status === 'draft' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setCampaignToDelete(campaign.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!campaignToDelete} onOpenChange={(open) => !open && setCampaignToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar campaña?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La campaña y todos sus productos asociados serán eliminados permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => campaignToDelete && handleDelete(campaignToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
