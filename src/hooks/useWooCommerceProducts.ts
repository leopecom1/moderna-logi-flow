import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { WooCommerceProduct, WooCommerceProductCreate } from '@/types/woocommerce';
import { toast } from '@/hooks/use-toast';

const EDGE_FUNCTION_URL = 'https://ndusxjrjrjpauuqeruzg.supabase.co/functions/v1/woocommerce-products';

async function callWooCommerceAPI(endpoint: string, method: string = 'GET', body?: any) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('No authenticated session');
  }

  const options: RequestInit = {
    method,
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${EDGE_FUNCTION_URL}${endpoint}`, options);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'WooCommerce API error');
  }

  return await response.json();
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
      
      return await callWooCommerceAPI(endpoint);
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
      const formData = new FormData();
      formData.append('file', file);

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No authenticated session');
      }

      const response = await fetch(`${EDGE_FUNCTION_URL}/media`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error uploading image');
      }

      return await response.json();
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
