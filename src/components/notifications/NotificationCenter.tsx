import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/hooks/useNotifications';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Bell, 
  Search, 
  Filter, 
  CheckCircle2, 
  Circle, 
  Package, 
  Truck, 
  AlertTriangle, 
  Route,
  Eye,
  MoreHorizontal,
  Archive,
  Trash2
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'nuevo_pedido':
    case 'pedido_asignado':
      return <Package className="h-4 w-4 text-blue-500" />;
    case 'entrega_completada':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'entrega_fallida':
      return <Truck className="h-4 w-4 text-red-500" />;
    case 'incidencia_creada':
    case 'problema_pedido':
      return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    case 'incidencia_resuelta':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'ruta_creada':
    case 'ruta_iniciada':
      return <Route className="h-4 w-4 text-purple-500" />;
    default:
      return <Bell className="h-4 w-4 text-muted-foreground" />;
  }
};

const getNotificationTypeLabel = (type: string) => {
  const labels: { [key: string]: string } = {
    nuevo_pedido: 'Nuevo Pedido',
    pedido_asignado: 'Pedido Asignado',
    entrega_completada: 'Entrega Completada',
    entrega_fallida: 'Entrega Fallida',
    incidencia_creada: 'Incidencia Creada',
    incidencia_resuelta: 'Incidencia Resuelta',
    ruta_creada: 'Ruta Creada',
    ruta_iniciada: 'Ruta Iniciada',
    problema_pedido: 'Problema con Pedido'
  };
  return labels[type] || type;
};

const getPriorityColor = (type: string) => {
  const priorities: { [key: string]: string } = {
    entrega_fallida: 'bg-red-100 text-red-800',
    problema_pedido: 'bg-red-100 text-red-800',
    incidencia_creada: 'bg-orange-100 text-orange-800',
    nuevo_pedido: 'bg-blue-100 text-blue-800',
    pedido_asignado: 'bg-blue-100 text-blue-800',
    entrega_completada: 'bg-green-100 text-green-800',
    incidencia_resuelta: 'bg-green-100 text-green-800',
    ruta_creada: 'bg-purple-100 text-purple-800',
    ruta_iniciada: 'bg-purple-100 text-purple-800'
  };
  return priorities[type] || 'bg-gray-100 text-gray-800';
};

interface NotificationCenterProps {
  className?: string;
}

export const NotificationCenter = ({ className }: NotificationCenterProps) => {
  const { notifications, markAsRead, markAllAsRead, loading } = useNotifications();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Filtrar notificaciones
  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || notification.type === filterType;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'read' && notification.read) ||
                         (filterStatus === 'unread' && !notification.read);

    return matchesSearch && matchesType && matchesStatus;
  });

  const handleNotificationClick = (notification: any) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Navegar a la vista correspondiente basada en el tipo y datos
    if (notification.data) {
      const data = notification.data;
      if (data.order_id) {
        // Navegar a detalles del pedido
        window.location.href = `/orders/${data.order_id}`;
      } else if (data.delivery_id) {
        // Navegar a detalles de entrega
        window.location.href = `/deliveries`;
      } else if (data.route_id) {
        // Navegar a detalles de ruta
        window.location.href = `/routes/${data.route_id}`;
      } else if (data.incident_id) {
        // Navegar a incidencias
        window.location.href = `/incidents`;
      }
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        console.error('Error deleting notification:', error);
        return;
      }

      // La notificación se eliminará automáticamente de la lista por el realtime
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Centro de Notificaciones
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Administra todas tus notificaciones del sistema
            </CardDescription>
          </div>
          
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              Marcar todas como leídas
            </Button>
          )}
        </div>

        {/* Filtros y búsqueda */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar notificaciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="nuevo_pedido">Nuevos pedidos</SelectItem>
              <SelectItem value="entrega_completada">Entregas completadas</SelectItem>
              <SelectItem value="entrega_fallida">Entregas fallidas</SelectItem>
              <SelectItem value="incidencia_creada">Incidencias</SelectItem>
              <SelectItem value="ruta_creada">Rutas</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="unread">No leídas</SelectItem>
              <SelectItem value="read">Leídas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay notificaciones</h3>
              <p className="text-muted-foreground">
                {searchTerm || filterType !== 'all' || filterStatus !== 'all'
                  ? 'No se encontraron notificaciones con los filtros aplicados'
                  : 'No tienes notificaciones en este momento'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`
                    p-4 rounded-lg border transition-all duration-200 cursor-pointer
                    ${!notification.read 
                      ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' 
                      : 'bg-white hover:bg-gray-50'
                    }
                  `}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge 
                            variant="secondary" 
                            className={getPriorityColor(notification.type)}
                          >
                            {getNotificationTypeLabel(notification.type)}
                          </Badge>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          )}
                        </div>
                        
                        <h4 className="text-sm font-medium text-gray-900 mb-1">
                          {notification.title}
                        </h4>
                        
                        <p className="text-sm text-gray-600 mb-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {format(new Date(notification.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                          </span>
                          
                          {notification.data && (
                            <Button variant="ghost" size="sm" className="text-xs">
                              <Eye className="h-3 w-3 mr-1" />
                              Ver detalles
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {!notification.read && (
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Marcar como leída
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};