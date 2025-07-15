import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { GooglePlacesAutocomplete } from '@/components/ui/google-places-autocomplete';
import { UserPlus } from 'lucide-react';

const DEPARTAMENTOS_URUGUAY = [
  'Artigas', 'Canelones', 'Cerro Largo', 'Colonia', 'Durazno', 'Flores',
  'Florida', 'Lavalleja', 'Maldonado', 'Montevideo', 'Paysandú', 'Río Negro',
  'Rivera', 'Rocha', 'Salto', 'San José', 'Soriano', 'Tacuarembó', 'Treinta y Tres'
];

const MARITAL_STATUS = [
  'Soltero/a', 'Casado/a', 'Divorciado/a', 'Viudo/a', 'Concubinato'
];

const DRIVER_LICENSE_CATEGORIES = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G'
];

interface CreateCadeteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCadeteCreated: () => void;
}

export const CreateCadeteModal = ({ open, onOpenChange, onCadeteCreated }: CreateCadeteModalProps) => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Profile data
    full_name: '',
    phone: '',
    email: '',
    password: '',
    // Extended profile data
    driver_license_number: '',
    driver_license_category: '',
    driver_license_expiry: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relation: '',
    health_insurance_company: '',
    health_insurance_number: '',
    address: '',
    neighborhood: '',
    city: 'Montevideo',
    departamento: '',
    bank_account_number: '',
    bank_name: '',
    date_of_birth: '',
    identification_number: '',
    marital_status: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;

    try {
      setLoading(true);

      // Call the edge function to create the cadete
      const { data, error } = await supabase.functions.invoke('create-cadete', {
        body: {
          cadeteData: {
            email: formData.email,
            password: formData.password,
            full_name: formData.full_name,
            phone: formData.phone,
            driver_license_number: formData.driver_license_number,
            driver_license_category: formData.driver_license_category,
            driver_license_expiry: formData.driver_license_expiry,
            emergency_contact_name: formData.emergency_contact_name,
            emergency_contact_phone: formData.emergency_contact_phone,
            emergency_contact_relation: formData.emergency_contact_relation,
            health_insurance_company: formData.health_insurance_company,
            health_insurance_number: formData.health_insurance_number,
            address: formData.address,
            neighborhood: formData.neighborhood,
            city: formData.city,
            departamento: formData.departamento,
            bank_account_number: formData.bank_account_number,
            bank_name: formData.bank_name,
            date_of_birth: formData.date_of_birth,
            identification_number: formData.identification_number,
            marital_status: formData.marital_status,
          }
        }
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: 'Cadete creado',
        description: 'El cadete ha sido creado exitosamente',
      });

      onCadeteCreated();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error creating cadete:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear el cadete',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      phone: '',
      email: '',
      password: '',
      driver_license_number: '',
      driver_license_category: '',
      driver_license_expiry: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      emergency_contact_relation: '',
      health_insurance_company: '',
      health_insurance_number: '',
      address: '',
      neighborhood: '',
      city: 'Montevideo',
      departamento: '',
      bank_account_number: '',
      bank_name: '',
      date_of_birth: '',
      identification_number: '',
      marital_status: '',
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    // Prevent closing when clicking on Google Places autocomplete
    if (!newOpen) {
      // Check if there's an active Google Places dropdown
      const isGooglePlacesClick = document.querySelector('.pac-container:hover') !== null;
      
      // Also check if any pac-container elements exist (more robust)
      const pacContainers = document.querySelectorAll('.pac-container');
      const hasVisiblePacContainer = Array.from(pacContainers).some(container => {
        const style = window.getComputedStyle(container);
        return style.display !== 'none' && style.visibility !== 'hidden';
      });
      
      if (isGooglePlacesClick || hasVisiblePacContainer) {
        return;
      }
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <UserPlus className="h-5 w-5" />
            <span>Agregar Nuevo Cadete</span>
          </DialogTitle>
          <DialogDescription>
            Completa la información personal y laboral del cadete
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Básica */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Información Básica</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nombre Completo *</Label>
                <Input
                  id="full_name"
                  placeholder="Nombre completo"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="identification_number">Cédula de Identidad *</Label>
                <Input
                  id="identification_number"
                  placeholder="1.234.567-8"
                  value={formData.identification_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, identification_number: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono *</Label>
                <Input
                  id="phone"
                  placeholder="099 123 456"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="cadete@ejemplo.com"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Contraseña temporal"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Fecha de Nacimiento</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="marital_status">Estado Civil</Label>
                <Select value={formData.marital_status} onValueChange={(value) => setFormData(prev => ({ ...prev, marital_status: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado civil" />
                  </SelectTrigger>
                  <SelectContent>
                    {MARITAL_STATUS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Dirección */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Dirección</h3>
            
            <div className="space-y-2">
              <Label htmlFor="address">Dirección *</Label>
              <GooglePlacesAutocomplete
                value={formData.address}
                onChange={(value) => setFormData(prev => ({ ...prev, address: value }))}
                placeholder="Dirección completa"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="neighborhood">Barrio</Label>
                <Input
                  id="neighborhood"
                  placeholder="Barrio"
                  value={formData.neighborhood}
                  onChange={(e) => setFormData(prev => ({ ...prev, neighborhood: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Ciudad</Label>
                <Input
                  id="city"
                  placeholder="Ciudad"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="departamento">Departamento</Label>
                <Select value={formData.departamento} onValueChange={(value) => setFormData(prev => ({ ...prev, departamento: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTAMENTOS_URUGUAY.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Libreta de Conducir */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Libreta de Conducir</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="driver_license_number">Número de Libreta</Label>
                <Input
                  id="driver_license_number"
                  placeholder="123456"
                  value={formData.driver_license_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, driver_license_number: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="driver_license_category">Categoría</Label>
                <Select value={formData.driver_license_category} onValueChange={(value) => setFormData(prev => ({ ...prev, driver_license_category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {DRIVER_LICENSE_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="driver_license_expiry">Fecha de Vencimiento</Label>
                <Input
                  id="driver_license_expiry"
                  type="date"
                  value={formData.driver_license_expiry}
                  onChange={(e) => setFormData(prev => ({ ...prev, driver_license_expiry: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Contacto de Emergencia */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contacto de Emergencia</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergency_contact_name">Nombre</Label>
                <Input
                  id="emergency_contact_name"
                  placeholder="Nombre del contacto"
                  value={formData.emergency_contact_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, emergency_contact_name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergency_contact_phone">Teléfono</Label>
                <Input
                  id="emergency_contact_phone"
                  placeholder="099 123 456"
                  value={formData.emergency_contact_phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, emergency_contact_phone: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergency_contact_relation">Relación</Label>
                <Input
                  id="emergency_contact_relation"
                  placeholder="Padre, Madre, Esposo/a, etc."
                  value={formData.emergency_contact_relation}
                  onChange={(e) => setFormData(prev => ({ ...prev, emergency_contact_relation: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Seguro de Salud */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Seguro de Salud</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="health_insurance_company">Empresa de Salud</Label>
                <Input
                  id="health_insurance_company"
                  placeholder="ASSE, CASMU, etc."
                  value={formData.health_insurance_company}
                  onChange={(e) => setFormData(prev => ({ ...prev, health_insurance_company: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="health_insurance_number">Número de Afiliado</Label>
                <Input
                  id="health_insurance_number"
                  placeholder="Número de afiliado"
                  value={formData.health_insurance_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, health_insurance_number: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Información Bancaria */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Información Bancaria</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bank_name">Banco</Label>
                <Input
                  id="bank_name"
                  placeholder="Banco República, Santander, etc."
                  value={formData.bank_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, bank_name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank_account_number">Número de Cuenta</Label>
                <Input
                  id="bank_account_number"
                  placeholder="Número de cuenta"
                  value={formData.bank_account_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, bank_account_number: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creando...' : 'Crear Cadete'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};