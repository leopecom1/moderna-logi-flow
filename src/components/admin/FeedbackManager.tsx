import { useState } from 'react';
import { useFeedback, Feedback, FeedbackStatus, FeedbackPriority } from '@/hooks/useFeedback';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { 
  Lightbulb, 
  Bug, 
  HelpCircle, 
  MessageSquare,
  Check,
  Clock,
  XCircle,
  Loader2,
  Trash2,
  Eye,
  Search
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const typeConfig = {
  suggestion: { icon: Lightbulb, label: 'Sugerencia', color: 'bg-yellow-500/10 text-yellow-600' },
  bug: { icon: Bug, label: 'Bug', color: 'bg-red-500/10 text-red-600' },
  question: { icon: HelpCircle, label: 'Pregunta', color: 'bg-blue-500/10 text-blue-600' },
  other: { icon: MessageSquare, label: 'Otro', color: 'bg-gray-500/10 text-gray-600' },
};

const statusConfig = {
  pending: { icon: Clock, label: 'Pendiente', color: 'bg-yellow-500/10 text-yellow-600' },
  in_progress: { icon: Loader2, label: 'En progreso', color: 'bg-blue-500/10 text-blue-600' },
  completed: { icon: Check, label: 'Completado', color: 'bg-green-500/10 text-green-600' },
  rejected: { icon: XCircle, label: 'Rechazado', color: 'bg-red-500/10 text-red-600' },
};

const priorityConfig = {
  low: { label: 'Baja', color: 'bg-gray-500/10 text-gray-600' },
  medium: { label: 'Media', color: 'bg-yellow-500/10 text-yellow-600' },
  high: { label: 'Alta', color: 'bg-red-500/10 text-red-600' },
};

export const FeedbackManager = () => {
  const { feedbacks, isLoading, updateFeedback, deleteFeedback, pendingCount } = useFeedback();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Feedback | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [editStatus, setEditStatus] = useState<FeedbackStatus>('pending');
  const [editPriority, setEditPriority] = useState<FeedbackPriority>('medium');

  const filteredFeedbacks = feedbacks.filter(f => {
    const matchesSearch = f.title.toLowerCase().includes(search.toLowerCase()) ||
                         f.content.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || f.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openDetail = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setAdminNotes(feedback.admin_notes || '');
    setEditStatus(feedback.status);
    setEditPriority(feedback.priority);
  };

  const handleUpdate = async () => {
    if (!selectedFeedback) return;
    
    await updateFeedback.mutateAsync({
      id: selectedFeedback.id,
      status: editStatus,
      priority: editPriority,
      admin_notes: adminNotes || undefined,
      completed_by: editStatus === 'completed' ? user?.id : undefined,
    });
    
    setSelectedFeedback(null);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    await deleteFeedback.mutateAsync(deleteConfirm.id);
    setDeleteConfirm(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {pendingCount} pendientes
          </Badge>
          <Badge variant="outline">
            {feedbacks.length} total
          </Badge>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar feedback..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="in_progress">En progreso</SelectItem>
            <SelectItem value="completed">Completado</SelectItem>
            <SelectItem value="rejected">Rechazado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Prioridad</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="w-24">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFeedbacks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No hay feedbacks
                </TableCell>
              </TableRow>
            ) : (
              filteredFeedbacks.map((feedback) => {
                const TypeIcon = typeConfig[feedback.type]?.icon || MessageSquare;
                return (
                  <TableRow key={feedback.id}>
                    <TableCell>
                      <Badge variant="outline" className={typeConfig[feedback.type]?.color}>
                        <TypeIcon className="h-3 w-3 mr-1" />
                        {typeConfig[feedback.type]?.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium max-w-xs truncate">
                      {feedback.title}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusConfig[feedback.status]?.color}>
                        {statusConfig[feedback.status]?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={priorityConfig[feedback.priority]?.color}>
                        {priorityConfig[feedback.priority]?.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(feedback.created_at), "d MMM yyyy", { locale: es })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDetail(feedback)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteConfirm(feedback)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedFeedback} onOpenChange={(open) => !open && setSelectedFeedback(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedFeedback?.title}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-muted rounded-lg p-3">
              <p className="text-sm">{selectedFeedback?.content}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Estado</label>
                <Select value={editStatus} onValueChange={(v) => setEditStatus(v as FeedbackStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="in_progress">En progreso</SelectItem>
                    <SelectItem value="completed">Completado</SelectItem>
                    <SelectItem value="rejected">Rechazado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Prioridad</label>
                <Select value={editPriority} onValueChange={(v) => setEditPriority(v as FeedbackPriority)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baja</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Notas de respuesta</label>
              <Textarea
                placeholder="Agregar notas o respuesta..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedFeedback(null)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={updateFeedback.isPending}>
              {updateFeedback.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar feedback?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el feedback "{deleteConfirm?.title}".
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
    </div>
  );
};
