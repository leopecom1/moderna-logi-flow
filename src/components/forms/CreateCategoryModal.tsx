import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Plus } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateCategoryModalProps {
  onCategoryCreated?: () => void;
  parentId?: string;
  triggerText?: string;
  triggerSize?: "sm" | "default";
}

export function CreateCategoryModal({ 
  onCategoryCreated, 
  parentId, 
  triggerText = "Crear Categoría",
  triggerSize = "default"
}: CreateCategoryModalProps) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      const { error } = await supabase
        .from("categories")
        .insert([
          {
            name: data.name,
            description: data.description || null,
            parent_id: parentId || null,
          },
        ]);

      if (error) throw error;

      toast({
        title: parentId ? "Subcategoría creada" : "Categoría creada",
        description: parentId 
          ? "La subcategoría ha sido creada exitosamente."
          : "La categoría ha sido creada exitosamente.",
      });

      form.reset();
      setOpen(false);
      onCategoryCreated?.();
    } catch (error) {
      console.error("Error creating category:", error);
      toast({
        title: "Error",
        description: "Hubo un error al crear la categoría.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size={triggerSize} variant={parentId ? "outline" : "default"}>
          <Plus className="mr-2 h-4 w-4" />
          {triggerText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {parentId ? "Crear Nueva Subcategoría" : "Crear Nueva Categoría"}
          </DialogTitle>
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
                  <FormLabel>Descripción (opcional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descripción de la categoría" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {parentId ? "Crear Subcategoría" : "Crear Categoría"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}