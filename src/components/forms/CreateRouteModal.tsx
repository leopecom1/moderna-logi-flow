import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Route, Plus } from 'lucide-react';

interface CreateRouteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRouteCreated: () => void;
}

interface Cadete {
  id: string;
  full_name: string;
}

export const CreateRouteModal = ({ open, onOpenChange, onRouteCreated }: CreateRouteModalProps) => {
  const { profile } = useAuth();
  const [cadetes, setCadetes] = useState<Cadete[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    route_name: '',
    cadete_id: '',
    route_date: '',
  });

  useEffect(() => {
    if (open) {
      fetchCadetes();
      // Set default date to today
      const today = new Date().toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, route_date: today }));
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
      const mappedData = data?.map(item => ({ id: item.user_id, full_name: item.full_name })) || [];
      setCadetes(mappedData);
    } catch (error) {
      console.error('Error fetching cadetes:', error);
    }
  };

  const generateRouteName = () => {
    const date = new Date(formData.route_date);
    const dateStr = date.toLocaleDateString('es-AR', { 
      day: '2-digit', 
      month: '2-digit' 
    });
    const cadete = cadetes.find(c => c.id === formData.cadete_id);
    const cadeteInitials = cadete?.full_name.split(' ').map(n => n[0]).join('').toUpperCase() || 'XX';
    return `Ruta ${dateStr} - ${cadeteInitials}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;

    try {
      setLoading(true);

      const routeData = {
        route_name: formData.route_name || generateRouteName(),
        cadete_id: formData.cadete_id,
        route_date: formData.route_date,
        total_deliveries: 0,
        completed_deliveries: 0,
      };

      const { error } = await supabase
        .from('routes')
        .insert([routeData]);

      if (error) throw error;

      toast({
        title: 'Ruta creada',
        description: 'La ruta ha sido creada exitosamente',
      });

      onRouteCreated();
      onOpenChange(false);
      setFormData({
        route_name: '',
        cadete_id: '',
        route_date: '',
      });
    } catch (error) {
      console.error('Error creating route:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear la ruta',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Route className="h-5 w-5" />
            <span>Crear Nueva Ruta</span>
          </DialogTitle>
          <DialogDescription>
            Completa la información para crear una nueva ruta de entrega
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cadete">Cadete *</Label>
            <Select value={formData.cadete_id} onValueChange={(value) => setFormData(prev => ({ ...prev, cadete_id: value }))} required>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar cadete" />
              </SelectTrigger>
              <SelectContent>
                {cadetes.map((cadete) => (
                  <SelectItem key={cadete.id} value={cadete.id}>
                    {cadete.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="route_date">Fecha de la Ruta *</Label>
            <Input
              id="route_date"
              type="date"
              value={formData.route_date}
              onChange={(e) => setFormData(prev => ({ ...prev, route_date: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="route_name">Nombre de la Ruta</Label>
            <Input
              id="route_name"
              placeholder={formData.cadete_id && formData.route_date ? generateRouteName() : "Se generará automáticamente"}
              value={formData.route_name}
              onChange={(e) => setFormData(prev => ({ ...prev, route_name: e.target.value }))}
            />
            <p className="text-sm text-muted-foreground">
              Si no especificas un nombre, se generará automáticamente
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !formData.cadete_id || !formData.route_date}>
              {loading ? 'Creando...' : 'Crear Ruta'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};