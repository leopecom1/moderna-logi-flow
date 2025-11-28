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

export interface CampaignVariation {
  id: string;
  campaign_product_id: string;
  woocommerce_variation_id: number;
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

export interface ApplyCampaignProgress {
  productId: string;
  productName: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  error?: string;
  variationsTotal?: number;
  variationsProcessed?: number;
}

export function useApplyCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      campaignId, 
      onProgress 
    }: { 
      campaignId: string; 
      onProgress?: (progress: ApplyCampaignProgress[]) => void;
    }) => {
      // Get campaign and products
      const { data: campaign, error: campaignError } = await supabase
        .from('ecommerce_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (campaignError) throw campaignError;

      const { data: products, error: productsError } = await supabase
        .from('ecommerce_campaign_products')
        .select('*')
        .eq('campaign_id', campaignId);

      if (productsError) throw productsError;

      const progressMap: Map<string, ApplyCampaignProgress> = new Map();
      products.forEach(p => {
        progressMap.set(p.id, {
          productId: p.id,
          productName: p.product_name,
          status: 'pending',
        });
      });

      const updateProgress = () => {
        if (onProgress) {
          onProgress(Array.from(progressMap.values()));
        }
      };

      // Process each product
      for (const product of products) {
        const progress = progressMap.get(product.id)!;
        progress.status = 'processing';
        updateProgress();

        try {
          if (product.product_type === 'simple') {
            // Update simple product
            const response = await supabase.functions.invoke('woocommerce-products', {
              body: {
                endpoint: `/products/${product.woocommerce_product_id}`,
                method: 'PUT',
                data: {
                  regular_price: product.new_regular_price?.toString(),
                  sale_price: product.new_sale_price?.toString(),
                },
              },
            });

            if (response.error) throw new Error(response.error.message);

            // Update product status
            await supabase
              .from('ecommerce_campaign_products')
              .update({
                status: 'applied',
                applied_at: new Date().toISOString(),
              })
              .eq('id', product.id);

            progress.status = 'success';
          } else if (product.product_type === 'variable') {
            // Get variations
            const variationsResponse = await supabase.functions.invoke('woocommerce-products', {
              body: {
                endpoint: `/products/${product.woocommerce_product_id}/variations`,
                method: 'GET',
              },
            });

            if (variationsResponse.error) throw new Error(variationsResponse.error.message);

            const variations = variationsResponse.data || [];
            console.log(`[Campaign Apply] Product ${product.woocommerce_product_id} has ${variations.length} variations`);
            
            if (variations.length === 0) {
              throw new Error(`Producto variable ${product.product_name} no tiene variaciones en WooCommerce`);
            }
            
            progress.variationsTotal = variations.length;
            progress.variationsProcessed = 0;
            updateProgress();

            // Store original variation prices and update each variation
            for (const variation of variations) {
              // Save original prices to DB
              await supabase.from('ecommerce_campaign_variations').insert({
                campaign_product_id: product.id,
                woocommerce_variation_id: variation.id,
                original_regular_price: parseFloat(variation.regular_price) || null,
                original_sale_price: variation.sale_price ? parseFloat(variation.sale_price) : null,
                new_regular_price: product.new_regular_price,
                new_sale_price: product.new_sale_price,
                status: 'pending',
              });

              // Update variation prices
              const updateResponse = await supabase.functions.invoke('woocommerce-products', {
                body: {
                  endpoint: `/products/${product.woocommerce_product_id}/variations/${variation.id}`,
                  method: 'PUT',
                  data: {
                    regular_price: product.new_regular_price?.toString(),
                    sale_price: product.new_sale_price?.toString(),
                  },
                },
              });

              if (updateResponse.error) throw new Error(updateResponse.error.message);

              // Update variation status
              await supabase
                .from('ecommerce_campaign_variations')
                .update({
                  status: 'applied',
                  applied_at: new Date().toISOString(),
                })
                .eq('campaign_product_id', product.id)
                .eq('woocommerce_variation_id', variation.id);

              progress.variationsProcessed! += 1;
              updateProgress();
            }

            // Update product status
            await supabase
              .from('ecommerce_campaign_products')
              .update({
                status: 'applied',
                applied_at: new Date().toISOString(),
              })
              .eq('id', product.id);

            progress.status = 'success';
          }
        } catch (error: any) {
          progress.status = 'error';
          progress.error = error.message;

          // Update product with error
          await supabase
            .from('ecommerce_campaign_products')
            .update({
              status: 'error',
              error_message: error.message,
            })
            .eq('id', product.id);
        }

        updateProgress();
      }

      // Update campaign status to active
      await supabase
        .from('ecommerce_campaigns')
        .update({
          status: 'active',
          applied_at: new Date().toISOString(),
        })
        .eq('id', campaignId);

      return { campaign, products: Array.from(progressMap.values()) };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ecommerce-campaigns'] });
      toast.success('Campaña aplicada exitosamente');
    },
    onError: (error) => {
      toast.error(`Error al aplicar campaña: ${error.message}`);
    },
  });
}

export function useRevertCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      campaignId, 
      onProgress 
    }: { 
      campaignId: string; 
      onProgress?: (progress: ApplyCampaignProgress[]) => void;
    }) => {
      // Get campaign and products
      const { data: products, error: productsError } = await supabase
        .from('ecommerce_campaign_products')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('status', 'applied');

      if (productsError) throw productsError;

      const progressMap: Map<string, ApplyCampaignProgress> = new Map();
      products.forEach(p => {
        progressMap.set(p.id, {
          productId: p.id,
          productName: p.product_name,
          status: 'pending',
        });
      });

      const updateProgress = () => {
        if (onProgress) {
          onProgress(Array.from(progressMap.values()));
        }
      };

      // Process each product
      for (const product of products) {
        const progress = progressMap.get(product.id)!;
        progress.status = 'processing';
        updateProgress();

        try {
          if (product.product_type === 'simple') {
            // Restore simple product prices
            const response = await supabase.functions.invoke('woocommerce-products', {
              body: {
                endpoint: `/products/${product.woocommerce_product_id}`,
                method: 'PUT',
                data: {
                  regular_price: product.original_regular_price?.toString(),
                  sale_price: product.original_sale_price?.toString() || '',
                },
              },
            });

            if (response.error) throw new Error(response.error.message);

            // Update product status
            await supabase
              .from('ecommerce_campaign_products')
              .update({
                status: 'reverted',
                reverted_at: new Date().toISOString(),
              })
              .eq('id', product.id);

            progress.status = 'success';
          } else if (product.product_type === 'variable') {
            // Get stored variation prices
            const { data: variations, error: variationsError } = await supabase
              .from('ecommerce_campaign_variations')
              .select('*')
              .eq('campaign_product_id', product.id)
              .eq('status', 'applied');

            if (variationsError) throw variationsError;

            progress.variationsTotal = variations.length;
            progress.variationsProcessed = 0;
            updateProgress();

            // Restore each variation
            for (const variation of variations) {
              const updateResponse = await supabase.functions.invoke('woocommerce-products', {
                body: {
                  endpoint: `/products/${product.woocommerce_product_id}/variations/${variation.woocommerce_variation_id}`,
                  method: 'PUT',
                  data: {
                    regular_price: variation.original_regular_price?.toString(),
                    sale_price: variation.original_sale_price?.toString() || '',
                  },
                },
              });

              if (updateResponse.error) throw new Error(updateResponse.error.message);

              // Update variation status
              await supabase
                .from('ecommerce_campaign_variations')
                .update({
                  status: 'reverted',
                  reverted_at: new Date().toISOString(),
                })
                .eq('id', variation.id);

              progress.variationsProcessed! += 1;
              updateProgress();
            }

            // Update product status
            await supabase
              .from('ecommerce_campaign_products')
              .update({
                status: 'reverted',
                reverted_at: new Date().toISOString(),
              })
              .eq('id', product.id);

            progress.status = 'success';
          }
        } catch (error: any) {
          progress.status = 'error';
          progress.error = error.message;

          // Update product with error
          await supabase
            .from('ecommerce_campaign_products')
            .update({
              status: 'error',
              error_message: error.message,
            })
            .eq('id', product.id);
        }

        updateProgress();
      }

      // Update campaign status to reverted
      await supabase
        .from('ecommerce_campaigns')
        .update({
          status: 'reverted',
          reverted_at: new Date().toISOString(),
        })
        .eq('id', campaignId);

      return { products: Array.from(progressMap.values()) };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ecommerce-campaigns'] });
      toast.success('Campaña revertida exitosamente');
    },
    onError: (error) => {
      toast.error(`Error al revertir campaña: ${error.message}`);
    },
  });
}
