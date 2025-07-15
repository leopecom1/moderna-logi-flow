import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { CreateVehicleModal } from '@/components/forms/CreateVehicleModal';
import { Car, Search, Plus, Calendar, Shield, User, AlertTriangle } from 'lucide-react';

interface Vehicle {
  id: string;
  cadete_id: string;
  brand: string;
  model: string;
  year?: number;
  license_plate: string;
  color?: string;
  insurance_company?: string;
  insurance_policy?: string;
  insurance_expiry?: string;
  technical_inspection_expiry?: string;
  vehicle_type: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Cadete info
  cadete?: {
    full_name: string;
    phone?: string;
  };
}

export default function VehiculosPage() {
  const { profile } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      
      // Get vehicles with cadete information
      const { data: vehicles, error: vehiclesError } = await supabase
        .from('vehicles')
        .select(`
          *,
          cadete:profiles!vehicles_cadete_id_fkey(full_name, phone)
        `)
        .order('created_at', { ascending: false });

      if (vehiclesError) throw vehiclesError;

      setVehicles(vehicles || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los vehículos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.cadete?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No especificado';
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'activo':
        return 'bg-green-100 text-green-800';
      case 'inactivo':
        return 'bg-red-100 text-red-800';
      case 'mantenimiento':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getVehicleTypeIcon = (type: string) => {
    switch (type) {
      case 'motocicleta':
        return '🏍️';
      case 'auto':
        return '🚗';
      case 'camioneta':
        return '🚐';
      case 'bicicleta':
        return '🚴';
      default:
        return '🚗';
    }
  };

  const isExpiryNear = (dateString?: string) => {
    if (!dateString) return false;
    const expiryDate = new Date(dateString);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const isExpired = (dateString?: string) => {
    if (!dateString) return false;
    const expiryDate = new Date(dateString);
    const now = new Date();
    return expiryDate < now;
  };

  const canManageVehicles = profile?.role === 'gerencia';

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Car className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Vehículos</h1>
          </div>
        </div>
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Car className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Vehículos</h1>
        </div>
        {canManageVehicles && (
          <Button onClick={() => setShowCreateModal(true)} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Agregar Vehículo</span>
          </Button>
        )}
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar vehículos por patente, marca, modelo o cadete..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {filteredVehicles.map((vehicle) => (
          <Card key={vehicle.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <span className="text-2xl">{getVehicleTypeIcon(vehicle.vehicle_type)}</span>
                  <span>{vehicle.brand} {vehicle.model}</span>
                  {vehicle.year && <span className="text-muted-foreground">({vehicle.year})</span>}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(vehicle.status)}>
                    {vehicle.status}
                  </Badge>
                  {(isExpired(vehicle.insurance_expiry) || isExpired(vehicle.technical_inspection_expiry)) && (
                    <Badge variant="destructive">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Vencido
                    </Badge>
                  )}
                  {(isExpiryNear(vehicle.insurance_expiry) || isExpiryNear(vehicle.technical_inspection_expiry)) && (
                    <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Por vencer
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Car className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Patente</p>
                    <p className="text-sm text-muted-foreground font-mono">
                      {vehicle.license_plate}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Cadete</p>
                    <p className="text-sm text-muted-foreground">
                      {vehicle.cadete?.full_name || 'No asignado'}
                    </p>
                  </div>
                </div>

                {vehicle.color && (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: vehicle.color.toLowerCase() }} />
                    <div>
                      <p className="text-sm font-medium">Color</p>
                      <p className="text-sm text-muted-foreground">
                        {vehicle.color}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Seguro</p>
                    <p className="text-sm text-muted-foreground">
                      {vehicle.insurance_company || 'No especificado'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Vence Seguro</p>
                    <p className={`text-sm ${isExpired(vehicle.insurance_expiry) ? 'text-red-600' : isExpiryNear(vehicle.insurance_expiry) ? 'text-yellow-600' : 'text-muted-foreground'}`}>
                      {formatDate(vehicle.insurance_expiry)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Vence Técnica</p>
                    <p className={`text-sm ${isExpired(vehicle.technical_inspection_expiry) ? 'text-red-600' : isExpiryNear(vehicle.technical_inspection_expiry) ? 'text-yellow-600' : 'text-muted-foreground'}`}>
                      {formatDate(vehicle.technical_inspection_expiry)}
                    </p>
                  </div>
                </div>
              </div>

              {vehicle.notes && (
                <div className="pt-2 border-t">
                  <p className="text-sm font-medium">Notas</p>
                  <p className="text-sm text-muted-foreground">
                    {vehicle.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredVehicles.length === 0 && !loading && (
        <div className="text-center py-12">
          <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No se encontraron vehículos</h3>
          <p className="text-muted-foreground">
            {searchTerm ? 'No hay vehículos que coincidan con tu búsqueda.' : 'No hay vehículos registrados.'}
          </p>
        </div>
      )}

      <CreateVehicleModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onVehicleCreated={fetchVehicles}
      />
    </div>
  );
}