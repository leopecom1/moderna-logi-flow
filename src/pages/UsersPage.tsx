import { useState, useEffect } from 'react';
import { useAuth, UserRole } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Users, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { MainLayout } from '@/components/layout/MainLayout';
import { MessageLoading } from '@/components/ui/message-loading';

interface UserWithProfile {
  id: string;
  email: string;
  created_at: string;
  full_name?: string;
  role?: UserRole;
  is_active?: boolean;
}

const UsersPage = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, role, is_active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get user emails from auth
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) throw authError;

      const usersWithProfiles = authUsers.users.map(user => {
        const profile = data?.find(p => p.user_id === user.id);
        return {
          id: user.id,
          email: user.email!,
          created_at: user.created_at,
          full_name: profile?.full_name,
          role: profile?.role,
          is_active: profile?.is_active
        };
      });

      setUsers(usersWithProfiles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    setUpdating(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: userId,
          role: newRole,
          full_name: 'Usuario',
          is_active: true
        })
        .select();

      if (error) throw error;

      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));

      toast({
        title: "Éxito",
        description: "Rol actualizado correctamente",
      });
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el rol",
        variant: "destructive"
      });
    } finally {
      setUpdating(null);
    }
  };

  const getRoleBadgeVariant = (role?: UserRole) => {
    switch (role) {
      case 'gerencia': return 'default';
      case 'vendedor': return 'secondary';
      case 'cadete': return 'outline';
      default: return 'destructive';
    }
  };

  if (profile?.role !== 'gerencia') {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="w-96">
            <CardContent className="pt-6 text-center">
              <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-lg font-semibold mb-2">Acceso Denegado</h2>
              <p className="text-muted-foreground">
                Solo usuarios con rol 'gerencia' pueden acceder a esta página.
              </p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <MessageLoading />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-8 px-4">
      <div className="flex items-center gap-2 mb-8">
        <Users className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Administración de Usuarios</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gestionar Roles de Usuario</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium">{user.email}</p>
                      <p className="text-sm text-muted-foreground">
                        {user.full_name || 'Sin nombre'}
                      </p>
                    </div>
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {user.role || 'Sin rol'}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Select
                    value={user.role || ''}
                    onValueChange={(value: UserRole) => updateUserRole(user.id, value)}
                    disabled={updating === user.id}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Seleccionar rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cadete">Cadete</SelectItem>
                      <SelectItem value="vendedor">Vendedor</SelectItem>
                      <SelectItem value="gerencia">Gerencia</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {updating === user.id && (
                    <MessageLoading />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      </div>
    </MainLayout>
  );
};

export default UsersPage;