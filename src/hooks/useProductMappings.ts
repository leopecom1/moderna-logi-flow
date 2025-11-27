import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductMapping } from "@/types/shopify";
import { useToast } from "@/hooks/use-toast";

export function useProductMappings() {
  return useQuery({
    queryKey: ['product-mappings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_mappings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ProductMapping[];
    },
  });
}

export function useProductMapping(woocommerceProductId: number | null) {
  return useQuery({
    queryKey: ['product-mapping', woocommerceProductId],
    queryFn: async () => {
      if (!woocommerceProductId) return null;
      
      const { data, error } = await supabase
        .from('product_mappings')
        .select('*')
        .eq('woocommerce_product_id', woocommerceProductId)
        .maybeSingle();

      if (error) throw error;
      return data as ProductMapping | null;
    },
    enabled: !!woocommerceProductId,
  });
}

export function useCreateProductMapping() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (mapping: {
      woocommerce_product_id: number;
      shopify_product_id: number;
      woocommerce_product_name: string;
      shopify_product_name: string;
    }) => {
      const { data, error } = await supabase
        .from('product_mappings')
        .upsert({
          woocommerce_product_id: mapping.woocommerce_product_id,
          shopify_product_id: mapping.shopify_product_id,
          woocommerce_product_name: mapping.woocommerce_product_name,
          shopify_product_name: mapping.shopify_product_name,
          last_synced_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-mappings'] });
      toast({
        title: "Mapeo creado",
        description: "Los productos se han asociado correctamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al crear mapeo",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteProductMapping() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (mappingId: string) => {
      const { error } = await supabase
        .from('product_mappings')
        .delete()
        .eq('id', mappingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-mappings'] });
      toast({
        title: "Mapeo eliminado",
        description: "La asociación se ha eliminado correctamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al eliminar mapeo",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
