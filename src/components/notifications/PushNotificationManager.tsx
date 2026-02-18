import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  Bell, 
  BellRing, 
  Smartphone, 
  Mail, 
  MessageSquare, 
  MapPin, 
  Clock, 
  Settings, 
  Save,
  TestTube,
  Volume2,
  VolumeX
} from 'lucide-react';

interface NotificationPreferences {
  push_enabled: boolean;
  email_enabled: boolean;
  sms_enabled: boolean;
  whatsapp_enabled: boolean;
  sound_enabled: boolean;
  location_alerts: boolean;
  delivery_radius: number;
  quiet_hours_start: string;
  quiet_hours_end: string;
  notification_types: {
    nuevo_pedido: boolean;
    entrega_completada: boolean;
    entrega_fallida: boolean;
    incidencia_creada: boolean;
    ruta_asignada: boolean;
    emergencias: boolean;
  };
}

const defaultPreferences: NotificationPreferences = {
  push_enabled: true,
  email_enabled: true,
  sms_enabled: false,
  whatsapp_enabled: false,
  sound_enabled: true,
  location_alerts: false,
  delivery_radius: 500,
  quiet_hours_start: '22:00',
  quiet_hours_end: '08:00',
  notification_types: {
    nuevo_pedido: true,
    entrega_completada: true,
    entrega_fallida: true,
    incidencia_creada: true,
    ruta_asignada: true,
    emergencias: true,
  }
};

export const PushNotificationManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    checkPushSupport();
    loadPreferences();
  }, [user]);

  const checkPushSupport = () => {
    if ('Notification' in window && 'serviceWorker' in navigator) {
      setPushSupported(true);
      setPushPermission(Notification.permission);
    }
  };

  const loadPreferences = async () => {
    if (!user) return;

    try {
      // Simular carga de preferencias desde el perfil del usuario
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error loading user profile:', error);
        setLoading(false);
        return;
      }

      // Por ahora, usar preferencias por defecto
      // En el futuro, estas se guardarán en una tabla dedicada
      setPreferences(defaultPreferences);
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestPushPermission = async () => {
    if (!pushSupported) {
      toast({
        title: "No compatible",
        description: "Tu navegador no soporta notificaciones push",
        variant: "destructive",
      });
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);

      if (permission === 'granted') {
        await registerServiceWorker();
        toast({
          title: "Notificaciones activadas",
          description: "Ahora recibirás notificaciones push en tiempo real",
        });
      } else {
        toast({
          title: "Permisos denegados",
          description: "Las notificaciones push han sido deshabilitadas",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      toast({
        title: "Error",
        description: "No se pudieron solicitar los permisos de notificación",
        variant: "destructive",
      });
    }
  };

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);
      
      // Suscribirse a push notifications
      const subscription = await (registration as any).pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array('YOUR_VAPID_PUBLIC_KEY') // Reemplazar con tu clave VAPID
      });

      // Guardar la suscripción en la base de datos
      await savePushSubscription(subscription);
    } catch (error) {
      console.error('Error registering service worker:', error);
    }
  };

  const savePushSubscription = async (subscription: PushSubscription) => {
    try {
      // Simular guardado de suscripción
      // En producción, esto se guardaría en la tabla push_subscriptions
      console.log('Push subscription saved:', subscription.toJSON());
      
      toast({
        title: "Suscripción guardada",
        description: "Tu dispositivo está registrado para notificaciones push",
      });
    } catch (error) {
      console.error('Error saving push subscription:', error);
    }
  };

  const savePreferences = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Simular guardado de preferencias
      // En producción, esto se guardaría en la tabla notification_preferences
      console.log('Preferences saved:', preferences);
      
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "Preferencias guardadas",
        description: "Tus configuraciones de notificación han sido actualizadas",
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Error",
        description: "No se pudieron guardar las preferencias",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const testNotification = () => {
    if (pushPermission === 'granted') {
      new Notification('Notificación de prueba', {
        body: 'Esta es una notificación de prueba del sistema',
        icon: '/favicon.ico',
        badge: '/badge-icon.png'
      });
    } else {
      toast({
        title: "Prueba de notificación",
        description: "Esta sería una notificación push en tiempo real",
      });
    }
  };

  const updatePreference = (key: keyof NotificationPreferences, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateNotificationType = (type: keyof NotificationPreferences['notification_types'], enabled: boolean) => {
    setPreferences(prev => ({
      ...prev,
      notification_types: {
        ...prev.notification_types,
        [type]: enabled
      }
    }));
  };

  // Función auxiliar para convertir VAPID key
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estado de las notificaciones push */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Estado de las Notificaciones Push
          </CardTitle>
          <CardDescription>
            Configuración y estado actual de las notificaciones en tiempo real
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Notificaciones del navegador</p>
                <p className="text-sm text-muted-foreground">
                  {pushSupported ? 'Compatibles' : 'No compatibles'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant={
                  pushPermission === 'granted' ? 'default' : 
                  pushPermission === 'denied' ? 'destructive' : 'secondary'
                }
              >
                {pushPermission === 'granted' ? 'Activadas' : 
                 pushPermission === 'denied' ? 'Bloqueadas' : 'Pendientes'}
              </Badge>
              {pushPermission !== 'granted' && pushSupported && (
                <Button onClick={requestPushPermission} size="sm">
                  Activar
                </Button>
              )}
            </div>
          </div>

          {pushPermission === 'granted' && (
            <div className="flex items-center gap-2">
              <Button onClick={testNotification} variant="outline" size="sm">
                <TestTube className="h-4 w-4 mr-2" />
                Probar notificación
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preferencias generales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Preferencias de Notificación
          </CardTitle>
          <CardDescription>
            Configura cómo y cuándo quieres recibir notificaciones
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Canales de notificación */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Canales de notificación</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BellRing className="h-4 w-4 text-blue-500" />
                  <Label htmlFor="push">Notificaciones Push</Label>
                </div>
                <Switch
                  id="push"
                  checked={preferences.push_enabled}
                  onCheckedChange={(checked) => updatePreference('push_enabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-green-500" />
                  <Label htmlFor="email">Email</Label>
                </div>
                <Switch
                  id="email"
                  checked={preferences.email_enabled}
                  onCheckedChange={(checked) => updatePreference('email_enabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-4 w-4 text-orange-500" />
                  <Label htmlFor="sms">SMS</Label>
                </div>
                <Switch
                  id="sms"
                  checked={preferences.sms_enabled}
                  onCheckedChange={(checked) => updatePreference('sms_enabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-4 w-4 text-green-600" />
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                </div>
                <Switch
                  id="whatsapp"
                  checked={preferences.whatsapp_enabled}
                  onCheckedChange={(checked) => updatePreference('whatsapp_enabled', checked)}
                />
              </div>
            </div>
          </div>

          {/* Configuraciones adicionales */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Configuraciones adicionales</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {preferences.sound_enabled ? (
                    <Volume2 className="h-4 w-4 text-blue-500" />
                  ) : (
                    <VolumeX className="h-4 w-4 text-gray-400" />
                  )}
                  <Label htmlFor="sound">Sonido</Label>
                </div>
                <Switch
                  id="sound"
                  checked={preferences.sound_enabled}
                  onCheckedChange={(checked) => updatePreference('sound_enabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-red-500" />
                  <Label htmlFor="location">Alertas por ubicación</Label>
                </div>
                <Switch
                  id="location"
                  checked={preferences.location_alerts}
                  onCheckedChange={(checked) => updatePreference('location_alerts', checked)}
                />
              </div>
            </div>

            {preferences.location_alerts && (
              <div className="space-y-2">
                <Label htmlFor="radius">Radio de entrega (metros)</Label>
                <Input
                  id="radius"
                  type="number"
                  value={preferences.delivery_radius}
                  onChange={(e) => updatePreference('delivery_radius', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            )}
          </div>

          {/* Horario silencioso */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Horario silencioso
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quiet-start">Inicio</Label>
                <Input
                  id="quiet-start"
                  type="time"
                  value={preferences.quiet_hours_start}
                  onChange={(e) => updatePreference('quiet_hours_start', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quiet-end">Fin</Label>
                <Input
                  id="quiet-end"
                  type="time"
                  value={preferences.quiet_hours_end}
                  onChange={(e) => updatePreference('quiet_hours_end', e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tipos de notificación */}
      <Card>
        <CardHeader>
          <CardTitle>Tipos de Notificación</CardTitle>
          <CardDescription>
            Selecciona qué tipos de eventos quieres que te notifiquen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(preferences.notification_types).map(([key, enabled]) => (
              <div key={key} className="flex items-center justify-between">
                <Label htmlFor={key} className="capitalize">
                  {key.replace(/_/g, ' ')}
                </Label>
                <Switch
                  id={key}
                  checked={enabled}
                  onCheckedChange={(checked) => 
                    updateNotificationType(key as keyof NotificationPreferences['notification_types'], checked)
                  }
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Guardar configuración */}
      <div className="flex justify-end">
        <Button onClick={savePreferences} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Guardando...' : 'Guardar configuración'}
        </Button>
      </div>
    </div>
  );
};