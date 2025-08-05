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
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
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
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = No rows found
        console.error('Error fetching notification settings:', error);
        return;
      }

      if (data) {
        setSettings(data);
      } else {
        // Create default settings
        const newSettings = { ...defaultSettings, user_id: user.id };
        setSettings(newSettings);
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
      const { error } = await supabase
        .from('notification_settings')
        .upsert([settings], { onConflict: 'user_id' });

      if (error) {
        console.error('Error saving settings:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron guardar las configuraciones',
          variant: 'destructive',
        });
        return;
      }

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
            <h1 className="text-3xl font-bold">Configuración de Notificaciones</h1>
            <p className="text-muted-foreground">Personaliza cómo y cuándo recibir notificaciones</p>
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

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="types">Tipos de Notificación</TabsTrigger>
            <TabsTrigger value="schedule">Horarios</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            {/* Métodos de Notificación */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Métodos de Notificación
                </CardTitle>
                <CardDescription>
                  Configura cómo quieres recibir las notificaciones
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-5 w-5 text-blue-500" />
                    <div>
                      <Label className="text-base font-medium">Notificaciones Push</Label>
                      <p className="text-sm text-muted-foreground">Recibir notificaciones en el navegador</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.push_enabled}
                    onCheckedChange={(checked) => updateSetting('push_enabled', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {settings.sound_enabled ? (
                      <Volume2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <VolumeX className="h-5 w-5 text-gray-500" />
                    )}
                    <div>
                      <Label className="text-base font-medium">Sonido</Label>
                      <p className="text-sm text-muted-foreground">Reproducir sonido con las notificaciones</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.sound_enabled}
                    onCheckedChange={(checked) => updateSetting('sound_enabled', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-orange-500" />
                    <div>
                      <Label className="text-base font-medium">Email</Label>
                      <p className="text-sm text-muted-foreground">Recibir notificaciones por correo electrónico</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.email_enabled}
                    onCheckedChange={(checked) => updateSetting('email_enabled', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-purple-500" />
                    <div>
                      <Label className="text-base font-medium">SMS</Label>
                      <p className="text-sm text-muted-foreground">Recibir notificaciones por mensaje de texto</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.sms_enabled}
                    onCheckedChange={(checked) => updateSetting('sms_enabled', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="types" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tipos de Notificación</CardTitle>
                <CardDescription>
                  Selecciona qué tipos de notificaciones quieres recibir según tu rol: {profile?.role}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(notificationTypeLabels).map(([type, label]) => {
                    const typedType = type as keyof NotificationSettings['notification_types'];
                    const isEnabled = settings.notification_types[typedType];
                    
                    return (
                      <div key={type} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          {getNotificationIcon(type)}
                          <div>
                            <Label className="text-base font-medium">{label}</Label>
                            <p className="text-sm text-muted-foreground">
                              {type.includes('pedido') && 'Relacionado con pedidos y órdenes'}
                              {type.includes('entrega') && 'Relacionado con entregas y logística'}
                              {type.includes('ruta') && 'Relacionado con rutas y asignaciones'}
                              {type.includes('incidencia') && 'Relacionado con incidencias y problemas'}
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={(checked) => updateNotificationType(typedType, checked)}
                        />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Horarios de Silencio
                </CardTitle>
                <CardDescription>
                  Define un período en el que no quieres recibir notificaciones
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quiet-start">Inicio del silencio</Label>
                    <Input
                      id="quiet-start"
                      type="time"
                      value={settings.quiet_hours_start}
                      onChange={(e) => updateSetting('quiet_hours_start', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quiet-end">Fin del silencio</Label>
                    <Input
                      id="quiet-end"
                      type="time"
                      value={settings.quiet_hours_end}
                      onChange={(e) => updateSetting('quiet_hours_end', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Período de silencio actual</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    De {settings.quiet_hours_start} a {settings.quiet_hours_end} no recibirás notificaciones push ni sonidos.
                    Las notificaciones se seguirán registrando y podrás verlas cuando revises la aplicación.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Estado de permisos */}
            <Card>
              <CardHeader>
                <CardTitle>Estado de Permisos</CardTitle>
                <CardDescription>
                  Revisa el estado de los permisos del navegador
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Notificaciones del navegador</span>
                    <Badge variant={
                      typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted' 
                        ? 'default' 
                        : 'destructive'
                    }>
                      {typeof window !== 'undefined' && 'Notification' in window 
                        ? Notification.permission === 'granted' 
                          ? 'Permitido' 
                          : 'Denegado'
                        : 'No disponible'
                      }
                    </Badge>
                  </div>
                  
                  {typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        Notification.requestPermission().then(permission => {
                          if (permission === 'granted') {
                            toast({
                              title: 'Permisos concedidos',
                              description: 'Ahora puedes recibir notificaciones push',
                            });
                          }
                        });
                      }}
                    >
                      Solicitar permisos
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}