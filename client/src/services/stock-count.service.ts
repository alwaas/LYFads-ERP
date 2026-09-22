import api from "./api";

export interface StockCountLineInput {
  productId: string;
  countedQuantity: number;
  notes?: string;
}

export interface CreateStockCountDto {
  warehouseId: string;
  countDate?: string;
  notes?: string;
  lines: StockCountLineInput[];
}

export const stockCountService = {
  create: async (dto: CreateStockCountDto) => {
    const { data } = await api.post("/stock-counts", dto);
    return data.data ?? data;
  },
  list: async () => {
    const { data } = await api.get("/stock-counts");
    return data.data ?? data;
  },
  approve: async (id: string) => {
    const { data } = await api.post(`/stock-counts/${id}/approve`);
    return data.data ?? data;
  },
};
