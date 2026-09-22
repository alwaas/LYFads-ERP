import api from "./api";
import type { Plan } from "./tenant.service";

export const getPlans = async (): Promise<Plan[]> => {
  const response = await api.get("/plans");
  return response.data.data;
};

export const getPlan = async (id: string): Promise<Plan> => {
  const response = await api.get(`/plans/${id}`);
  return response.data.data;
};

export const createPlan = async (data: {
  name: string;
  code: string;
  description?: string;
  price: number;
  billingInterval?: string;
  isActive?: boolean;
  features?: Array<{ featureCode: string; description?: string }>;
  limits?: Array<{ resourceCode: string; limitValue: number }>;
}): Promise<Plan> => {
  const response = await api.post("/plans", data);
  return response.data.data;
};

export const updatePlan = async (
  id: string,
  data: Partial<Plan> & {
    features?: Array<{ featureCode: string; description?: string }>;
    limits?: Array<{ resourceCode: string; limitValue: number }>;
  },
): Promise<Plan> => {
  const response = await api.patch(`/plans/${id}`, data);
  return response.data.data;
};
