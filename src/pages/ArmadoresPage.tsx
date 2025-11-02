import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Wrench, Plus, Edit, Trash2 } from 'lucide-react';

interface Armador {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const ArmadoresPage = () => {
  const [armadores, setArmadores] = useState<Armador[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingArmador, setEditingArmador] = useState<Armador | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    is_active: true
  });

  useEffect(() => {
    fetchArmadores();
  }, []);

  const fetchArmadores = async () => {
    try {
      const { data, error } = await supabase
        .from('armadores')
        .select('*')
        .order('name');

      if (error) throw error;
      setArmadores(data || []);
    } catch (error: any) {
      toast.error('Error al cargar armadores');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingArmador) {
        const { error } = await supabase
          .from('armadores')
          .update({
            name: formData.name,
            phone: formData.phone || null,
            email: formData.email || null,
            is_active: formData.is_active
          })
          .eq('id', editingArmador.id);

        if (error) throw error;
        toast.success('Armador actualizado correctamente');
      } else {
        const { error } = await supabase
          .from('armadores')
          .insert({
            name: formData.name,
            phone: formData.phone || null,
            email: formData.email || null,
            is_active: formData.is_active
          });

        if (error) throw error;
        toast.success('Armador creado correctamente');
      }

      setShowModal(false);
      setEditingArmador(null);
      resetForm();
      fetchArmadores();
    } catch (error: any) {
      toast.error(editingArmador ? 'Error al actualizar armador' : 'Error al crear armador');
      console.error('Error:', error);
    }
  };

  const handleEdit = (armador: Armador) => {
    setEditingArmador(armador);
    setFormData({
      name: armador.name,
      phone: armador.phone || '',
      email: armador.email || '',
      is_active: armador.is_active
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este armador?')) return;

    try {
      const { error } = await supabase
        .from('armadores')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Armador eliminado correctamente');
      fetchArmadores();
    } catch (error: any) {
      toast.error('Error al eliminar armador');
      console.error('Error:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      is_active: true
    });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingArmador(null);
    resetForm();
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <p>Cargando...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wrench className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold">Armadores</h1>
              <p className="text-muted-foreground">
                Gestiona el personal de armado
              </p>
            </div>
          </div>

          <Dialog open={showModal} onOpenChange={setShowModal}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingArmador(null); resetForm(); }}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Armador
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingArmador ? 'Editar Armador' : 'Nuevo Armador'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Activo</Label>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={handleCloseModal}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingArmador ? 'Actualizar' : 'Crear'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Armadores</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {armadores.map((armador) => (
                  <TableRow key={armador.id}>
                    <TableCell className="font-medium">{armador.name}</TableCell>
                    <TableCell>{armador.phone || '-'}</TableCell>
                    <TableCell>{armador.email || '-'}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                        armador.is_active 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      }`}>
                        {armador.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(armador)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(armador.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {armadores.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No hay armadores registrados
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default ArmadoresPage;
