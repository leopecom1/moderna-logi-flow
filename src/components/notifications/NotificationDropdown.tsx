import { useState } from 'react';
import { Bell, Check, CheckCheck, Circle, Package, Truck, AlertTriangle, Route, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'nuevo_pedido':
      return <Package className="h-4 w-4 text-emerald-500" />;
    case 'pedido_asignado':
      return <Circle className="h-4 w-4 text-blue-500" />;
    case 'entrega_completada':
      return <CheckCheck className="h-4 w-4 text-green-500" />;
    case 'entrega_fallida':
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    case 'incidencia_creada':
      return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    case 'incidencia_resuelta':
      return <Check className="h-4 w-4 text-green-500" />;
    case 'ruta_creada':
      return <Route className="h-4 w-4 text-purple-500" />;
    case 'ruta_iniciada':
      return <MapPin className="h-4 w-4 text-indigo-500" />;
    case 'problema_pedido':
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    default:
      return <Bell className="h-4 w-4 text-muted-foreground" />;
  }
};

export const NotificationDropdown = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications();
  const [open, setOpen] = useState(false);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    setOpen(false);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="relative h-9 w-9 p-0 glass-effect hover:bg-white/20 transition-all duration-300"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center animate-pulse"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-80 glass-effect border-white/20 bg-white/10 backdrop-blur-lg"
      >
        <div className="flex items-center justify-between p-2">
          <h3 className="font-medium text-white">Notificaciones</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleMarkAllAsRead}
              className="h-8 text-xs text-white/80 hover:text-white hover:bg-white/20"
            >
              Marcar todas como leídas
            </Button>
          )}
        </div>
        
        <DropdownMenuSeparator className="bg-white/20" />
        
        <ScrollArea className="h-[300px]">
          {loading ? (
            <div className="p-4 text-center text-white/60">
              Cargando notificaciones...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-white/60">
              No tienes notificaciones
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`
                  flex items-start space-x-3 p-3 cursor-pointer
                  ${!notification.read ? 'bg-white/10' : 'bg-transparent'}
                  hover:bg-white/20 transition-all duration-200
                `}
              >
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-white truncate">
                      {notification.title}
                    </p>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2" />
                    )}
                  </div>
                  
                  <p className="text-xs text-white/80 mt-1 line-clamp-2">
                    {notification.message}
                  </p>
                  
                  <p className="text-xs text-white/60 mt-1">
                    {format(new Date(notification.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </p>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};