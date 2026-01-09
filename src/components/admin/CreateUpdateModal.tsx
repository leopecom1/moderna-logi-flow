import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useSystemUpdates, SystemUpdate } from '@/hooks/useSystemUpdates';
import { toast } from 'sonner';

const formSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  content: z.string().min(1, 'El contenido es requerido'),
  type: z.enum(['feature', 'improvement', 'fix', 'announcement']),
  priority: z.enum(['low', 'medium', 'high']),
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateUpdateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingUpdate: SystemUpdate | null;
}

export function CreateUpdateModal({ 
  open, 
  onOpenChange, 
  editingUpdate 
}: CreateUpdateModalProps) {
  const { createUpdate, updateUpdate } = useSystemUpdates();
  const isEditing = !!editingUpdate;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      content: '',
      type: 'announcement',
      priority: 'medium',
      is_active: true,
    },
  });

  useEffect(() => {
    if (editingUpdate) {
      form.reset({
        title: editingUpdate.title,
        content: editingUpdate.content,
        type: editingUpdate.type,
        priority: editingUpdate.priority,
        is_active: editingUpdate.is_active,
      });
    } else {
      form.reset({
        title: '',
        content: '',
        type: 'announcement',
        priority: 'medium',
        is_active: true,
      });
    }
  }, [editingUpdate, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEditing && editingUpdate) {
        await updateUpdate.mutateAsync({
          id: editingUpdate.id,
          ...values,
        });
        toast.success('Novedad actualizada');
      } else {
        const createData = {
          title: values.title,
          content: values.content,
          type: values.type,
          priority: values.priority,
          is_active: values.is_active,
        };
        await createUpdate.mutateAsync(createData);
        toast.success('Novedad creada');
      }
      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast.error(isEditing ? 'Error al actualizar' : 'Error al crear');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Novedad' : 'Nueva Novedad'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Título de la novedad" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contenido</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descripción detallada de la novedad..." 
                      className="min-h-[120px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="feature">Nueva función</SelectItem>
                        <SelectItem value="improvement">Mejora</SelectItem>
                        <SelectItem value="fix">Corrección</SelectItem>
                        <SelectItem value="announcement">Anuncio</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridad</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar prioridad" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Baja</SelectItem>
                        <SelectItem value="medium">Media</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Activa</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Si está activa, los usuarios podrán ver esta novedad
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createUpdate.isPending || updateUpdate.isPending}
              >
                {isEditing ? 'Guardar cambios' : 'Crear novedad'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
