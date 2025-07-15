import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

type NotificationType = Tables<'notifications'>['type'];

interface NotificationData {
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
}

export class NotificationService {
  static async createNotification(notificationData: NotificationData) {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert([notificationData]);

      if (error) {
        console.error('Error creating notification:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error creating notification:', error);
      return false;
    }
  }

  // Notificaciones para pedidos
  static async notifyNewOrder(orderId: string, orderNumber: string, sellerName: string) {
    // Notificar a gerencia
    const { data: gerenciaUsers } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('role', 'gerencia')
      .eq('is_active', true);

    const notifications = gerenciaUsers?.map(user => ({
      user_id: user.user_id,
      type: 'nuevo_pedido' as NotificationType,
      title: 'Nuevo pedido creado',
      message: `El pedido #${orderNumber} fue creado por ${sellerName}`,
      data: { order_id: orderId, order_number: orderNumber }
    })) || [];

    if (notifications.length > 0) {
      await supabase.from('notifications').insert(notifications);
    }
  }

  static async notifyOrderAssigned(orderId: string, orderNumber: string, cadeteId: string) {
    // Notificar al cadete asignado
    await this.createNotification({
      user_id: cadeteId,
      type: 'pedido_asignado',
      title: 'Pedido asignado',
      message: `Te ha sido asignado el pedido #${orderNumber}`,
      data: { order_id: orderId, order_number: orderNumber }
    });
  }

  // Notificaciones para entregas
  static async notifyDeliveryCompleted(deliveryId: string, orderNumber: string, cadeteId: string) {
    // Notificar a gerencia y vendedor
    const { data: order } = await supabase
      .from('orders')
      .select('seller_id')
      .eq('id', (await supabase.from('deliveries').select('order_id').eq('id', deliveryId).single()).data?.order_id)
      .single();

    const notifications = [];

    // Notificar a gerencia
    const { data: gerenciaUsers } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('role', 'gerencia')
      .eq('is_active', true);

    gerenciaUsers?.forEach(user => {
      notifications.push({
        user_id: user.user_id,
        type: 'entrega_completada' as NotificationType,
        title: 'Entrega completada',
        message: `El pedido #${orderNumber} fue entregado exitosamente`,
        data: { delivery_id: deliveryId, order_number: orderNumber }
      });
    });

    // Notificar al vendedor
    if (order?.seller_id) {
      notifications.push({
        user_id: order.seller_id,
        type: 'entrega_completada' as NotificationType,
        title: 'Entrega completada',
        message: `Tu pedido #${orderNumber} fue entregado exitosamente`,
        data: { delivery_id: deliveryId, order_number: orderNumber }
      });
    }

    if (notifications.length > 0) {
      await supabase.from('notifications').insert(notifications);
    }
  }

  static async notifyDeliveryFailed(deliveryId: string, orderNumber: string, reason: string) {
    // Notificar a gerencia y vendedor
    const { data: order } = await supabase
      .from('orders')
      .select('seller_id')
      .eq('id', (await supabase.from('deliveries').select('order_id').eq('id', deliveryId).single()).data?.order_id)
      .single();

    const notifications = [];

    // Notificar a gerencia
    const { data: gerenciaUsers } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('role', 'gerencia')
      .eq('is_active', true);

    gerenciaUsers?.forEach(user => {
      notifications.push({
        user_id: user.user_id,
        type: 'entrega_fallida' as NotificationType,
        title: 'Entrega fallida',
        message: `El pedido #${orderNumber} no pudo ser entregado: ${reason}`,
        data: { delivery_id: deliveryId, order_number: orderNumber, reason }
      });
    });

    // Notificar al vendedor
    if (order?.seller_id) {
      notifications.push({
        user_id: order.seller_id,
        type: 'entrega_fallida' as NotificationType,
        title: 'Entrega fallida',
        message: `Tu pedido #${orderNumber} no pudo ser entregado: ${reason}`,
        data: { delivery_id: deliveryId, order_number: orderNumber, reason }
      });
    }

    if (notifications.length > 0) {
      await supabase.from('notifications').insert(notifications);
    }
  }

  // Notificaciones para incidencias
  static async notifyIncidentCreated(incidentId: string, title: string, reportedBy: string) {
    // Notificar a gerencia
    const { data: gerenciaUsers } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('role', 'gerencia')
      .eq('is_active', true);

    const notifications = gerenciaUsers?.map(user => ({
      user_id: user.user_id,
      type: 'incidencia_creada' as NotificationType,
      title: 'Nueva incidencia reportada',
      message: `${reportedBy} reportó: ${title}`,
      data: { incident_id: incidentId }
    })) || [];

    if (notifications.length > 0) {
      await supabase.from('notifications').insert(notifications);
    }
  }

  static async notifyIncidentResolved(incidentId: string, title: string, reportedById: string) {
    // Notificar al usuario que reportó la incidencia
    await this.createNotification({
      user_id: reportedById,
      type: 'incidencia_resuelta',
      title: 'Incidencia resuelta',
      message: `Tu incidencia "${title}" ha sido resuelta`,
      data: { incident_id: incidentId }
    });
  }

  // Notificaciones para rutas
  static async notifyRouteCreated(routeId: string, routeName: string, cadeteId: string) {
    // Notificar al cadete asignado
    await this.createNotification({
      user_id: cadeteId,
      type: 'ruta_creada',
      title: 'Nueva ruta asignada',
      message: `Te ha sido asignada la ruta: ${routeName}`,
      data: { route_id: routeId, route_name: routeName }
    });
  }

  static async notifyRouteStarted(routeId: string, routeName: string, cadeteId: string) {
    // Notificar a gerencia
    const { data: gerenciaUsers } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('role', 'gerencia')
      .eq('is_active', true);

    const notifications = gerenciaUsers?.map(user => ({
      user_id: user.user_id,
      type: 'ruta_iniciada' as NotificationType,
      title: 'Ruta iniciada',
      message: `La ruta ${routeName} ha sido iniciada`,
      data: { route_id: routeId, route_name: routeName }
    })) || [];

    if (notifications.length > 0) {
      await supabase.from('notifications').insert(notifications);
    }
  }

  // Notificaciones para problemas con pedidos
  static async notifyOrderProblem(orderId: string, orderNumber: string, problem: string) {
    // Notificar a gerencia y vendedor
    const { data: order } = await supabase
      .from('orders')
      .select('seller_id')
      .eq('id', orderId)
      .single();

    const notifications = [];

    // Notificar a gerencia
    const { data: gerenciaUsers } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('role', 'gerencia')
      .eq('is_active', true);

    gerenciaUsers?.forEach(user => {
      notifications.push({
        user_id: user.user_id,
        type: 'problema_pedido' as NotificationType,
        title: 'Problema con pedido',
        message: `Problema reportado en pedido #${orderNumber}: ${problem}`,
        data: { order_id: orderId, order_number: orderNumber, problem }
      });
    });

    // Notificar al vendedor
    if (order?.seller_id) {
      notifications.push({
        user_id: order.seller_id,
        type: 'problema_pedido' as NotificationType,
        title: 'Problema con tu pedido',
        message: `Problema reportado en tu pedido #${orderNumber}: ${problem}`,
        data: { order_id: orderId, order_number: orderNumber, problem }
      });
    }

    if (notifications.length > 0) {
      await supabase.from('notifications').insert(notifications);
    }
  }
}