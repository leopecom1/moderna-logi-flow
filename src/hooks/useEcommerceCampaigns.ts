import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface EcommerceCampaign {
  id: string;
  name: string;
  description: string | null;
  markup_percentage: number;
  status: 'draft' | 'active' | 'completed' | 'cancelled' | 'reverted';
  products_count: number;
  created_by: string;
  created_at: string;
  applied_at: string | null;
  reverted_at: string | null;
  updated_at: string;
}

export interface CampaignProduct {
  id: string;
  campaign_id: string;
  woocommerce_product_id: number;
  product_name: string;
  product_type: string;
  original_regular_price: number | null;
  original_sale_price: number | null;
  new_regular_price: number | null;
  new_sale_price: number | null;
  status: 'pending' | 'applied' | 'error' | 'reverted';
  error_message: string | null;
  applied_at: string | null;
  reverted_at: string | null;
  created_at: string;
}

export function useEcommerceCampaigns() {
  return useQuery({
    queryKey: ['ecommerce-campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ecommerce_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as EcommerceCampaign[];
    },
  });
}

export function useEcommerceCampaign(campaignId: string | null) {
  return useQuery({
    queryKey: ['ecommerce-campaign', campaignId],
    queryFn: async () => {
      if (!campaignId) return null;
      
      const { data, error } = await supabase
        .from('ecommerce_campaigns')
        .select('*')
        .eq('id', campaignId)
        .maybeSingle();

      if (error) throw error;
      return data as EcommerceCampaign | null;
    },
    enabled: !!campaignId,
  });
}

export function useCampaignProducts(campaignId: string | null) {
  return useQuery({
    queryKey: ['campaign-products', campaignId],
    queryFn: async () => {
      if (!campaignId) return [];
      
      const { data, error } = await supabase
        .from('ecommerce_campaign_products')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as CampaignProduct[];
    },
    enabled: !!campaignId,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (campaign: {
      name: string;
      description?: string;
      markup_percentage: number;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase
        .from('ecommerce_campaigns')
        .insert({
          ...campaign,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as EcommerceCampaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ecommerce-campaigns'] });
      toast.success('Campaña creada exitosamente');
    },
    onError: (error) => {
      toast.error(`Error al crear campaña: ${error.message}`);
    },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<EcommerceCampaign> }) => {
      const { data, error } = await supabase
        .from('ecommerce_campaigns')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as EcommerceCampaign;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ecommerce-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['ecommerce-campaign', variables.id] });
      toast.success('Campaña actualizada');
    },
    onError: (error) => {
      toast.error(`Error al actualizar campaña: ${error.message}`);
    },
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (campaignId: string) => {
      const { error } = await supabase
        .from('ecommerce_campaigns')
        .delete()
        .eq('id', campaignId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ecommerce-campaigns'] });
      toast.success('Campaña eliminada');
    },
    onError: (error) => {
      toast.error(`Error al eliminar campaña: ${error.message}`);
    },
  });
}

export function useAddCampaignProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (products: Omit<CampaignProduct, 'id' | 'created_at'>[]) => {
      const { data, error } = await supabase
        .from('ecommerce_campaign_products')
        .insert(products)
        .select();

      if (error) throw error;
      return data as CampaignProduct[];
    },
    onSuccess: (_, variables) => {
      if (variables.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['campaign-products', variables[0].campaign_id] });
      }
    },
    onError: (error) => {
      toast.error(`Error al agregar productos: ${error.message}`);
    },
  });
}
