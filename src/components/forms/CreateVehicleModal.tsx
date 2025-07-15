import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Car } from 'lucide-react';

const VEHICLE_TYPES = [
  { value: 'motocicleta', label: 'Motocicleta' },
  { value: 'auto', label: 'Auto' },
  { value: 'camioneta', label: 'Camioneta' },
  { value: 'bicicleta', label: 'Bicicleta' },
];

const VEHICLE_STATUS = [
  { value: 'activo', label: 'Activo' },
  { value: 'inactivo', label: 'Inactivo' },
  { value: 'mantenimiento', label: 'En Mantenimiento' },
];

interface CreateVehicleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVehicleCreated: () => void;
}

interface Cadete {
  user_id: string;
  full_name: string;
}

export const CreateVehicleModal = ({ open, onOpenChange, onVehicleCreated }: CreateVehicleModalProps) => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [cadetes, setCadetes] = useState<Cadete[]>([]);
  const [formData, setFormData] = useState({
    cadete_id: '',
    brand: '',
    model: '',
    year: '',
    license_plate: '',
    color: '',
    insurance_company: '',
    insurance_policy: '',
    insurance_expiry: '',
    technical_inspection_expiry: '',
    vehicle_type: 'motocicleta',
    status: 'activo',
    notes: '',
  });

  useEffect(() => {
    if (open) {
      fetchCadetes();
    }
  }, [open]);

  const fetchCadetes = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .eq('role', 'cadete')
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      setCadetes(data || []);
    } catch (error) {
      console.error('Error fetching cadetes:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;

    try {
      setLoading(true);

      const vehicleData = {
        cadete_id: formData.cadete_id,
        brand: formData.brand,
        model: formData.model,
        year: formData.year ? parseInt(formData.year) : null,
        license_plate: formData.license_plate.toUpperCase(),
        color: formData.color,
        insurance_company: formData.insurance_company,
        insurance_policy: formData.insurance_policy,
        insurance_expiry: formData.insurance_expiry || null,
        technical_inspection_expiry: formData.technical_inspection_expiry || null,
        vehicle_type: formData.vehicle_type,
        status: formData.status,
        notes: formData.notes,
      };

      const { error } = await supabase
        .from('vehicles')
        .insert([vehicleData]);

      if (error) throw error;

      toast({
        title: 'Vehículo creado',
        description: 'El vehículo ha sido creado exitosamente',
      });

      onVehicleCreated();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error creating vehicle:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear el vehículo',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      cadete_id: '',
      brand: '',
      model: '',
      year: '',
      license_plate: '',
      color: '',
      insurance_company: '',
      insurance_policy: '',
      insurance_expiry: '',
      technical_inspection_expiry: '',
      vehicle_type: 'motocicleta',
      status: 'activo',
      notes: '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Car className="h-5 w-5" />
            <span>Agregar Nuevo Vehículo</span>
          </DialogTitle>
          <DialogDescription>
            Completa la información del vehículo y asígnalo a un cadete
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Básica */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Información Básica</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cadete_id">Cadete *</Label>
                <Select value={formData.cadete_id} onValueChange={(value) => setFormData(prev => ({ ...prev, cadete_id: value }))} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cadete" />
                  </SelectTrigger>
                  <SelectContent>
                    {cadetes.map((cadete) => (
                      <SelectItem key={cadete.user_id} value={cadete.user_id}>
                        {cadete.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehicle_type">Tipo de Vehículo *</Label>
                <Select value={formData.vehicle_type} onValueChange={(value) => setFormData(prev => ({ ...prev, vehicle_type: value }))} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {VEHICLE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand">Marca *</Label>
                <Input
                  id="brand"
                  placeholder="Honda, Yamaha, etc."
                  value={formData.brand}
                  onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Modelo *</Label>
                <Input
                  id="model"
                  placeholder="CBR 600, Wave, etc."
                  value={formData.model}
                  onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Año</Label>
                <Input
                  id="year"
                  type="number"
                  placeholder="2020"
                  min="1900"
                  max="2025"
                  value={formData.year}
                  onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="license_plate">Patente *</Label>
                <Input
                  id="license_plate"
                  placeholder="ABC-1234"
                  value={formData.license_plate}
                  onChange={(e) => setFormData(prev => ({ ...prev, license_plate: e.target.value.toUpperCase() }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  placeholder="Rojo, Azul, etc."
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {VEHICLE_STATUS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Información del Seguro */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Información del Seguro</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="insurance_company">Compañía de Seguros</Label>
                <Input
                  id="insurance_company"
                  placeholder="SURA, Mapfre, etc."
                  value={formData.insurance_company}
                  onChange={(e) => setFormData(prev => ({ ...prev, insurance_company: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="insurance_policy">Número de Póliza</Label>
                <Input
                  id="insurance_policy"
                  placeholder="Número de póliza"
                  value={formData.insurance_policy}
                  onChange={(e) => setFormData(prev => ({ ...prev, insurance_policy: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="insurance_expiry">Vencimiento del Seguro</Label>
                <Input
                  id="insurance_expiry"
                  type="date"
                  value={formData.insurance_expiry}
                  onChange={(e) => setFormData(prev => ({ ...prev, insurance_expiry: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="technical_inspection_expiry">Vencimiento Revisión Técnica</Label>
                <Input
                  id="technical_inspection_expiry"
                  type="date"
                  value={formData.technical_inspection_expiry}
                  onChange={(e) => setFormData(prev => ({ ...prev, technical_inspection_expiry: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Notas Adicionales</h3>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                placeholder="Observaciones adicionales sobre el vehículo..."
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creando...' : 'Crear Vehículo'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};