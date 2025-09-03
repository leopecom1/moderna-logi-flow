import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { Plus, Warehouse, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface Warehouse {
  id: string;
  name: string;
  address?: string;
  city?: string;
  is_active: boolean;
}

interface BranchWarehouse {
  id: string;
  branch_id: string;
  warehouse_id: string;
  is_active: boolean;
  warehouse: Warehouse;
}

interface BranchWarehouseAssignmentsProps {
  branchId: string;
  branchName: string;
}

export function BranchWarehouseAssignments({ branchId, branchName }: BranchWarehouseAssignmentsProps) {
  const [assignments, setAssignments] = useState<BranchWarehouse[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, [branchId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch assignments for this branch with warehouse details
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('branch_warehouses')
        .select(`
          id,
          branch_id,
          warehouse_id,
          is_active,
          created_at,
          updated_at
        `)
        .eq('branch_id', branchId);

      if (assignmentsError) throw assignmentsError;

      // Fetch warehouse details for each assignment
      const assignmentsWithWarehouses = [];
      if (assignmentsData) {
        for (const assignment of assignmentsData) {
          const { data: warehouseData, error: warehouseError } = await supabase
            .from('warehouses')
            .select('*')
            .eq('id', assignment.warehouse_id)
            .single();

          if (!warehouseError && warehouseData) {
            assignmentsWithWarehouses.push({
              ...assignment,
              warehouse: warehouseData
            });
          }
        }
      }

      // Fetch all available warehouses
      const { data: warehousesData, error: warehousesError } = await supabase
        .from('warehouses')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (warehousesError) throw warehousesError;

      setAssignments(assignmentsWithWarehouses || []);
      setWarehouses(warehousesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las asignaciones de depósitos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignWarehouse = async () => {
    if (!selectedWarehouseId) return;

    try {
      const { error } = await supabase
        .from('branch_warehouses')
        .insert([{
          branch_id: branchId,
          warehouse_id: selectedWarehouseId,
          is_active: true
        }]);

      if (error) throw error;

      toast({
        title: 'Éxito',
        description: 'Depósito asignado correctamente',
      });

      setShowAssignModal(false);
      setSelectedWarehouseId('');
      fetchData();
    } catch (error) {
      console.error('Error assigning warehouse:', error);
      toast({
        title: 'Error',
        description: 'No se pudo asignar el depósito',
        variant: 'destructive',
      });
    }
  };

  const toggleAssignmentStatus = async (assignmentId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('branch_warehouses')
        .update({ is_active: !isActive })
        .eq('id', assignmentId);

      if (error) throw error;

      toast({
        title: 'Éxito',
        description: `Asignación ${!isActive ? 'activada' : 'desactivada'} correctamente`,
      });

      fetchData();
    } catch (error) {
      console.error('Error toggling assignment:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cambiar el estado de la asignación',
        variant: 'destructive',
      });
    }
  };

  const removeAssignment = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from('branch_warehouses')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;

      toast({
        title: 'Éxito',
        description: 'Asignación eliminada correctamente',
      });

      fetchData();
    } catch (error) {
      console.error('Error removing assignment:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la asignación',
        variant: 'destructive',
      });
    }
  };

  const getAvailableWarehouses = () => {
    const assignedWarehouseIds = assignments.map(a => a.warehouse_id);
    return warehouses.filter(w => !assignedWarehouseIds.includes(w.id));
  };

  if (loading) {
    return <div className="animate-pulse">Cargando asignaciones...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-base font-semibold">Depósitos Asignados</h4>
          <p className="text-sm text-muted-foreground">
            Gestiona los depósitos asignados a {branchName}
          </p>
        </div>
        <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
          <DialogTrigger asChild>
            <Button size="sm" disabled={getAvailableWarehouses().length === 0}>
              <Plus className="h-4 w-4 mr-2" />
              Asignar Depósito
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Asignar Depósito</DialogTitle>
              <DialogDescription>
                Selecciona un depósito para asignar a {branchName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="warehouse">Depósito</Label>
                <Select value={selectedWarehouseId} onValueChange={setSelectedWarehouseId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un depósito" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableWarehouses().map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name} - {warehouse.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAssignModal(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleAssignWarehouse}
                  disabled={!selectedWarehouseId}
                >
                  Asignar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {assignments.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <Warehouse className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No hay depósitos asignados a esta sucursal</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {assignments.map((assignment) => (
            <Card key={assignment.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Warehouse className="h-5 w-5 text-primary" />
                  <div>
                    <h5 className="font-medium">{assignment.warehouse.name}</h5>
                    <p className="text-sm text-muted-foreground">
                      {assignment.warehouse.address && `${assignment.warehouse.address}, `}
                      {assignment.warehouse.city}
                    </p>
                  </div>
                  <Badge variant={assignment.is_active ? "default" : "secondary"}>
                    {assignment.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={assignment.is_active}
                    onCheckedChange={() => toggleAssignmentStatus(assignment.id, assignment.is_active)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeAssignment(assignment.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}