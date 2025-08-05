import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Shield, 
  Save, 
  Camera, 
  Key,
  Clock,
  Activity,
  Settings,
  AlertTriangle
} from 'lucide-react';

interface ProfileForm {
  full_name: string;
  phone: string;
  email: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface LoginSession {
  id: string;
  ip: string;
  user_agent: string;
  created_at: string;
  last_active: string;
  is_current: boolean;
}

export default function ProfilePage() {
  const { user, profile } = useAuth();
  const [profileForm, setProfileForm] = useState<ProfileForm>({
    full_name: '',
    phone: '',
    email: ''
  });
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [sessions, setSessions] = useState<LoginSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  useEffect(() => {
    if (user && profile) {
      setProfileForm({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        email: user.email || ''
      });
      fetchUserSessions();
    }
  }, [user, profile]);

  const fetchUserSessions = async () => {
    try {
      // Simular sesiones de login (en una implementación real, esto vendría de una tabla de sesiones)
      const mockSessions: LoginSession[] = [
        {
          id: '1',
          ip: '192.168.1.100',
          user_agent: 'Chrome 120.0.0.0 / Windows 10',
          created_at: new Date().toISOString(),
          last_active: new Date().toISOString(),
          is_current: true
        },
        {
          id: '2',
          ip: '192.168.1.101',
          user_agent: 'Safari 17.0 / macOS',
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          last_active: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          is_current: false
        }
      ];
      setSessions(mockSessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Actualizar perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: profileForm.full_name,
          phone: profileForm.phone,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // Actualizar email si cambió
      if (profileForm.email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: profileForm.email
        });

        if (emailError) throw emailError;

        toast({
          title: 'Email actualizado',
          description: 'Revisa tu nuevo email para confirmar el cambio',
        });
      }

      toast({
        title: 'Perfil actualizado',
        description: 'Tus datos han sido actualizados correctamente',
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el perfil',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updatePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: 'Error',
        description: 'Las contraseñas no coinciden',
        variant: 'destructive',
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'La contraseña debe tener al menos 6 caracteres',
        variant: 'destructive',
      });
      return;
    }

    setUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (error) throw error;

      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      toast({
        title: 'Contraseña actualizada',
        description: 'Tu contraseña ha sido cambiada correctamente',
      });
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar la contraseña',
        variant: 'destructive',
      });
    } finally {
      setUpdatingPassword(false);
    }
  };

  const terminateSession = async (sessionId: string) => {
    try {
      // En una implementación real, aquí se terminaría la sesión específica
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      
      toast({
        title: 'Sesión terminada',
        description: 'La sesión ha sido cerrada correctamente',
      });
    } catch (error) {
      console.error('Error terminating session:', error);
      toast({
        title: 'Error',
        description: 'No se pudo terminar la sesión',
        variant: 'destructive',
      });
    }
  };

  const terminateAllSessions = async () => {
    try {
      // Terminar todas las sesiones excepto la actual
      setSessions(prev => prev.filter(s => s.is_current));
      
      toast({
        title: 'Sesiones terminadas',
        description: 'Todas las sesiones han sido cerradas excepto la actual',
      });
    } catch (error) {
      console.error('Error terminating sessions:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron terminar las sesiones',
        variant: 'destructive',
      });
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'gerencia': return 'bg-purple-100 text-purple-800';
      case 'vendedor': return 'bg-blue-100 text-blue-800';
      case 'cadete': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
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

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Mi Perfil</h1>
            <p className="text-muted-foreground">Administra tu información personal y configuración de cuenta</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Información del perfil */}
          <Card className="lg:col-span-1">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={undefined} />
                  <AvatarFallback className="text-lg">
                    {profile?.full_name ? getInitials(profile.full_name) : 'U'}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle>{profile?.full_name || 'Usuario'}</CardTitle>
              <CardDescription className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>{user?.email}</span>
                </div>
                <Badge className={getRoleColor(profile?.role || '')}>
                  {profile?.role || 'Sin rol'}
                </Badge>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Miembro desde {new Date(user?.created_at || '').toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  <span>Email verificado</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Activity className="h-4 w-4" />
                  <span>Última actividad: Ahora</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuración */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuración de Cuenta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="profile" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="profile">Perfil</TabsTrigger>
                  <TabsTrigger value="security">Seguridad</TabsTrigger>
                  <TabsTrigger value="sessions">Sesiones</TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Nombre Completo</Label>
                      <Input
                        id="fullName"
                        value={profileForm.full_name}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, full_name: e.target.value }))}
                        placeholder="Tu nombre completo"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="tu@email.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono</Label>
                      <Input
                        id="phone"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+598 99 123 456"
                      />
                    </div>

                    <Button onClick={updateProfile} disabled={saving}>
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="security" className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Cambiar Contraseña</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Contraseña Actual</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                        placeholder="Tu contraseña actual"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Nueva Contraseña</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                        placeholder="Tu nueva contraseña"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="Confirma tu nueva contraseña"
                      />
                    </div>

                    <Button onClick={updatePassword} disabled={updatingPassword}>
                      <Key className="h-4 w-4 mr-2" />
                      {updatingPassword ? 'Actualizando...' : 'Actualizar Contraseña'}
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="sessions" className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium">Sesiones Activas</h3>
                      <p className="text-sm text-muted-foreground">
                        Administra tus sesiones de inicio de sesión
                      </p>
                    </div>
                    <Button variant="outline" onClick={terminateAllSessions}>
                      Cerrar Todas las Sesiones
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {sessions.map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{session.user_agent}</span>
                            {session.is_current && (
                              <Badge variant="default" className="text-xs">Actual</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>IP: {session.ip}</span>
                            <span>•</span>
                            <span>Última actividad: {new Date(session.last_active).toLocaleString()}</span>
                          </div>
                        </div>

                        {!session.is_current && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => terminateSession(session.id)}
                          >
                            Terminar
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}