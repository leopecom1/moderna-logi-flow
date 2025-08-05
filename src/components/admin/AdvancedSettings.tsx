import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Settings, Users, Database, Shield, Download, Upload, Globe, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const AdvancedSettings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    notifications: {
      email_enabled: true,
      sms_enabled: true,
      push_enabled: true,
      auto_notifications: true
    },
    security: {
      two_factor: false,
      session_timeout: 30,
      password_complexity: 'medium',
      login_attempts: 3
    },
    integrations: {
      google_maps: true,
      whatsapp: false,
      telegram: false,
      email_provider: 'smtp'
    },
    automation: {
      auto_routing: true,
      smart_scheduling: true,
      predictive_ordering: false,
      auto_invoicing: true
    }
  });

  const handleSave = () => {
    toast({
      title: "Configuración Guardada",
      description: "Los cambios han sido aplicados exitosamente"
    });
  };

  const handleExport = () => {
    toast({
      title: "Exportación Iniciada",
      description: "Los datos están siendo exportados en segundo plano"
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Configuración Avanzada del Sistema</h2>
        <p className="text-muted-foreground">
          Panel de control y configuración para administradores
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Seguridad</TabsTrigger>
          <TabsTrigger value="integrations">Integraciones</TabsTrigger>
          <TabsTrigger value="automation">Automatización</TabsTrigger>
          <TabsTrigger value="data">Datos</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuración General
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium">Nombre de la Empresa</label>
                  <Input defaultValue="RutaMOD Logistics" />
                </div>
                <div>
                  <label className="text-sm font-medium">Zona Horaria</label>
                  <Select defaultValue="america/argentina">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="america/argentina">Argentina (UTC-3)</SelectItem>
                      <SelectItem value="america/chile">Chile (UTC-3)</SelectItem>
                      <SelectItem value="america/uruguay">Uruguay (UTC-3)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium">Notificaciones</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Notificaciones por Email</span>
                    <Switch checked={settings.notifications.email_enabled} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Notificaciones SMS</span>
                    <Switch checked={settings.notifications.sms_enabled} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Push Notifications</span>
                    <Switch checked={settings.notifications.push_enabled} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Auto-notificaciones</span>
                    <Switch checked={settings.notifications.auto_notifications} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Configuración de Seguridad
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium">Tiempo de Sesión (minutos)</label>
                  <Input type="number" defaultValue="30" />
                </div>
                <div>
                  <label className="text-sm font-medium">Intentos de Login</label>
                  <Input type="number" defaultValue="3" />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">Autenticación de Dos Factores</span>
                    <p className="text-xs text-muted-foreground">Requiere verificación adicional</p>
                  </div>
                  <Switch />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Complejidad de Contraseña</label>
                  <Select defaultValue="medium">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baja</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Integraciones Externas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {[
                  { name: 'Google Maps API', enabled: true, status: 'Conectado' },
                  { name: 'WhatsApp Business', enabled: false, status: 'Desconectado' },
                  { name: 'Telegram Bot', enabled: false, status: 'Desconectado' },
                  { name: 'Mercado Pago', enabled: true, status: 'Conectado' },
                  { name: 'AFIP Facturación', enabled: true, status: 'Conectado' }
                ].map((integration, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{integration.name}</h4>
                      <Badge variant={integration.enabled ? 'default' : 'secondary'}>
                        {integration.status}
                      </Badge>
                    </div>
                    <Switch checked={integration.enabled} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Configuración de Automatización
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">Ruteo Automático</span>
                    <p className="text-xs text-muted-foreground">Optimización automática de rutas</p>
                  </div>
                  <Switch checked={settings.automation.auto_routing} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">Programación Inteligente</span>
                    <p className="text-xs text-muted-foreground">Asignación automática de horarios</p>
                  </div>
                  <Switch checked={settings.automation.smart_scheduling} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">Pedidos Predictivos</span>
                    <p className="text-xs text-muted-foreground">Predicción de demanda con IA</p>
                  </div>
                  <Switch checked={settings.automation.predictive_ordering} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">Facturación Automática</span>
                    <p className="text-xs text-muted-foreground">Generación automática de facturas</p>
                  </div>
                  <Switch checked={settings.automation.auto_invoicing} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Gestión de Datos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">Exportar Datos</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Exporta todos los datos del sistema
                    </p>
                    <Button className="w-full" onClick={handleExport}>
                      <Download className="h-4 w-4 mr-2" />
                      Exportar
                    </Button>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">Importar Datos</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Importa datos desde archivo CSV
                    </p>
                    <Button variant="outline" className="w-full">
                      <Upload className="h-4 w-4 mr-2" />
                      Importar
                    </Button>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">2,847</div>
                  <div className="text-sm text-muted-foreground">Registros Totales</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">145 MB</div>
                  <div className="text-sm text-muted-foreground">Tamaño de BD</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">99.9%</div>
                  <div className="text-sm text-muted-foreground">Uptime</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-4">
        <Button variant="outline">Cancelar</Button>
        <Button onClick={handleSave}>Guardar Configuración</Button>
      </div>
    </div>
  );
};