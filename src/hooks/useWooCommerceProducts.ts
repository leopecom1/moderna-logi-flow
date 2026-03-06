import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { WooCommerceProduct, WooCommerceProductCreate } from '@/types/woocommerce';
import { toast } from '@/hooks/use-toast';

export async function callWooCommerceAPI(
  endpoint: string, 
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET', 
  body?: any,
  params?: Record<string, any>
) {
  let fullEndpoint = endpoint;
  
  // Agregar parámetros de query si existen
  if (params && Object.keys(params).length > 0) {
    const queryString = new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null) {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>)
    ).toString();
    
    fullEndpoint = `${endpoint}${endpoint.includes('?') ? '&' : '?'}${queryString}`;
  }
  
  console.log(`[WooCommerce] ${method} ${fullEndpoint}`, body);

  try {
    const { data, error } = await supabase.functions.invoke('woocommerce-products' + fullEndpoint, {
      method,
      body: body || undefined,
    });

    if (error) {
      // En @supabase/functions-js v2.4+, error.context es un Response object (no JSON parseado)
      const context = (error as any)?.context;
      let errorDetail = '';

      if (context && typeof context === 'object' && typeof context.json === 'function') {
        // context es un Response object — leer el body
        try {
          const body = await context.json();
          console.error('[WooCommerce] Error response body:', body);
          if (body?.error) {
            errorDetail = typeof body.error === 'string' ? body.error : JSON.stringify(body.error);
          } else if (body?.message) {
            errorDetail = body.message;
          } else {
            errorDetail = JSON.stringify(body);
          }
        } catch {
          try {
            errorDetail = await context.text();
          } catch {
            errorDetail = `HTTP ${context.status || 'unknown'}`;
          }
        }
      } else if (context) {
        // Fallback: context es un objeto plano (versiones anteriores del SDK)
        if (typeof context === 'string') {
          errorDetail = context;
        } else if (context?.error) {
          errorDetail = typeof context.error === 'string' ? context.error : JSON.stringify(context.error);
        } else if (context?.message) {
          errorDetail = context.message;
        } else {
          errorDetail = JSON.stringify(context);
        }
      }

      const fullMessage = errorDetail || error.message || 'WooCommerce API error';
      console.error('[WooCommerce] API call failed:', fullMessage, error);
      throw new Error(fullMessage);
    }

    return data;
  } catch (error: any) {
    console.error('[WooCommerce] API call failed:', error);
    throw error;
  }
}

export function useWooCommerceProducts(
  page: number = 1,
  perPage: number = 20,
  search?: string,
  category?: string,
  status?: string
) {
  return useQuery({
    queryKey: ['woocommerce-products', page, perPage, search, category, status],
    queryFn: async () => {
      let endpoint = `/products?page=${page}&per_page=${perPage}`;
      if (search) endpoint += `&search=${encodeURIComponent(search)}`;
      if (category) endpoint += `&category=${category}`;
      if (status) endpoint += `&status=${status}`;
      
      const response = await supabase.functions.invoke('woocommerce-products' + endpoint, {
        method: 'GET',
      });

      if (response.error) {
        throw new Error(response.error.message || 'WooCommerce API error');
      }

      // Response now includes pagination metadata in the body
      return response.data;
    },
  });
}

export function useWooCommerceProduct(productId: number | null) {
  return useQuery({
    queryKey: ['woocommerce-product', productId],
    queryFn: async () => {
      if (!productId) return null;
      return await callWooCommerceAPI(`/products/${productId}`);
    },
    enabled: !!productId,
  });
}

export function useCreateWooCommerceProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productData: WooCommerceProductCreate) => {
      return await callWooCommerceAPI('/products', 'POST', productData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['woocommerce-products'] });
      toast({
        title: 'Producto creado',
        description: 'El producto ha sido creado exitosamente en WooCommerce',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateWooCommerceProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<WooCommerceProductCreate> }) => {
      return await callWooCommerceAPI(`/products/${id}`, 'PUT', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['woocommerce-products'] });
      queryClient.invalidateQueries({ queryKey: ['woocommerce-product'] });
      toast({
        title: 'Producto actualizado',
        description: 'El producto ha sido actualizado exitosamente',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteWooCommerceProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: number) => {
      return await callWooCommerceAPI(`/products/${productId}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['woocommerce-products'] });
      toast({
        title: 'Producto eliminado',
        description: 'El producto ha sido eliminado exitosamente',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUploadWooCommerceImage() {
  return useMutation({
    mutationFn: async (file: File) => {
      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(7);
      const fileExt = file.name.split('.').pop();
      const fileName = `${timestamp}-${randomString}.${fileExt}`;
      const filePath = `products/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('woocommerce-images')
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (error) {
        console.error('Storage upload error:', error);
        throw new Error('Error al subir imagen a Storage');
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('woocommerce-images')
        .getPublicUrl(filePath);

      // Return in WooCommerce format
      return {
        id: timestamp,
        source_url: publicUrl,
        alt: file.name,
      };
    },
    onError: (error: Error) => {
      toast({
        title: 'Error al subir imagen',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Variations hooks
export function useWooCommerceVariations(productId: number | null) {
  return useQuery({
    queryKey: ['woocommerce-variations', productId],
    queryFn: async () => {
      if (!productId) return [];
      return await callWooCommerceAPI(`/products/${productId}/variations`);
    },
    enabled: !!productId,
  });
}

export function useCreateWooCommerceVariation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, data }: { productId: number; data: any }) => {
      return await callWooCommerceAPI(`/products/${productId}/variations`, 'POST', data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['woocommerce-variations', variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['woocommerce-products'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateWooCommerceVariation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, variationId, data }: { productId: number; variationId: number; data: any }) => {
      return await callWooCommerceAPI(`/products/${productId}/variations/${variationId}`, 'PUT', data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['woocommerce-variations', variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['woocommerce-products'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteWooCommerceVariation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, variationId }: { productId: number; variationId: number }) => {
      return await callWooCommerceAPI(`/products/${productId}/variations/${variationId}`, 'DELETE');
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['woocommerce-variations', variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['woocommerce-products'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useBatchCreateWooCommerceVariations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, variations }: { productId: number; variations: any[] }) => {
      return await callWooCommerceAPI(`/products/${productId}/variations/batch`, 'POST', { create: variations });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['woocommerce-variations', variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['woocommerce-products'] });
      toast({
        title: 'Variantes creadas',
        description: `${variables.variations.length} variantes creadas exitosamente`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useBatchDeleteWooCommerceVariations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, variationIds }: { productId: number; variationIds: number[] }) => {
      return await callWooCommerceAPI(`/products/${productId}/variations/batch`, 'POST', { delete: variationIds });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['woocommerce-variations', variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['woocommerce-products'] });
    },
    onError: (error: Error) => {
      console.error('[WooCommerce] Batch delete error:', error);
      toast({
        title: 'Error al eliminar variantes',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
