import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth, UserRole } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Users, Search, UserCog } from 'lucide-react';

interface UserWithProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export const UserManagement = () => {
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          full_name,
          role,
          is_active,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get user emails from auth metadata
      const usersWithEmail = await Promise.all(
        data.map(async (profile) => {
          try {
            const { data: userData } = await supabase.auth.admin.getUserById(profile.user_id);
            return {
              id: profile.user_id,
              email: userData.user?.email || 'Sin email',
              full_name: profile.full_name,
              role: profile.role,
              is_active: profile.is_active,
              created_at: profile.created_at,
            };
          } catch {
            return {
              id: profile.user_id,
              email: 'Sin email',
              full_name: profile.full_name,
              role: profile.role,
              is_active: profile.is_active,
              created_at: profile.created_at,
            };
          }
        })
      );

      setUsers(usersWithEmail);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los usuarios',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      setUpdating(userId);
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      setUsers(prev => 
        prev.map(user => 
          user.id === userId ? { ...user, role: newRole } : user
        )
      );

      toast({
        title: 'Rol actualizado',
        description: 'El rol del usuario ha sido actualizado exitosamente',
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el rol del usuario',
        variant: 'destructive',
      });
    } finally {
      setUpdating(null);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      setUpdating(userId);
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('user_id', userId);

      if (error) throw error;

      setUsers(prev => 
        prev.map(user => 
          user.id === userId ? { ...user, is_active: !currentStatus } : user
        )
      );

      toast({
        title: 'Estado actualizado',
        description: `El usuario ha sido ${!currentStatus ? 'activado' : 'desactivado'}`,
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado del usuario',
        variant: 'destructive',
      });
    } finally {
      setUpdating(null);
    }
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'gerencia':
        return 'default';
      case 'vendedor':
        return 'secondary';
      case 'cadete':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getRoleDisplayName = (role: UserRole) => {
    switch (role) {
      case 'gerencia':
        return 'Gerencia';
      case 'vendedor':
        return 'Vendedor';
      case 'cadete':
        return 'Cadete';
      default:
        return role;
    }
  };

  const filteredUsers = users.filter(user =>
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Only show this component if user is gerencia
  if (profile?.role !== 'gerencia') {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <span>Gestión de Usuarios</span>
        </CardTitle>
        <CardDescription>
          Administra usuarios y permisos del sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar usuarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={fetchUsers} size="sm">
            Actualizar
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div>
                      <h4 className="font-medium">{user.full_name}</h4>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {getRoleDisplayName(user.role)}
                    </Badge>
                    <Badge variant={user.is_active ? "default" : "secondary"}>
                      {user.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Select
                    value={user.role}
                    onValueChange={(newRole: UserRole) => updateUserRole(user.id, newRole)}
                    disabled={updating === user.id}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cadete">Cadete</SelectItem>
                      <SelectItem value="vendedor">Vendedor</SelectItem>
                      <SelectItem value="gerencia">Gerencia</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleUserStatus(user.id, user.is_active)}
                    disabled={updating === user.id}
                  >
                    {user.is_active ? 'Desactivar' : 'Activar'}
                  </Button>
                </div>
              </div>
            ))}
            {filteredUsers.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No se encontraron usuarios
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};