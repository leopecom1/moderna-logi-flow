import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ShopifyProduct, ShopifyConfig } from "@/types/shopify";
import { useToast } from "@/hooks/use-toast";

async function callShopifyAPI(endpoint: string) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('No authenticated session');
  }

  const { data, error } = await supabase.functions.invoke('shopify-products', {
    body: { endpoint },
  });

  if (error) throw error;
  return data;
}

export function useShopifyConfig() {
  return useQuery({
    queryKey: ['shopify-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shopify_config')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      return data as ShopifyConfig | null;
    },
  });
}

export function useSaveShopifyConfig() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (config: { store_domain: string; access_token: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('No user found');

      // Deactivate existing configs
      await supabase
        .from('shopify_config')
        .update({ is_active: false })
        .eq('is_active', true);

      // Insert new config
      const { data, error } = await supabase
        .from('shopify_config')
        .insert({
          store_domain: config.store_domain,
          access_token: config.access_token,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopify-config'] });
      toast({
        title: "Configuración guardada",
        description: "La conexión con Shopify se ha establecido correctamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al guardar configuración",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useShopifyProducts(limit: number = 50) {
  const { data: config } = useShopifyConfig();
  
  return useQuery({
    queryKey: ['shopify-products', limit],
    queryFn: async () => {
      const data = await callShopifyAPI(`/products.json?limit=${limit}`);
      return data.products as ShopifyProduct[];
    },
    enabled: !!config,
  });
}

export function useShopifyProduct(productId: number | null) {
  const { data: config } = useShopifyConfig();
  
  return useQuery({
    queryKey: ['shopify-product', productId],
    queryFn: async () => {
      if (!productId) return null;
      const data = await callShopifyAPI(`/products/${productId}.json`);
      return data.product as ShopifyProduct;
    },
    enabled: !!productId && !!config,
  });
}
