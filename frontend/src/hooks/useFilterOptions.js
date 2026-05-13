import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';

/**
 * Fetches available filter dropdown options given the current active filters.
 * Each dimension is computed against all OTHER active filters, so selecting
 * one filter immediately narrows the options available in the rest.
 *
 * @param {object} activeFilters – same shape as the filter state object
 */
export function useFilterOptions(activeFilters = {}) {
  // Build query params – only pass non-empty filter arrays.
  const params = {};
  Object.entries(activeFilters).forEach(([key, val]) => {
    if (Array.isArray(val) && val.length > 0) {
      params[key] = val.join(',');
    } else if (typeof val === 'string' && val.trim()) {
      params[key] = val.trim();
    }
  });

  return useQuery({
    queryKey: ['filter-options', params],
    queryFn: async () => {
      const { data } = await api.get('/products/filter-options', { params });
      return data;
    },
    staleTime: 60 * 1000, // filter options change less often
    placeholderData: (prev) => prev,
  });
}
