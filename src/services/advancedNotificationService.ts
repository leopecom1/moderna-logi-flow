import { supabase } from '@/integrations/supabase/client';

// Servicio avanzado de notificaciones
export class AdvancedNotificationService {
  // Enviar notificación push
  static async sendPushNotification(userId: string, title: string, body: string, data?: any) {
    try {
      // En producción, esto usaría Firebase Cloud Messaging o similar
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        
        // Simular envío de push notification
        console.log('Sending push notification:', { userId, title, body, data });
        
        return { success: true, messageId: `push_${Date.now()}` };
      }
    } catch (error) {
      console.error('Error sending push notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Enviar notificación por WhatsApp
  static async sendWhatsAppNotification(phoneNumber: string, message: string) {
    try {
      const response = await supabase.functions.invoke('send-notification', {
        body: {
          phoneNumber: phoneNumber,
          message: message,
          type: 'whatsapp'
        }
      });

      if (response.error) {
        throw response.error;
      }

      return response.data;
    } catch (error) {
      console.error('Error sending WhatsApp notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Enviar notificación por SMS
  static async sendSMSNotification(phoneNumber: string, message: string) {
    try {
      const response = await supabase.functions.invoke('send-notification', {
        body: {
          phoneNumber: phoneNumber,
          message: message,
          type: 'sms'
        }
      });

      if (response.error) {
        throw response.error;
      }

      return response.data;
    } catch (error) {
      console.error('Error sending SMS notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Enviar notificación por email
  static async sendEmailNotification(email: string, subject: string, body: string) {
    try {
      // En producción, esto usaría un servicio como SendGrid, Mailgun, etc.
      console.log('Sending email notification:', { email, subject, body });
      
      // Simular delay de envío
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return { 
        success: true, 
        messageId: `email_${Date.now()}`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error sending email notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Crear alerta geográfica
  static async createLocationAlert(userId: string, deliveryId: string, alertType: string, location: any) {
    try {
      // Simular creación de alerta geográfica
      console.log('Creating location alert:', { userId, deliveryId, alertType, location });
      
      const alert = {
        id: `alert_${Date.now()}`,
        user_id: userId,
        delivery_id: deliveryId,
        alert_type: alertType,
        location_name: location.name,
        latitude: location.lat,
        longitude: location.lng,
        radius: location.radius || 100,
        is_active: true,
        created_at: new Date().toISOString()
      };

      return { success: true, alert };
    } catch (error) {
      console.error('Error creating location alert:', error);
      return { success: false, error: error.message };
    }
  }

  // Verificar proximidad y disparar alertas
  static async checkProximityAlerts(currentLocation: {lat: number, lng: number}) {
    try {
      // Simular verificación de proximidad
      const mockDeliveries = [
        { id: 'del-001', lat: currentLocation.lat + 0.001, lng: currentLocation.lng + 0.001, address: 'Centro Comercial' },
        { id: 'del-002', lat: currentLocation.lat + 0.002, lng: currentLocation.lng - 0.001, address: 'Barrio Pocitos' }
      ];

      const proximityAlerts = [];

      for (const delivery of mockDeliveries) {
        const distance = this.calculateDistance(
          currentLocation.lat, currentLocation.lng,
          delivery.lat, delivery.lng
        );

        if (distance < 200) { // 200 metros
          proximityAlerts.push({
            deliveryId: delivery.id,
            distance: Math.round(distance),
            address: delivery.address,
            type: distance < 50 ? 'arrived' : 'approaching'
          });
        }
      }

      return proximityAlerts;
    } catch (error) {
      console.error('Error checking proximity alerts:', error);
      return [];
    }
  }

  // Calcular distancia entre dos puntos
  static calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000; // Radio de la Tierra en metros
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Enviar notificación multi-canal
  static async sendMultiChannelNotification(
    userId: string, 
    title: string, 
    message: string, 
    channels: string[],
    contactInfo?: any
  ) {
    const results = [];

    for (const channel of channels) {
      try {
        let result;
        
        switch (channel) {
          case 'push':
            result = await this.sendPushNotification(userId, title, message);
            break;
          case 'whatsapp':
            if (contactInfo?.whatsapp) {
              result = await this.sendWhatsAppNotification(contactInfo.whatsapp, message);
            }
            break;
          case 'sms':
            if (contactInfo?.phone) {
              result = await this.sendSMSNotification(contactInfo.phone, message);
            }
            break;
          case 'email':
            if (contactInfo?.email) {
              result = await this.sendEmailNotification(contactInfo.email, title, message);
            }
            break;
          default:
            result = { success: false, error: 'Unknown channel' };
        }

        results.push({
          channel,
          ...result
        });
      } catch (error) {
        results.push({
          channel,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  // Programar notificación
  static async scheduleNotification(
    userId: string,
    title: string,
    message: string,
    scheduledTime: Date,
    channels: string[]
  ) {
    try {
      const now = new Date();
      const delay = scheduledTime.getTime() - now.getTime();

      if (delay <= 0) {
        throw new Error('Scheduled time must be in the future');
      }

      // Simular programación de notificación
      console.log('Scheduling notification for:', scheduledTime);
      
      setTimeout(async () => {
        await this.sendMultiChannelNotification(userId, title, message, channels);
      }, Math.min(delay, 2147483647)); // Máximo timeout de JS

      return {
        success: true,
        scheduledId: `scheduled_${Date.now()}`,
        scheduledTime: scheduledTime.toISOString()
      };
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return { success: false, error: error.message };
    }
  }
}