import api from "./api";
import type { Product, CreateProductDto, UpdateProductDto, ProductQueryParams } from "../types/product";

export const productService = {
  getAllProducts: async (params?: ProductQueryParams) => {
    const response = await api.get("/products", { params });
    return response.data;
  },

  getProductById: async (id: string): Promise<Product> => {
    const response = await api.get(`/products/${id}`);
    return response.data.data || response.data;
  },

  createProduct: async (dto: CreateProductDto): Promise<Product> => {
    const response = await api.post("/products", dto);
    return response.data.data || response.data;
  },

  updateProduct: async (id: string, dto: UpdateProductDto): Promise<Product> => {
    const response = await api.patch(`/products/${id}`, dto);
    return response.data.data || response.data;
  },

  deleteProduct: async (id: string): Promise<{ success: boolean; message: string; deactivated?: boolean }> => {
    const response = await api.delete(`/products/${id}`);
    return response.data.data || response.data;
  },
};
