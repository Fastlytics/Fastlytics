// knip-ignore
import { useQuery } from '@tanstack/react-query';
import { request } from '@/lib/api-client';

export type ProductTier = {
  monthly?: {
    product_id: string;
    price: number;
  };
  yearly?: {
    product_id: string;
    price: number;
  };
};

export type ProductsResponse = Record<string, ProductTier>;

export function useProducts() {
  return useQuery({
    queryKey: ['dodo-products'],
    queryFn: () => request<ProductsResponse>('/api/payments/products'),
    staleTime: 5 * 60 * 1000,
  });
}
