import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { CreateCadeteModal } from '@/components/forms/CreateCadeteModal';
import { Users, Search, Plus, Phone, MapPin, Calendar, CreditCard } from 'lucide-react';
import { MessageLoading } from '@/components/ui/message-loading';

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
  // Profile info
  profile?: {
    full_name: string;
    phone?: string;
    role: string;
    is_active: boolean;
  };
}

export default function CadetesPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [cadetes, setCadetes] = useState<CadeteProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchCadetes();
  }, []);

  const fetchCadetes = async () => {
    try {
      setLoading(true);
      
      // First get all cadetes from profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'cadete')
        .order('full_name');

      if (profilesError) throw profilesError;

      // Then get their extended profiles
      const { data: cadeteProfiles, error: cadeteProfilesError } = await supabase
        .from('cadete_profiles')
        .select('*');

      if (cadeteProfilesError) throw cadeteProfilesError;

      // Combine the data
      const combinedData = profiles.map(profile => {
        const cadeteProfile = cadeteProfiles?.find(cp => cp.cadete_id === profile.user_id);
        return {
          ...cadeteProfile,
          id: cadeteProfile?.id || `temp-${profile.user_id}`,
          cadete_id: profile.user_id,
          profile: {
            full_name: profile.full_name,
            phone: profile.phone,
            role: profile.role,
            is_active: profile.is_active,
          }
        };
      });

      setCadetes(combinedData);
    } catch (error) {
      console.error('Error fetching cadetes:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los cadetes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredCadetes = cadetes.filter(cadete =>
    cadete.profile?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cadete.identification_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cadete.driver_license_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No especificado';
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const canManageCadetes = profile?.role === 'gerencia';

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
      <div className="">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Users className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Cadetes</h1>
          </div>
          {canManageCadetes && (
            <Button onClick={() => setShowCreateModal(true)} className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Agregar Cadete</span>
            </Button>
          )}
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cadetes por nombre, cédula o libreta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid gap-4">
          {filteredCadetes.map((cadete) => (
            <Card 
              key={cadete.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/cadetes/${cadete.cadete_id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{cadete.profile?.full_name}</CardTitle>
                  <Badge className={getStatusColor(cadete.profile?.is_active || false)}>
                    {cadete.profile?.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Cédula</p>
                      <p className="text-sm text-muted-foreground">
                        {cadete.identification_number || 'No especificado'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Teléfono</p>
                      <p className="text-sm text-muted-foreground">
                        {cadete.profile?.phone || 'No especificado'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Dirección</p>
                      <p className="text-sm text-muted-foreground">
                        {cadete.address || 'No especificado'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Libreta</p>
                      <p className="text-sm text-muted-foreground">
                        {cadete.driver_license_number || 'No especificado'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Vence Libreta</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(cadete.driver_license_expiry)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Contacto Emergencia</p>
                      <p className="text-sm text-muted-foreground">
                        {cadete.emergency_contact_name || 'No especificado'}
                      </p>
                    </div>
                  </div>
                </div>

                {cadete.health_insurance_company && (
                  <div className="pt-2 border-t">
                    <p className="text-sm font-medium">Seguro de Salud</p>
                    <p className="text-sm text-muted-foreground">
                      {cadete.health_insurance_company} - {cadete.health_insurance_number}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredCadetes.length === 0 && !loading && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No se encontraron cadetes</h3>
            <p className="text-muted-foreground">
              {searchTerm ? 'No hay cadetes que coincidan con tu búsqueda.' : 'No hay cadetes registrados.'}
            </p>
          </div>
        )}

        <CreateCadeteModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          onCadeteCreated={fetchCadetes}
        />
      </div>
    </MainLayout>
  );
}