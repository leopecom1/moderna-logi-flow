import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Users, Phone, Mail, MapPin } from 'lucide-react';
import { CreateCustomerModal } from '@/components/forms/CreateCustomerModal';
import { toast } from '@/hooks/use-toast';

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string;
  neighborhood: string | null;
  city: string;
  departamento: string | null;
  notes: string | null;
  cedula_identidad: string | null;
  margen: number | null;
  created_at: string;
}

export const CustomersPage = () => {
  const { profile } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const canManageCustomers = profile?.role === 'gerencia' || profile?.role === 'vendedor';

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los clientes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm) ||
    customer.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Cargando clientes...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center space-x-2">
            <Users className="h-8 w-8" />
            <span>Clientes</span>
          </h1>
          <p className="text-muted-foreground">
            Gestiona la información de tus clientes
          </p>
        </div>
        {canManageCustomers && (
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Cliente
          </Button>
        )}
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar clientes por nombre, email, teléfono o dirección..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((customer) => (
          <Card key={customer.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{customer.name}</span>
                <Badge variant="secondary">{customer.departamento || 'Sin depto'}</Badge>
              </CardTitle>
              <CardDescription>{customer.city}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{customer.address}</span>
              </div>
              {customer.neighborhood && (
                <div className="text-sm text-muted-foreground">
                  Barrio: {customer.neighborhood}
                </div>
              )}
              {customer.phone && (
                <div className="flex items-center space-x-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{customer.phone}</span>
                </div>
              )}
              {customer.email && (
                <div className="flex items-center space-x-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{customer.email}</span>
                </div>
              )}
              {customer.cedula_identidad && (
                <div className="text-sm text-muted-foreground">
                  <strong>CI:</strong> {customer.cedula_identidad}
                </div>
              )}
              {customer.margen && (
                <div className="text-sm text-muted-foreground">
                  <strong>Margen:</strong> {customer.margen}%
                </div>
              )}
              {customer.notes && (
                <div className="text-sm text-muted-foreground">
                  <strong>Notas:</strong> {customer.notes}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCustomers.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">No se encontraron clientes</h3>
          <p className="text-muted-foreground">
            {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Comienza agregando tu primer cliente'}
          </p>
        </div>
      )}

      <CreateCustomerModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onCustomerCreated={fetchCustomers}
      />
    </div>
  );
};