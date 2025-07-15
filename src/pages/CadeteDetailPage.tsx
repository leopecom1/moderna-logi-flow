import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  CreditCard,
  Heart,
  Building,
  DollarSign,
  AlertTriangle,
  Car,
  FileText
} from 'lucide-react';

interface CadeteProfile {
  id: string;
  cadete_id: string;
  driver_license_number?: string;
  driver_license_category?: string;
  driver_license_expiry?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  health_insurance_company?: string;
  health_insurance_number?: string;
  address?: string;
  neighborhood?: string;
  city?: string;
  departamento?: string;
  bank_account_number?: string;
  bank_name?: string;
  date_of_birth?: string;
  identification_number?: string;
  marital_status?: string;
  profile?: {
    full_name: string;
    phone?: string;
    role: string;
    is_active: boolean;
  };
}

export default function CadeteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cadete, setCadete] = useState<CadeteProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchCadeteDetail();
    }
  }, [id]);

  const fetchCadeteDetail = async () => {
    try {
      setLoading(true);
      
      // Get cadete profile
      const { data: cadeteProfile, error: cadeteError } = await supabase
        .from('cadete_profiles')
        .select('*')
        .eq('cadete_id', id)
        .single();

      if (cadeteError) throw cadeteError;

      // Get user profile
      const { data: userProfile, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', id)
        .single();

      if (userError) throw userError;

      const combinedData = {
        ...cadeteProfile,
        profile: {
          full_name: userProfile.full_name,
          phone: userProfile.phone,
          role: userProfile.role,
          is_active: userProfile.is_active,
        }
      };

      setCadete(combinedData);
    } catch (error) {
      console.error('Error fetching cadete detail:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar la información del cadete',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No especificado';
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="">
          <div className="flex items-center space-x-4 mb-6">
            <Skeleton className="h-10 w-10 rounded-md" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!cadete) {
    return (
      <MainLayout>
        <div className="">
          <div className="text-center py-12">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Cadete no encontrado</h3>
            <p className="text-muted-foreground mb-4">
              No se pudo encontrar la información del cadete solicitado.
            </p>
            <Button onClick={() => navigate('/cadetes')}>
              Volver a Cadetes
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="">
        <div className="flex items-center space-x-4 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/cadetes')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold">{cadete.profile?.full_name}</h1>
              <Badge className={getStatusColor(cadete.profile?.is_active || false)}>
                {cadete.profile?.is_active ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
            <p className="text-muted-foreground">Información detallada del cadete</p>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Información Personal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Información Personal</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nombre Completo</p>
                  <p className="text-sm">{cadete.profile?.full_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Cédula</p>
                  <p className="text-sm">{cadete.identification_number || 'No especificado'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Fecha de Nacimiento</p>
                  <p className="text-sm">{formatDate(cadete.date_of_birth)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Estado Civil</p>
                  <p className="text-sm">{cadete.marital_status || 'No especificado'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información de Contacto */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Phone className="h-5 w-5" />
                <span>Contacto</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Teléfono</p>
                  <p className="text-sm">{cadete.profile?.phone || 'No especificado'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Dirección</p>
                  <p className="text-sm">{cadete.address || 'No especificado'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Barrio</p>
                  <p className="text-sm">{cadete.neighborhood || 'No especificado'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ciudad</p>
                  <p className="text-sm">{cadete.city || 'No especificado'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Departamento</p>
                  <p className="text-sm">{cadete.departamento || 'No especificado'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Libreta de Conducir */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Car className="h-5 w-5" />
                <span>Libreta de Conducir</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Número de Libreta</p>
                  <p className="text-sm">{cadete.driver_license_number || 'No especificado'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Categoría</p>
                  <p className="text-sm">{cadete.driver_license_category || 'No especificado'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Fecha de Vencimiento</p>
                  <p className="text-sm">{formatDate(cadete.driver_license_expiry)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contacto de Emergencia */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5" />
                <span>Contacto de Emergencia</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nombre</p>
                  <p className="text-sm">{cadete.emergency_contact_name || 'No especificado'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Teléfono</p>
                  <p className="text-sm">{cadete.emergency_contact_phone || 'No especificado'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Relación</p>
                  <p className="text-sm">{cadete.emergency_contact_relation || 'No especificado'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seguro de Salud */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Heart className="h-5 w-5" />
                <span>Seguro de Salud</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Compañía</p>
                  <p className="text-sm">{cadete.health_insurance_company || 'No especificado'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Número de Póliza</p>
                  <p className="text-sm">{cadete.health_insurance_number || 'No especificado'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información Bancaria */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5" />
                <span>Información Bancaria</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Banco</p>
                  <p className="text-sm">{cadete.bank_name || 'No especificado'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Número de Cuenta</p>
                  <p className="text-sm">{cadete.bank_account_number || 'No especificado'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}