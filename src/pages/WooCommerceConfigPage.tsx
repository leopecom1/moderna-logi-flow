import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Store, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function WooCommerceConfigPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const [showSecrets, setShowSecrets] = useState(false);

  const [formData, setFormData] = useState({
    store_url: '',
    consumer_key: '',
    consumer_secret: '',
    sync_enabled: true,
    default_branch_id: '',
    default_warehouse_id: '',
    default_requiere_armado: false,
    auto_assign_to_route: false,
  });

  // Fetch existing config
  const { data: config, isLoading } = useQuery({
    queryKey: ['woocommerce-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('woocommerce_config')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  // Fetch branches and warehouses for selects
  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branches')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('warehouses')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Set form data when config loads
  useEffect(() => {
    if (config) {
      setFormData({
        store_url: config.store_url,
        consumer_key: config.consumer_key,
        consumer_secret: config.consumer_secret,
        sync_enabled: config.sync_enabled,
        default_branch_id: config.default_branch_id || '',
        default_warehouse_id: config.default_warehouse_id || '',
        default_requiere_armado: config.default_requiere_armado || false,
        auto_assign_to_route: config.auto_assign_to_route || false,
      });
    }
  }, [config]);

  // Save/Update config
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.user_id) throw new Error('Usuario no autenticado');

      const configData = {
        ...formData,
        created_by: profile.user_id,
      };

      if (config?.id) {
        // Update existing
        const { error } = await supabase
          .from('woocommerce_config')
          .update(configData)
          .eq('id', config.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('woocommerce_config')
          .insert([configData]);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['woocommerce-config'] });
      toast({
        title: 'Configuración guardada',
        description: 'La configuración de WooCommerce se guardó correctamente.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Test connection
  const testMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(
        `${formData.store_url}/wp-json/wc/v3/system_status`,
        {
          headers: {
            Authorization: `Basic ${btoa(`${formData.consumer_key}:${formData.consumer_secret}`)}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('No se pudo conectar con la tienda WooCommerce');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Conexión exitosa',
        description: 'La conexión con WooCommerce funciona correctamente.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error de conexión',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate();
  };

  const handleTestConnection = () => {
    if (!formData.store_url || !formData.consumer_key || !formData.consumer_secret) {
      toast({
        title: 'Campos incompletos',
        description: 'Por favor completa todos los campos antes de probar la conexión.',
        variant: 'destructive',
      });
      return;
    }
    testMutation.mutate();
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Store className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Tienda Online</h1>
              <p className="text-muted-foreground">
                Configura la conexión con tu tienda WooCommerce
              </p>
            </div>
          </div>
          
          {config ? (
            <Badge variant="default" className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Configuración activa
            </Badge>
          ) : (
            <Badge variant="secondary" className="flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Sin configurar
            </Badge>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Configuración de WooCommerce</CardTitle>
            <CardDescription>
              Los pedidos de WooCommerce se sincronizarán automáticamente con /orders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="store_url">URL de la Tienda</Label>
                <Input
                  id="store_url"
                  type="url"
                  placeholder="https://tu-tienda.com"
                  value={formData.store_url}
                  onChange={(e) =>
                    setFormData({ ...formData, store_url: e.target.value })
                  }
                  required
                />
                <p className="text-sm text-muted-foreground">
                  La URL completa de tu tienda WooCommerce (incluyendo https://)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="consumer_key">Consumer Key</Label>
                <div className="relative">
                  <Input
                    id="consumer_key"
                    type={showSecrets ? 'text' : 'password'}
                    placeholder="ck_..."
                    value={formData.consumer_key}
                    onChange={(e) =>
                      setFormData({ ...formData, consumer_key: e.target.value })
                    }
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0"
                    onClick={() => setShowSecrets(!showSecrets)}
                  >
                    {showSecrets ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="consumer_secret">Consumer Secret</Label>
                <Input
                  id="consumer_secret"
                  type={showSecrets ? 'text' : 'password'}
                  placeholder="cs_..."
                  value={formData.consumer_secret}
                  onChange={(e) =>
                    setFormData({ ...formData, consumer_secret: e.target.value })
                  }
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Genera estas credenciales en WooCommerce → Ajustes → Avanzado → API REST
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="sync_enabled"
                  checked={formData.sync_enabled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, sync_enabled: checked })
                  }
                />
                <Label htmlFor="sync_enabled" className="cursor-pointer">
                  Sincronización automática de pedidos
                </Label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="default_branch_id">Sucursal por defecto</Label>
                  <Select
                    value={formData.default_branch_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, default_branch_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar sucursal" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches?.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Los pedidos de WooCommerce se asignarán a esta sucursal
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="default_warehouse_id">Depósito por defecto</Label>
                  <Select
                    value={formData.default_warehouse_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, default_warehouse_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar depósito" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses?.map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>
                          {warehouse.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Los productos se asignarán a este depósito
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="default_requiere_armado"
                    checked={formData.default_requiere_armado}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, default_requiere_armado: checked })
                    }
                  />
                  <Label htmlFor="default_requiere_armado" className="cursor-pointer">
                    Los pedidos online requieren armado por defecto
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="auto_assign_to_route"
                    checked={formData.auto_assign_to_route}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, auto_assign_to_route: checked })
                    }
                  />
                  <Label htmlFor="auto_assign_to_route" className="cursor-pointer">
                    Asignar automáticamente a rutas
                  </Label>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={testMutation.isPending}
                >
                  {testMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Probar Conexión
                </Button>

                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Guardar Configuración
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Paso 1: Configurar API REST</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Accede a tu panel de administración de WooCommerce</li>
              <li>Ve a <strong>WooCommerce → Ajustes → Avanzado → API REST</strong></li>
              <li>Haz clic en "Añadir clave"</li>
              <li>Dale un nombre descriptivo (ej: "Moderna Integration")</li>
              <li>Selecciona permisos de <strong>"Lectura/Escritura"</strong></li>
              <li>Genera la clave y copia el Consumer Key y Consumer Secret</li>
              <li>Pega las credenciales en los campos de arriba y guarda</li>
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Paso 2: Configurar Webhook para Sincronización</CardTitle>
            <CardDescription>
              Los pedidos se sincronizarán automáticamente cuando configures este webhook
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>En tu panel de WooCommerce, ve a <strong>WooCommerce → Ajustes → Avanzado → Webhooks</strong></li>
              <li>Haz clic en "Añadir webhook"</li>
              <li>Completa los siguientes campos:</li>
            </ol>
            
            <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
              <div>
                <Label className="text-xs">Nombre</Label>
                <p className="text-sm font-mono">Moderna Orders Sync</p>
              </div>
              <div>
                <Label className="text-xs">Estado</Label>
                <p className="text-sm font-mono">Activo</p>
              </div>
              <div>
                <Label className="text-xs">Tema</Label>
                <p className="text-sm font-mono">Order created</p>
              </div>
              <div>
                <Label className="text-xs">URL de entrega</Label>
                <p className="text-sm font-mono break-all">
                  https://ndusxjrjrjpauuqeruzg.supabase.co/functions/v1/woocommerce-webhook
                </p>
              </div>
              <div>
                <Label className="text-xs">Versión de API</Label>
                <p className="text-sm font-mono">WP REST API Integration v3</p>
              </div>
            </div>

            <div className="mt-4 text-sm">
              <p className="font-semibold">Repite el proceso creando webhooks adicionales para:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                <li>Order updated (para actualizar el estado)</li>
                <li>Order deleted (opcional)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
