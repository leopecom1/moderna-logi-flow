import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { Shield, Save } from 'lucide-react';

interface RolePermission {
  id: string;
  role: UserRole;
  permission_key: string;
  permission_name: string;
  is_enabled: boolean;
}

export const RolePermissionsConfig = () => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('cadete');
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPermissions();
  }, [selectedRole]);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*')
        .eq('role', selectedRole)
        .order('permission_name');

      if (error) throw error;
      setPermissions(data || []);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los permisos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePermission = async (permissionId: string, isEnabled: boolean) => {
    try {
      const { error } = await supabase
        .from('role_permissions')
        .update({ is_enabled: isEnabled })
        .eq('id', permissionId);

      if (error) throw error;

      setPermissions(prev =>
        prev.map(permission =>
          permission.id === permissionId
            ? { ...permission, is_enabled: isEnabled }
            : permission
        )
      );
    } catch (error) {
      console.error('Error updating permission:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el permiso',
        variant: 'destructive',
      });
    }
  };

  const saveAllPermissions = async () => {
    try {
      setSaving(true);
      
      const updates = permissions.map(permission => ({
        id: permission.id,
        is_enabled: permission.is_enabled
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('role_permissions')
          .update({ is_enabled: update.is_enabled })
          .eq('id', update.id);

        if (error) throw error;
      }

      toast({
        title: 'Permisos guardados',
        description: `Los permisos para el rol ${getRoleDisplayName(selectedRole)} han sido actualizados`,
      });
    } catch (error) {
      console.error('Error saving permissions:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron guardar todos los permisos',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getRoleDisplayName = (role: UserRole) => {
    switch (role) {
      case 'cadete':
        return 'Cadete';
      case 'vendedor':
        return 'Vendedor';
      case 'gerencia':
        return 'Gerencia';
      default:
        return role;
    }
  };

  const toggleAllPermissions = (enabled: boolean) => {
    setPermissions(prev =>
      prev.map(permission => ({ ...permission, is_enabled: enabled }))
    );
  };

  const enabledCount = permissions.filter(p => p.is_enabled).length;
  const totalCount = permissions.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <span>Configuración de Permisos por Rol</span>
        </CardTitle>
        <CardDescription>
          Configura qué opciones del sistema puede acceder cada rol
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <label className="text-sm font-medium">Seleccionar Rol</label>
            <Select value={selectedRole} onValueChange={(value: UserRole) => setSelectedRole(value)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cadete">Cadete</SelectItem>
                <SelectItem value="vendedor">Vendedor</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="text-sm text-muted-foreground">
            {enabledCount} de {totalCount} permisos habilitados
          </div>
        </div>

        <Separator />

        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleAllPermissions(true)}
          >
            Habilitar Todos
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleAllPermissions(false)}
          >
            Deshabilitar Todos
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {permissions.map((permission) => (
                <div
                  key={permission.id}
                  className="flex items-center space-x-3 p-3 border rounded-lg"
                >
                  <Checkbox
                    id={permission.id}
                    checked={permission.is_enabled}
                    onCheckedChange={(checked) =>
                      updatePermission(permission.id, checked as boolean)
                    }
                  />
                  <label
                    htmlFor={permission.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {permission.permission_name}
                  </label>
                </div>
              ))}
            </div>

            {permissions.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No hay permisos configurados para este rol
              </p>
            )}
          </div>
        )}

        <Separator />

        <div className="flex justify-end">
          <Button
            onClick={saveAllPermissions}
            disabled={saving}
            className="flex items-center space-x-2"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Guardando...' : 'Guardar Permisos'}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};