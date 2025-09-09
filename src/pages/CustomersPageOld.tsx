import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Users, Phone, Mail, MapPin, Eye, Upload, Trash2, Edit } from 'lucide-react';
import { CreateCustomerModal } from '@/components/forms/CreateCustomerModal';
import { EditCustomerModal } from '@/components/forms/EditCustomerModal';
import { ImportMovementsModal } from '@/components/forms/ImportMovementsModal';
import { DeleteCustomerModal } from '@/components/forms/DeleteCustomerModal';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

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

import { MainLayout } from '@/components/layout/MainLayout';

export const CustomersPage = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);

  const canManageCustomers = profile?.role === 'gerencia' || profile?.role === 'vendedor';
  const canDeleteCustomers = profile?.role === 'gerencia';

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

  const handleDeleteCustomer = (customer: Customer) => {
    setCustomerToDelete(customer);
    setShowDeleteModal(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setCustomerToEdit(customer);
    setShowEditModal(true);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="text-center">Cargando clientes...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
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
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setShowImportModal(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Importar Excel
            </Button>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Cliente
            </Button>
          </div>
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
            <div className="p-4 pt-0">
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate(`/customers/${customer.id}`)}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Historial
                </Button>
                {canManageCustomers && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleEditCustomer(customer)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
                {canDeleteCustomers && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDeleteCustomer(customer)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
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

      <EditCustomerModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        customer={customerToEdit}
        onCustomerUpdated={fetchCustomers}
      />

      <ImportMovementsModal
        open={showImportModal}
        onOpenChange={setShowImportModal}
        onImportComplete={fetchCustomers}
      />

      <DeleteCustomerModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        customer={customerToDelete}
        onCustomerDeleted={fetchCustomers}
      />
    </MainLayout>
  );
};