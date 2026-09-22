import api from "./api";

export interface Vendor {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  gstNumber?: string;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    purchases: number;
  };
}

export interface CreateVendorDto {
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  gstNumber?: string;
  notes?: string;
}

export interface UpdateVendorDto {
  name?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  gstNumber?: string;
  isActive?: boolean;
  notes?: string;
}

export interface VendorQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export interface PagedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const vendorService = {
  getAllVendors: async (params?: VendorQueryParams) => {
    const response = await api.get("/vendors", { params });
    return response.data;
  },

  getVendorById: async (id: string): Promise<Vendor> => {
    const response = await api.get(`/vendors/${id}`);
    return response.data.data || response.data;
  },

  createVendor: async (dto: CreateVendorDto): Promise<Vendor> => {
    const response = await api.post("/vendors", dto);
    return response.data.data || response.data;
  },

  updateVendor: async (id: string, dto: UpdateVendorDto): Promise<Vendor> => {
    const response = await api.patch(`/vendors/${id}`, dto);
    return response.data.data || response.data;
  },

  deleteVendor: async (id: string): Promise<{ success: boolean; message: string; deactivated?: boolean }> => {
    const response = await api.delete(`/vendors/${id}`);
    return response.data.data || response.data;
  },
};
