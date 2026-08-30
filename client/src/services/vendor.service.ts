import api from "./api";
import type {
  Vendor,
  CreateVendorDto,
  UpdateVendorDto,
} from "../types/vendor";

export const vendorService = {
  getAllVendors: async (): Promise<Vendor[]> => {
    const response = await api.get("/vendors");
    return response.data.data.data;
  },

  getVendorById: async (id: string): Promise<Vendor> => {
    const response = await api.get(`/vendors/${id}`);
    return response.data.data;
  },

  createVendor: async (dto: CreateVendorDto): Promise<Vendor> => {
    const response = await api.post("/vendors", dto);
    return response.data.data;
  },

  updateVendor: async (id: string, dto: UpdateVendorDto): Promise<Vendor> => {
    const response = await api.patch(`/vendors/${id}`, dto);
    return response.data.data;
  },

  deleteVendor: async (id: string): Promise<void> => {
    await api.delete(`/vendors/${id}`);
  },
};
