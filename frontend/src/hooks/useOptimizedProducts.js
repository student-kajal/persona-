import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';

/**
 * Fetches a paginated, server-sorted, server-filtered product page.
 *
 * @param {object} params  – { page, limit, search, article, color, size,
 *                            gender, stockType, series, mrp, rate, pairPerCarton,
 *                            minCartons, maxCartons }
 */
export function useOptimizedProducts(params = {}) {
  return useQuery({
    queryKey: ['optimized-products', params],
    queryFn: async () => {
      const { data } = await api.get('/products/optimized', { params });
      return data;
    },
    // Keep previous page data visible while the next page is loading.
    placeholderData: (prev) => prev,
    staleTime: 30 * 1000,
  });
}
