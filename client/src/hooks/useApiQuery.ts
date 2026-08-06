import { useQuery } from "@tanstack/react-query";
import api from "../services/api";

export function useApiQuery(
  endpoint: string,
  queryKey: string[]
) {
  return useQuery({
    queryKey,
    queryFn: async () => {
      const { data } = await api.get(endpoint);
      return data;
    },
  });
}