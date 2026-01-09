import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { useFeedback, FeedbackType, FeedbackStatus, Feedback } from '@/hooks/useFeedback';
import { useAuth } from '@/hooks/useAuth';
import { 
  Lightbulb, 
  Bug, 
  HelpCircle, 
  MessageSquare,
  Plus,
  X,
  Check,
  Clock,
  XCircle,
  Loader2,
  User,
  CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface FeedbackPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const typeConfig: Record<FeedbackType, { icon: React.ElementType; label: string; color: string }> = {
  suggestion: { icon: Lightbulb, label: 'Sugerencia', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
  bug: { icon: Bug, label: 'Bug', color: 'bg-red-500/10 text-red-600 border-red-500/20' },
  question: { icon: HelpCircle, label: 'Pregunta', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  other: { icon: MessageSquare, label: 'Otro', color: 'bg-gray-500/10 text-gray-600 border-gray-500/20' },
};

const statusConfig: Record<FeedbackStatus, { icon: React.ElementType; label: string; color: string }> = {
  pending: { icon: Clock, label: 'Pendiente', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
  in_progress: { icon: Loader2, label: 'En progreso', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  completed: { icon: Check, label: 'Completado', color: 'bg-green-500/10 text-green-600 border-green-500/20' },
  rejected: { icon: XCircle, label: 'Rechazado', color: 'bg-red-500/10 text-red-600 border-red-500/20' },
};

export const FeedbackPanel = ({ open, onOpenChange }: FeedbackPanelProps) => {
  const { feedbacks, isLoading, createFeedback, updateFeedback } = useFeedback();
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === 'gerencia';

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<FeedbackType>('suggestion');

  // Detail modal state
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [editStatus, setEditStatus] = useState<FeedbackStatus>('pending');
  const [adminNotes, setAdminNotes] = useState('');

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return;
    
    await createFeedback.mutateAsync({ title, content, type });
    setTitle('');
    setContent('');
    setType('suggestion');
    setShowForm(false);
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setType('suggestion');
    setShowForm(false);
  };

  const openDetail = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setEditStatus(feedback.status);
    setAdminNotes(feedback.admin_notes || '');
  };

  const closeDetail = () => {
    setSelectedFeedback(null);
    setEditStatus('pending');
    setAdminNotes('');
  };

  const handleUpdate = async () => {
    if (!selectedFeedback) return;
    await updateFeedback.mutateAsync({
      id: selectedFeedback.id,
      status: editStatus,
      admin_notes: adminNotes || undefined,
      completed_by: editStatus === 'completed' ? user?.id : undefined,
    });
    closeDetail();
  };

  const handleMarkResolved = async () => {
    if (!selectedFeedback) return;
    await updateFeedback.mutateAsync({
      id: selectedFeedback.id,
      status: 'completed',
      admin_notes: adminNotes || undefined,
      completed_by: user?.id,
    });
    closeDetail();
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-md flex flex-col">
          <SheetHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <SheetTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Feedback
            </SheetTitle>
            {!showForm && (
              <Button size="sm" onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Nuevo
              </Button>
            )}
          </SheetHeader>

          {showForm && (
            <div className="border rounded-lg p-4 space-y-3 bg-muted/50">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Nuevo Feedback</span>
                <Button variant="ghost" size="sm" onClick={resetForm}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <Input
                placeholder="Título"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              
              <Textarea
                placeholder="Describe tu feedback..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={3}
              />
              
              <Select value={type} onValueChange={(v) => setType(v as FeedbackType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(typeConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <config.icon className="h-4 w-4" />
                        {config.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button 
                className="w-full" 
                onClick={handleSubmit}
                disabled={!title.trim() || !content.trim() || createFeedback.isPending}
              >
                {createFeedback.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Enviar Feedback
              </Button>
            </div>
          )}

          <ScrollArea className="flex-1 -mx-6 px-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : feedbacks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>¡Sé el primero en enviar feedback!</p>
              </div>
            ) : (
              <div className="space-y-3 py-4">
                {feedbacks.map((feedback) => {
                  const TypeIcon = typeConfig[feedback.type]?.icon || MessageSquare;
                  const StatusIcon = statusConfig[feedback.status]?.icon || Clock;
                  const isMyFeedback = feedback.created_by === user?.id;

                  return (
                    <div
                      key={feedback.id}
                      className="border rounded-lg p-3 space-y-2 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => openDetail(feedback)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <TypeIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm">{feedback.title}</span>
                        </div>
                        {isMyFeedback && (
                          <Badge variant="outline" className="text-xs">
                            <User className="h-3 w-3 mr-1" />
                            Mío
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {feedback.content}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={typeConfig[feedback.type]?.color}>
                            {typeConfig[feedback.type]?.label}
                          </Badge>
                          <Badge variant="outline" className={statusConfig[feedback.status]?.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig[feedback.status]?.label}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(feedback.created_at), "d MMM", { locale: es })}
                        </span>
                      </div>

                      {feedback.admin_notes && (
                        <div className="bg-muted rounded p-2 text-xs">
                          <span className="font-medium">Respuesta: </span>
                          {feedback.admin_notes}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Detail Modal */}
      <Dialog open={!!selectedFeedback} onOpenChange={(open) => !open && closeDetail()}>
        <DialogContent className="sm:max-w-lg">
          {selectedFeedback && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {(() => {
                    const TypeIcon = typeConfig[selectedFeedback.type]?.icon || MessageSquare;
                    return <TypeIcon className="h-5 w-5" />;
                  })()}
                  {selectedFeedback.title}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className={typeConfig[selectedFeedback.type]?.color}>
                    {typeConfig[selectedFeedback.type]?.label}
                  </Badge>
                  <Badge variant="outline" className={statusConfig[selectedFeedback.status]?.color}>
                    {statusConfig[selectedFeedback.status]?.label}
                  </Badge>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {format(new Date(selectedFeedback.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                  </span>
                </div>

                {/* Content */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Contenido</Label>
                  <div className="text-sm bg-muted/50 rounded-lg p-3 whitespace-pre-wrap">
                    {selectedFeedback.content}
                  </div>
                </div>

                {/* Admin section */}
                {isAdmin ? (
                  <>
                    <div className="space-y-2">
                      <Label>Estado</Label>
                      <Select value={editStatus} onValueChange={(v) => setEditStatus(v as FeedbackStatus)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusConfig).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                <config.icon className="h-4 w-4" />
                                {config.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Notas / Respuesta</Label>
                      <Textarea
                        placeholder="Agrega comentarios o respuesta..."
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        rows={3}
                      />
                    </div>
                  </>
                ) : (
                  selectedFeedback.admin_notes && (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Respuesta del equipo</Label>
                      <div className="text-sm bg-primary/5 border border-primary/10 rounded-lg p-3">
                        {selectedFeedback.admin_notes}
                      </div>
                    </div>
                  )
                )}
              </div>

              {isAdmin && (
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    variant="outline"
                    onClick={handleMarkResolved}
                    disabled={updateFeedback.isPending || selectedFeedback.status === 'completed'}
                    className="gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Marcar Resuelto
                  </Button>
                  <Button onClick={handleUpdate} disabled={updateFeedback.isPending}>
                    {updateFeedback.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Guardar Cambios
                  </Button>
                </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
