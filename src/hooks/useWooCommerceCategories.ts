import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { WooCommerceCategory, WooCommerceCategoryCreate } from '@/types/woocommerce';
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

export function useWooCommerceCategories() {
  return useQuery({
    queryKey: ['woocommerce-categories'],
    queryFn: async () => {
      return await callWooCommerceAPI('/categories');
    },
  });
}

export function useCreateWooCommerceCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoryData: WooCommerceCategoryCreate) => {
      return await callWooCommerceAPI('/categories', 'POST', categoryData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['woocommerce-categories'] });
      toast({
        title: 'Categoría creada',
        description: 'La categoría ha sido creada exitosamente',
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

export function useUpdateWooCommerceCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<WooCommerceCategoryCreate> }) => {
      return await callWooCommerceAPI(`/categories/${id}`, 'PUT', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['woocommerce-categories'] });
      toast({
        title: 'Categoría actualizada',
        description: 'La categoría ha sido actualizada exitosamente',
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

export function useDeleteWooCommerceCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoryId: number) => {
      return await callWooCommerceAPI(`/categories/${categoryId}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['woocommerce-categories'] });
      toast({
        title: 'Categoría eliminada',
        description: 'La categoría ha sido eliminada exitosamente',
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
