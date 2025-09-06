import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CurrencyRate {
  id: string;
  currency_code: string;
  currency_name: string;
  buy_rate: number;
  sell_rate: number;
  last_updated: string;
  is_active: boolean;
}

export const useCurrencyRates = () => {
  return useQuery({
    queryKey: ['currency_rates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('currency_rates')
        .select('*')
        .eq('is_active', true)
        .order('currency_code');

      if (error) throw error;
      return data as CurrencyRate[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  });
};

export const useUSDRate = () => {
  return useQuery({
    queryKey: ['currency_rates', 'USD'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('currency_rates')
        .select('*')
        .eq('currency_code', 'USD')
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data as CurrencyRate;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  });
};

export const syncCurrencyRates = async () => {
  const { data, error } = await supabase.functions.invoke('sync-currency-rates');
  
  if (error) throw error;
  return data;
};