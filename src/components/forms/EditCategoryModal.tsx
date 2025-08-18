import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Pencil } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(1, "Nombre es requerido"),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface Category {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  parent_id?: string;
}

interface EditCategoryModalProps {
  category: Category;
  onCategoryUpdated?: () => void;
}

export function EditCategoryModal({ category, onCategoryUpdated }: EditCategoryModalProps) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: category.name,
      description: category.description || "",
      is_active: category.is_active,
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        name: category.name,
        description: category.description || "",
        is_active: category.is_active,
      });
    }
  }, [open, category, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      const { error } = await supabase
        .from("categories")
        .update({
          name: values.name,
          description: values.description || null,
          is_active: values.is_active,
        })
        .eq("id", category.id);

      if (error) throw error;

      toast({
        title: "Categoría actualizada",
        description: "La categoría ha sido actualizada exitosamente.",
      });

      setOpen(false);
      onCategoryUpdated?.();
    } catch (error) {
      console.error("Error updating category:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la categoría.",
        variant: "destructive",
      });
    }
  };

  const onDelete = async () => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta categoría? Esta acción no se puede deshacer.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", category.id);

      if (error) throw error;

      toast({
        title: "Categoría eliminada",
        description: "La categoría ha sido eliminada exitosamente.",
      });

      setOpen(false);
      onCategoryUpdated?.();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la categoría. Verifica que no esté siendo utilizada por productos.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Categoría</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre de la categoría" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descripción de la categoría (opcional)" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Categoría Activa</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      La categoría estará disponible para productos
                    </div>
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

            <div className="flex justify-between">
              <Button
                type="button"
                variant="destructive"
                onClick={onDelete}
              >
                Eliminar
              </Button>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">Actualizar</Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}