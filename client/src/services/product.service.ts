import api from "./api";
import type {
  Product,
  CreateProductDto,
  UpdateProductDto,
} from "../types/product";

export const productService = {
  getAllProducts: async (): Promise<Product[]> => {
    const response = await api.get("/products");
    return response.data.data.data;
  },

  getProductById: async (id: string): Promise<Product> => {
    const response = await api.get(`/products/${id}`);
    return response.data.data;
  },

  createProduct: async (dto: CreateProductDto): Promise<Product> => {
    const response = await api.post("/products", dto);
    return response.data.data;
  },

  updateProduct: async (id: string, dto: UpdateProductDto): Promise<Product> => {
    const response = await api.patch(`/products/${id}`, dto);
    return response.data.data;
  },

  deleteProduct: async (id: string): Promise<void> => {
    await api.delete(`/products/${id}`);
  },
};
