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

interface Brand {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
}

interface EditBrandModalProps {
  brand: Brand;
  onBrandUpdated?: () => void;
}

export function EditBrandModal({ brand, onBrandUpdated }: EditBrandModalProps) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: brand.name,
      description: brand.description || "",
      is_active: brand.is_active,
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        name: brand.name,
        description: brand.description || "",
        is_active: brand.is_active,
      });
    }
  }, [open, brand, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      const { error } = await supabase
        .from("brands")
        .update({
          name: values.name,
          description: values.description || null,
          is_active: values.is_active,
        })
        .eq("id", brand.id);

      if (error) throw error;

      toast({
        title: "Marca actualizada",
        description: "La marca ha sido actualizada exitosamente.",
      });

      setOpen(false);
      onBrandUpdated?.();
    } catch (error) {
      console.error("Error updating brand:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la marca.",
        variant: "destructive",
      });
    }
  };

  const onDelete = async () => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta marca? Esta acción no se puede deshacer.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("brands")
        .delete()
        .eq("id", brand.id);

      if (error) throw error;

      toast({
        title: "Marca eliminada",
        description: "La marca ha sido eliminada exitosamente.",
      });

      setOpen(false);
      onBrandUpdated?.();
    } catch (error) {
      console.error("Error deleting brand:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la marca. Verifica que no esté siendo utilizada por productos.",
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
          <DialogTitle>Editar Marca</DialogTitle>
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
                    <Input placeholder="Nombre de la marca" {...field} />
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
                      placeholder="Descripción de la marca (opcional)" 
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
                    <FormLabel className="text-base">Marca Activa</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      La marca estará disponible para productos
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