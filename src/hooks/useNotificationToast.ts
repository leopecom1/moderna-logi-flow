import { useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { useToast } from '@/hooks/use-toast';

export const useNotificationToast = () => {
  const { notifications } = useNotifications();
  const { toast } = useToast();

  useEffect(() => {
    // Mostrar toast para nuevas notificaciones
    const unreadNotifications = notifications.filter(n => !n.read);
    
    if (unreadNotifications.length > 0) {
      const latestNotification = unreadNotifications[0];
      const isNewNotification = Date.now() - new Date(latestNotification.created_at).getTime() < 5000; // 5 segundos
      
      if (isNewNotification) {
        const getVariant = (type: string): "default" | "destructive" => {
          switch (type) {
            case 'entrega_fallida':
            case 'incidencia_creada':
            case 'problema_pedido':
              return 'destructive';
            default:
              return 'default';
          }
        };

        toast({
          title: latestNotification.title,
          description: latestNotification.message,
          variant: getVariant(latestNotification.type),
        });
      }
    }
  }, [notifications, toast]);

  return { notifications };
};