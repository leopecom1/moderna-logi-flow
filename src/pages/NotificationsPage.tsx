import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { RealTimeAlerts } from '@/components/alerts/RealTimeAlerts';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { 
  Bell, 
  Settings, 
  Volume2, 
  VolumeX, 
  Clock, 
  AlertTriangle, 
  Package, 
  Truck,
  Route,
  CheckCircle,
  Save,
  Smartphone,
  Mail,
  MessageSquare
} from 'lucide-react';

interface NotificationSettings {
  id?: string;
  user_id: string;
  sound_enabled: boolean;
  push_enabled: boolean;
  email_enabled: boolean;
  sms_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  notification_types: {
    nuevo_pedido: boolean;
    pedido_asignado: boolean;
    entrega_completada: boolean;
    entrega_fallida: boolean;
    incidencia_creada: boolean;
    incidencia_resuelta: boolean;
    ruta_creada: boolean;
    ruta_iniciada: boolean;
    problema_pedido: boolean;
  };
}

const defaultSettings: Omit<NotificationSettings, 'user_id'> = {
  sound_enabled: true,
  push_enabled: true,
  email_enabled: false,
  sms_enabled: false,
  quiet_hours_start: '22:00',
  quiet_hours_end: '06:00',
  notification_types: {
    nuevo_pedido: true,
    pedido_asignado: true,
    entrega_completada: true,
    entrega_fallida: true,
    incidencia_creada: true,
    incidencia_resuelta: true,
    ruta_creada: true,
    ruta_iniciada: true,
    problema_pedido: true,
  }
};

const notificationTypeLabels = {
  nuevo_pedido: 'Nuevos pedidos',
  pedido_asignado: 'Pedidos asignados',
  entrega_completada: 'Entregas completadas',
  entrega_fallida: 'Entregas fallidas',
  incidencia_creada: 'Incidencias creadas',
  incidencia_resuelta: 'Incidencias resueltas',
  ruta_creada: 'Rutas creadas',
  ruta_iniciada: 'Rutas iniciadas',
  problema_pedido: 'Problemas con pedidos',
};

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'nuevo_pedido':
    case 'pedido_asignado':
      return <Package className="h-4 w-4" />;
    case 'entrega_completada':
    case 'entrega_fallida':
      return <Truck className="h-4 w-4" />;
    case 'ruta_creada':
    case 'ruta_iniciada':
      return <Route className="h-4 w-4" />;
    case 'incidencia_creada':
    case 'problema_pedido':
      return <AlertTriangle className="h-4 w-4" />;
    case 'incidencia_resuelta':
      return <CheckCircle className="h-4 w-4" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
};

export default function NotificationsPage() {
  const { user, profile } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [user]);

  const fetchSettings = async () => {
    if (!user) return;

    try {
      // Usar localStorage temporalmente hasta que la migración complete
      const storageKey = `notification_settings_${user.id}`;
      const stored = localStorage.getItem(storageKey);
      
      if (stored) {
        const parsedSettings = JSON.parse(stored) as NotificationSettings;
        setSettings(parsedSettings);
      } else {
        // Create default settings
        const newSettings = { ...defaultSettings, user_id: user.id };
        setSettings(newSettings);
        localStorage.setItem(storageKey, JSON.stringify(newSettings));
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings || !user) return;

    setSaving(true);
    try {
      // Usar localStorage temporalmente hasta que la migración complete
      const storageKey = `notification_settings_${user.id}`;
      localStorage.setItem(storageKey, JSON.stringify(settings));

      toast({
        title: 'Configuración guardada',
        description: 'Tus preferencias de notificaciones han sido actualizadas',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron guardar las configuraciones',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof NotificationSettings, value: any) => {
    if (!settings) return;
    setSettings(prev => prev ? { ...prev, [key]: value } : null);
  };

  const updateNotificationType = (type: keyof NotificationSettings['notification_types'], enabled: boolean) => {
    if (!settings) return;
    setSettings(prev => prev ? {
      ...prev,
      notification_types: {
        ...prev.notification_types,
        [type]: enabled
      }
    } : null);
  };

  const testNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Notificación de prueba', {
        body: 'Esta es una notificación de prueba del sistema RutaMOD',
        icon: '/favicon.ico',
      });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification('Notificación de prueba', {
            body: 'Esta es una notificación de prueba del sistema RutaMOD',
            icon: '/favicon.ico',
          });
        }
      });
    }
    
    toast({
      title: 'Notificación de prueba enviada',
      description: 'Si tienes las notificaciones habilitadas, deberías ver una notificación',
    });
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  if (!settings) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error al cargar configuraciones</h3>
          <p className="text-muted-foreground">No se pudieron cargar las configuraciones de notificaciones</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Centro de Notificaciones</h1>
            <p className="text-muted-foreground">Administra todas tus notificaciones y alertas del sistema</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={testNotification}>
              <Bell className="h-4 w-4 mr-2" />
              Probar Notificación
            </Button>
            <Button onClick={saveSettings} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel principal de notificaciones */}
          <div className="lg:col-span-2">
            <NotificationCenter />
          </div>

          {/* Panel de alertas y configuración */}
          <div className="space-y-6">
            <RealTimeAlerts />
            
            {/* Configuración rápida */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configuración Rápida
                </CardTitle>
                <CardDescription>
                  Ajusta tus preferencias de notificación
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {settings.sound_enabled ? (
                      <Volume2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <VolumeX className="h-4 w-4 text-gray-500" />
                    )}
                    <Label className="text-sm">Sonido</Label>
                  </div>
                  <Switch
                    checked={settings.sound_enabled}
                    onCheckedChange={(checked) => updateSetting('sound_enabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-4 w-4 text-blue-500" />
                    <Label className="text-sm">Push</Label>
                  </div>
                  <Switch
                    checked={settings.push_enabled}
                    onCheckedChange={(checked) => updateSetting('push_enabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-orange-500" />
                    <Label className="text-sm">Email</Label>
                  </div>
                  <Switch
                    checked={settings.email_enabled}
                    onCheckedChange={(checked) => updateSetting('email_enabled', checked)}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Horario de silencio</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="time"
                      value={settings.quiet_hours_start}
                      onChange={(e) => updateSetting('quiet_hours_start', e.target.value)}
                      className="text-xs"
                    />
                    <Input
                      type="time"
                      value={settings.quiet_hours_end}
                      onChange={(e) => updateSetting('quiet_hours_end', e.target.value)}
                      className="text-xs"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="text-sm font-medium">Tipos de notificación activos</Label>
                  <div className="space-y-2">
                    {Object.entries(settings.notification_types)
                      .filter(([_, enabled]) => enabled)
                      .slice(0, 3)
                      .map(([type, _]) => (
                        <div key={type} className="flex items-center gap-2">
                          {getNotificationIcon(type)}
                          <span className="text-xs text-muted-foreground">
                            {notificationTypeLabels[type as keyof typeof notificationTypeLabels]}
                          </span>
                        </div>
                      ))}
                    {Object.values(settings.notification_types).filter(Boolean).length > 3 && (
                      <span className="text-xs text-muted-foreground">
                        +{Object.values(settings.notification_types).filter(Boolean).length - 3} más
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Estado de permisos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Estado del Sistema</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Permisos del navegador</span>
                    <Badge variant={
                      typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted' 
                        ? 'default' 
                        : 'destructive'
                    } className="text-xs">
                      {typeof window !== 'undefined' && 'Notification' in window 
                        ? Notification.permission === 'granted' 
                          ? 'OK' 
                          : 'Denegado'
                        : 'N/A'
                      }
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Conexión en tiempo real</span>
                    <Badge variant="default" className="text-xs">Activa</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}