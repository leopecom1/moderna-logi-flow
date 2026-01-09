import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Sparkles, 
  Wrench, 
  Bug, 
  Megaphone, 
  CheckCheck,
  Circle
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSystemUpdates, SystemUpdate } from '@/hooks/useSystemUpdates';
import { cn } from '@/lib/utils';

interface UpdatesPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const typeConfig = {
  feature: {
    icon: Sparkles,
    label: 'Nueva función',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  improvement: {
    icon: Wrench,
    label: 'Mejora',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  fix: {
    icon: Bug,
    label: 'Corrección',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
  announcement: {
    icon: Megaphone,
    label: 'Anuncio',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
};

const priorityConfig = {
  low: {
    label: 'Baja',
    variant: 'secondary' as const,
  },
  medium: {
    label: 'Media',
    variant: 'default' as const,
  },
  high: {
    label: 'Alta',
    variant: 'destructive' as const,
  },
};

function UpdateCard({ 
  update, 
  isRead, 
  onRead 
}: { 
  update: SystemUpdate; 
  isRead: boolean;
  onRead: () => void;
}) {
  const config = typeConfig[update.type];
  const priorityConf = priorityConfig[update.priority];
  const Icon = config.icon;

  const handleClick = () => {
    if (!isRead) {
      onRead();
    }
  };

  return (
    <div 
      className={cn(
        "p-4 border rounded-lg cursor-pointer transition-colors hover:bg-accent/50",
        !isRead && "border-primary/30 bg-primary/5"
      )}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <div className={cn("p-2 rounded-lg", config.bgColor)}>
          <Icon className={cn("h-4 w-4", config.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {!isRead && (
              <Circle className="h-2 w-2 fill-primary text-primary flex-shrink-0" />
            )}
            <h4 className="font-medium text-sm truncate">{update.title}</h4>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-xs">
              {config.label}
            </Badge>
            {update.priority === 'high' && (
              <Badge variant={priorityConf.variant} className="text-xs">
                {priorityConf.label}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-3">
            {update.content}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {format(new Date(update.created_at), "d 'de' MMMM, yyyy", { locale: es })}
          </p>
        </div>
      </div>
    </div>
  );
}

export function UpdatesPanel({ open, onOpenChange }: UpdatesPanelProps) {
  const { 
    activeUpdates, 
    unreadCount, 
    isLoading, 
    markAsRead, 
    markAllAsRead,
    isRead 
  } = useSystemUpdates();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader className="pb-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              Novedades
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {unreadCount} sin leer
                </Badge>
              )}
            </SheetTitle>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllAsRead.mutate()}
                disabled={markAllAsRead.isPending}
              >
                <CheckCheck className="h-4 w-4 mr-1" />
                Marcar todas
              </Button>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-8rem)] mt-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 border rounded-lg animate-pulse">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-muted rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/4" />
                      <div className="h-12 bg-muted rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : activeUpdates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Megaphone className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="font-medium text-lg mb-1">No hay novedades</h3>
              <p className="text-sm text-muted-foreground">
                Cuando haya actualizaciones del sistema, aparecerán aquí.
              </p>
            </div>
          ) : (
            <div className="space-y-3 pr-4">
              {activeUpdates.map((update) => (
                <UpdateCard
                  key={update.id}
                  update={update}
                  isRead={isRead(update.id)}
                  onRead={() => markAsRead.mutate(update.id)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
