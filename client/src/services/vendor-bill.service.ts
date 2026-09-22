import api from "./api";
import type {
  VendorBill,
  CreateVendorBillDto,
  UpdateVendorBillDto,
} from "../types/vendor-bill";

export const vendorBillService = {
  getAllVendorBills: async (
    page = 1,
    limit = 10,
    search?: string,
    status?: string,
    vendorId?: string,
  ) => {
    const params: Record<string, string | number> = { page, limit };
    if (search) params.search = search;
    if (status && status !== "all") params.status = status;
    if (vendorId) params.vendorId = vendorId;
    const response = await api.get("/purchase-invoices", { params });
    return response.data.data ?? response.data;
  },

  getVendorBillById: async (id: string): Promise<VendorBill> => {
    const response = await api.get(`/purchase-invoices/${id}`);
    return response.data.data ?? response.data;
  },

  createVendorBill: async (dto: CreateVendorBillDto): Promise<VendorBill> => {
    const response = await api.post("/purchase-invoices", dto);
    return response.data.data ?? response.data;
  },

  updateVendorBill: async (id: string, dto: UpdateVendorBillDto): Promise<VendorBill> => {
    const response = await api.patch(`/purchase-invoices/${id}`, dto);
    return response.data.data ?? response.data;
  },

  deleteVendorBill: async (id: string): Promise<void> => {
    await api.delete(`/purchase-invoices/${id}`);
  },

  approveVendorBill: async (id: string): Promise<VendorBill> => {
    const response = await api.post(`/purchase-invoices/${id}/approve`);
    return response.data.data ?? response.data;
  },

  postVendorBill: async (id: string): Promise<VendorBill> => {
    const response = await api.post(`/purchase-invoices/${id}/post`);
    return response.data.data ?? response.data;
  },

  cancelVendorBill: async (id: string): Promise<VendorBill> => {
    const response = await api.post(`/purchase-invoices/${id}/cancel`);
    return response.data.data ?? response.data;
  },

  voidVendorBill: async (id: string): Promise<VendorBill> => {
    const response = await api.post(`/purchase-invoices/${id}/void`);
    return response.data.data ?? response.data;
  },
};
