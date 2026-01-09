import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { Settings, Save, Bell, Shield, Database, Building2, DollarSign, Megaphone } from 'lucide-react';
import { UserManagement } from '@/components/admin/UserManagement';
import { ConfigurationModal } from '@/components/forms/ConfigurationModal';
import { CurrencySyncModal } from '@/components/forms/CurrencySyncModal';
import { SystemUpdatesManager } from '@/components/admin/SystemUpdatesManager';
import { useAuth } from '@/hooks/useAuth';

const SettingsPage = () => {
  const { profile } = useAuth();
  const [showCurrencySync, setShowCurrencySync] = useState(false);
  const [settings, setSettings] = useState({
    companyName: 'LeoCommerce',
    email: 'hola@leocommerce.net',
    phone: '+54 9 342 123456',
    address: 'Santa Fe, Argentina',
    notifications: {
      newOrders: true,
      deliveryUpdates: true,
      paymentAlerts: true,
      systemUpdates: false,
    },
    system: {
      autoAssignRoutes: true,
      enableLocationTracking: true,
      requirePhotosOnDelivery: false,
      allowCashPayments: true,
    }
  });

  const handleSave = () => {
    toast({
      title: 'Configuración guardada',
      description: 'Los cambios han sido guardados exitosamente',
    });
  };

  const handleNotificationChange = (key: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value
      }
    }));
  };

  const handleSystemChange = (key: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      system: {
        ...prev.system,
        [key]: value
      }
    }));
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Configuración</h1>
          <p className="text-muted-foreground">Gestiona la configuración del sistema</p>
        </div>

        {/* Información de la Empresa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Información de la Empresa</span>
            </CardTitle>
            <CardDescription>
              Configura los datos básicos de tu empresa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Nombre de la Empresa</Label>
                <Input
                  id="companyName"
                  value={settings.companyName}
                  onChange={(e) => setSettings(prev => ({ ...prev, companyName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={settings.phone}
                  onChange={(e) => setSettings(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  value={settings.address}
                  onChange={(e) => setSettings(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notificaciones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Notificaciones</span>
            </CardTitle>
            <CardDescription>
              Configura qué notificaciones deseas recibir
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Nuevos Pedidos</Label>
                <p className="text-sm text-muted-foreground">
                  Recibir notificaciones cuando se registren nuevos pedidos
                </p>
              </div>
              <Switch
                checked={settings.notifications.newOrders}
                onCheckedChange={(checked) => handleNotificationChange('newOrders', checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Actualizaciones de Entrega</Label>
                <p className="text-sm text-muted-foreground">
                  Notificar cuando cambien los estados de las entregas
                </p>
              </div>
              <Switch
                checked={settings.notifications.deliveryUpdates}
                onCheckedChange={(checked) => handleNotificationChange('deliveryUpdates', checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Alertas de Pago</Label>
                <p className="text-sm text-muted-foreground">
                  Recibir alertas sobre pagos pendientes y completados
                </p>
              </div>
              <Switch
                checked={settings.notifications.paymentAlerts}
                onCheckedChange={(checked) => handleNotificationChange('paymentAlerts', checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Actualizaciones del Sistema</Label>
                <p className="text-sm text-muted-foreground">
                  Notificar sobre actualizaciones y mantenimiento del sistema
                </p>
              </div>
              <Switch
                checked={settings.notifications.systemUpdates}
                onCheckedChange={(checked) => handleNotificationChange('systemUpdates', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Configuración del Sistema */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>Sistema</span>
            </CardTitle>
            <CardDescription>
              Configuraciones avanzadas del sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Asignación Automática de Rutas</Label>
                <p className="text-sm text-muted-foreground">
                  Asignar automáticamente entregas a rutas optimizadas
                </p>
              </div>
              <Switch
                checked={settings.system.autoAssignRoutes}
                onCheckedChange={(checked) => handleSystemChange('autoAssignRoutes', checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Seguimiento de Ubicación</Label>
                <p className="text-sm text-muted-foreground">
                  Habilitar seguimiento GPS de los cadetes
                </p>
              </div>
              <Switch
                checked={settings.system.enableLocationTracking}
                onCheckedChange={(checked) => handleSystemChange('enableLocationTracking', checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Fotos Obligatorias en Entrega</Label>
                <p className="text-sm text-muted-foreground">
                  Requerir foto de comprobante al completar entregas
                </p>
              </div>
              <Switch
                checked={settings.system.requirePhotosOnDelivery}
                onCheckedChange={(checked) => handleSystemChange('requirePhotosOnDelivery', checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Permitir Pagos en Efectivo</Label>
                <p className="text-sm text-muted-foreground">
                  Habilitar la opción de cobro en efectivo
                </p>
              </div>
              <Switch
                checked={settings.system.allowCashPayments}
                onCheckedChange={(checked) => handleSystemChange('allowCashPayments', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Sincronización de Cotizaciones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <span>Cotizaciones de Monedas</span>
            </CardTitle>
            <CardDescription>
              Sincroniza las cotizaciones del dólar desde DolarAPI Uruguay
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              <p className="text-sm text-muted-foreground">
                Mantén actualizada la cotización del dólar para calcular márgenes correctamente cuando las compras sean en USD y las ventas en UYU.
              </p>
              <Button 
                onClick={() => setShowCurrencySync(true)}
                className="w-fit"
                variant="outline"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Gestionar Cotizaciones
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Configuración de Datos Maestros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5" />
              <span>Datos Maestros</span>
            </CardTitle>
            <CardDescription>
              Gestiona categorías, marcas, proveedores y sucursales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ConfigurationModal />
          </CardContent>
        </Card>

        {/* Gestión de Novedades - Solo Gerencia */}
        {profile?.role === 'gerencia' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Megaphone className="h-5 w-5" />
                <span>Novedades del Sistema</span>
              </CardTitle>
              <CardDescription>
                Crea y gestiona las novedades que verán todos los usuarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SystemUpdatesManager />
            </CardContent>
          </Card>
        )}

        {/* Gestión de Usuarios */}
        <UserManagement />

        {/* Seguridad */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Seguridad</span>
            </CardTitle>
            <CardDescription>
              Configuraciones de seguridad y acceso
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full">
              Cambiar Contraseña
            </Button>
            <Button variant="outline" className="w-full">
              Configurar Autenticación de Dos Factores
            </Button>
            <Button variant="outline" className="w-full">
              Ver Sesiones Activas
            </Button>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} className="flex items-center space-x-2">
            <Save className="h-4 w-4" />
            <span>Guardar Configuración</span>
          </Button>
        </div>

        {/* Modal de Sincronización de Cotizaciones */}
        <CurrencySyncModal 
          open={showCurrencySync}
          onOpenChange={setShowCurrencySync}
        />
      </div>
    </MainLayout>
  );
};

export default SettingsPage;