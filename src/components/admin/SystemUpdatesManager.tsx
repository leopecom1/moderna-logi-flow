import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Eye, 
  EyeOff,
  Sparkles,
  Wrench,
  Bug,
  Megaphone
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useSystemUpdates, SystemUpdate } from '@/hooks/useSystemUpdates';
import { CreateUpdateModal } from './CreateUpdateModal';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const typeConfig = {
  feature: {
    icon: Sparkles,
    label: 'Función',
    color: 'text-purple-500',
  },
  improvement: {
    icon: Wrench,
    label: 'Mejora',
    color: 'text-blue-500',
  },
  fix: {
    icon: Bug,
    label: 'Corrección',
    color: 'text-orange-500',
  },
  announcement: {
    icon: Megaphone,
    label: 'Anuncio',
    color: 'text-green-500',
  },
};

const priorityConfig = {
  low: { label: 'Baja', variant: 'secondary' as const },
  medium: { label: 'Media', variant: 'default' as const },
  high: { label: 'Alta', variant: 'destructive' as const },
};

export function SystemUpdatesManager() {
  const { updates, isLoading, deleteUpdate, toggleActive } = useSystemUpdates();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<SystemUpdate | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      await deleteUpdate.mutateAsync(deleteId);
      toast.success('Novedad eliminada');
      setDeleteId(null);
    } catch (error) {
      toast.error('Error al eliminar la novedad');
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      await toggleActive.mutateAsync({ id, is_active: !currentActive });
      toast.success(currentActive ? 'Novedad desactivada' : 'Novedad activada');
    } catch (error) {
      toast.error('Error al cambiar el estado');
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Gestión de Novedades
          </CardTitle>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Novedad
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Cargando novedades...
            </div>
          ) : updates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay novedades creadas. Crea la primera haciendo clic en "Nueva Novedad".
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Prioridad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {updates.map((update) => {
                  const TypeIcon = typeConfig[update.type].icon;
                  return (
                    <TableRow key={update.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {update.title}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <TypeIcon className={cn("h-4 w-4", typeConfig[update.type].color)} />
                          <span className="text-sm">{typeConfig[update.type].label}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={priorityConfig[update.priority].variant}>
                          {priorityConfig[update.priority].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={update.is_active ? 'default' : 'secondary'}>
                          {update.is_active ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(update.created_at), "d MMM yyyy", { locale: es })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleActive(update.id, update.is_active)}
                            title={update.is_active ? 'Desactivar' : 'Activar'}
                          >
                            {update.is_active ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingUpdate(update)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(update.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CreateUpdateModal
        open={showCreateModal || !!editingUpdate}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateModal(false);
            setEditingUpdate(null);
          }
        }}
        editingUpdate={editingUpdate}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar novedad?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La novedad será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
