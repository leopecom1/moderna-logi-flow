import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit3, MapPin } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface Branch {
  id: string;
  name: string;
  address?: string;
  city?: string;
  phone?: string;
  manager_name?: string;
  is_active: boolean;
  created_at: string;
}

interface BranchManagementPanelProps {
  onBranchUpdated?: () => void;
}

export function BranchManagementPanel({ onBranchUpdated }: BranchManagementPanelProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: 'Montevideo',
    phone: '',
    manager_name: '',
    is_active: true,
  });

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBranches(data || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las sucursales',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (selectedBranch) {
        // Edit existing branch
        const { error } = await supabase
          .from('branches')
          .update(formData)
          .eq('id', selectedBranch.id);

        if (error) throw error;
        toast({
          title: 'Éxito',
          description: 'Sucursal actualizada correctamente',
        });
        setShowEditModal(false);
      } else {
        // Create new branch
        const { error } = await supabase
          .from('branches')
          .insert([formData]);

        if (error) throw error;
        toast({
          title: 'Éxito',
          description: 'Sucursal creada correctamente',
        });
        setShowCreateModal(false);
      }

      resetForm();
      fetchBranches();
      onBranchUpdated?.();
    } catch (error) {
      console.error('Error managing branch:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar la sucursal',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      city: 'Montevideo',
      phone: '',
      manager_name: '',
      is_active: true,
    });
    setSelectedBranch(null);
  };

  const handleEdit = (branch: Branch) => {
    setSelectedBranch(branch);
    setFormData({
      name: branch.name,
      address: branch.address || '',
      city: branch.city || 'Montevideo',
      phone: branch.phone || '',
      manager_name: branch.manager_name || '',
      is_active: branch.is_active,
    });
    setShowEditModal(true);
  };

  const toggleBranchStatus = async (branchId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('branches')
        .update({ is_active: !isActive })
        .eq('id', branchId);

      if (error) throw error;
      fetchBranches();
      toast({
        title: 'Éxito',
        description: `Sucursal ${!isActive ? 'activada' : 'desactivada'} correctamente`,
      });
    } catch (error) {
      console.error('Error toggling branch status:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cambiar el estado de la sucursal',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="animate-pulse">Cargando sucursales...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Gestión de Sucursales</h3>
          <p className="text-sm text-muted-foreground">
            Administra las sucursales de tu negocio
          </p>
        </div>
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Sucursal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nueva Sucursal</DialogTitle>
              <DialogDescription>
                Completa la información de la nueva sucursal
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la Sucursal</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Sucursal Centro"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Dirección completa"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Ciudad</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Montevideo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+598 99 123 456"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="manager_name">Nombre del Encargado</Label>
                <Input
                  id="manager_name"
                  value={formData.manager_name}
                  onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
                  placeholder="Juan Pérez"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Sucursal activa</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  Crear Sucursal
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {branches.map((branch) => (
          <Card key={branch.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{branch.name}</CardTitle>
                  <Badge variant={branch.is_active ? "default" : "secondary"}>
                    {branch.is_active ? 'Activa' : 'Inactiva'}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={branch.is_active}
                    onCheckedChange={() => toggleBranchStatus(branch.id, branch.is_active)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(branch)}
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {branch.address && (
                <CardDescription>{branch.address}, {branch.city}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {branch.phone && (
                  <p><strong>Teléfono:</strong> {branch.phone}</p>
                )}
                {branch.manager_name && (
                  <p><strong>Encargado:</strong> {branch.manager_name}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Sucursal</DialogTitle>
            <DialogDescription>
              Modifica la información de la sucursal
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nombre de la Sucursal</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Sucursal Centro"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">Dirección</Label>
              <Textarea
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Dirección completa"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-city">Ciudad</Label>
                <Input
                  id="edit-city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Montevideo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Teléfono</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+598 99 123 456"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-manager">Nombre del Encargado</Label>
              <Input
                id="edit-manager"
                value={formData.manager_name}
                onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
                placeholder="Juan Pérez"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="edit-active">Sucursal activa</Label>
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                Guardar Cambios
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}