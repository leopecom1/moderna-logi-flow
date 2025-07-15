import { useState } from 'react';
import { useAuth, UserRole } from '@/hooks/useAuth';
import { SignInPage } from '@/components/ui/sign-in';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Truck, User, Users, Crown } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export const AuthPage = () => {
  const { signIn, signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [signupForm, setSignupForm] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'cadete' as UserRole
  });

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        toast({
          title: "Error de autenticación",
          description: error.message,
          variant: "destructive"
        });
      } else {
        window.location.href = '/';
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { error } = await signUp(
        signupForm.email,
        signupForm.password,
        signupForm.fullName,
        signupForm.role
      );
      
      if (error) {
        toast({
          title: "Error de registro",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "¡Registro exitoso!",
          description: "Revisa tu email para confirmar tu cuenta",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'gerencia':
        return <Crown className="h-4 w-4" />;
      case 'vendedor':
        return <Users className="h-4 w-4" />;
      case 'cadete':
        return <Truck className="h-4 w-4" />;
    }
  };

  const testimonials: never[] = []; // Sin testimoniales

  if (showSignup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                <Truck className="h-6 w-6 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">MODERNA</CardTitle>
            <CardDescription>Sistema de Logística - Registro</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nombre Completo</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Tu nombre completo"
                  value={signupForm.fullName}
                  onChange={(e) => setSignupForm(prev => ({ ...prev, fullName: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="tu@email.com"
                  value={signupForm.email}
                  onChange={(e) => setSignupForm(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Contraseña</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="Tu contraseña"
                  value={signupForm.password}
                  onChange={(e) => setSignupForm(prev => ({ ...prev, password: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Rol</Label>
                <Select 
                  value={signupForm.role} 
                  onValueChange={(value: UserRole) => setSignupForm(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tu rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cadete">
                      <div className="flex items-center gap-2">
                        {getRoleIcon('cadete')}
                        <span>Cadete</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="vendedor">
                      <div className="flex items-center gap-2">
                        {getRoleIcon('vendedor')}
                        <span>Vendedor</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="gerencia">
                      <div className="flex items-center gap-2">
                        {getRoleIcon('gerencia')}
                        <span>Gerencia</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Registrando...' : 'Registrarse'}
              </Button>
              <Button 
                type="button" 
                variant="outline"
                className="w-full"
                onClick={() => setShowSignup(false)}
              >
                Volver al Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <SignInPage
      title={
        <div className="flex flex-col items-center gap-4">
          <img 
            src="/lovable-uploads/629c5c32-2f75-4980-89b7-b7666a341b25.png" 
            alt="RutaMOD Logo" 
            className="h-16 w-auto object-contain"
          />
        </div>
      }
      description="Sistema de Logística - Accede a tu cuenta para continuar"
      heroImageSrc="https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=2160&q=80"
      testimonials={testimonials}
      onSignIn={handleSignIn}
      onResetPassword={() => {
        toast({
          title: "Recuperar contraseña",
          description: "Funcionalidad por implementar",
        });
      }}
      onCreateAccount={() => setShowSignup(true)}
    />
  );
};