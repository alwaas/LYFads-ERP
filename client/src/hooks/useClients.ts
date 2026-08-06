import { useQuery } from '@tanstack/react-query';
import api from '../services/api'; // Aapka axios instance jo aapne banaya hai

export function useClients() {
  return useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data } = await api.get('/clients');
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes tak data cache mein rahega, baar-baar API hit nahi hogi
  });
}