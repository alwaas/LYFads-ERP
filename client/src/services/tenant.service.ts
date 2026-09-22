import api from "./api";

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: "ACTIVE" | "SUSPENDED" | "INACTIVE";
  maxUsers: number;
  maxStorage: number;
  email: string | null;
  phone: string | null;
  address: string | null;
  logo: string | null;
  timezone: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    users: number;
    employees: number;
    clients: number;
    projects: number;
    products?: number;
    invoices?: number;
    salesOrders?: number;
  };
  subscription?: TenantSubscription | null;
}

export interface TenantSubscription {
  id: string;
  tenantId: string;
  planId: string;
  status: "TRIAL" | "ACTIVE" | "PAST_DUE" | "CANCELLED" | "EXPIRED";
  startDate: string;
  endDate: string | null;
  trialEndDate: string | null;
  autoRenew: boolean;
  createdAt: string;
  updatedAt: string;
  plan?: Plan;
}

export interface Plan {
  id: string;
  name: string;
  code: string;
  description: string | null;
  price: number;
  billingInterval: "MONTHLY" | "YEARLY";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  features?: PlanFeature[];
  limits?: PlanLimit[];
}

export interface PlanFeature {
  id: string;
  planId: string;
  featureCode: string;
  description: string | null;
}

export interface PlanLimit {
  id: string;
  planId: string;
  resourceCode: string;
  limitValue: number;
}

export interface UsageItem {
  resource: string;
  used: number;
  limit: number | null;
  remaining: number | null;
  unlimited: boolean;
}

export interface Entitlements {
  hasSubscription: boolean;
  plan?: {
    id: string;
    name: string;
    code: string;
  };
  features: Array<{
    featureCode: string;
    description: string | null;
  }>;
  limits: Array<{
    resourceCode: string;
    limitValue: number;
  }>;
}

export const getTenants = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<{
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  data: Tenant[];
}> => {
  const response = await api.get("/tenants", { params });
  return response.data.data;
};

export const getTenant = async (id: string): Promise<Tenant> => {
  const response = await api.get(`/tenants/${id}`);
  return response.data.data;
};

export const createTenant = async (data: {
  name: string;
  slug: string;
  status?: string;
  maxUsers?: number;
  maxStorage?: number;
  email?: string;
  phone?: string;
  address?: string;
  timezone?: string;
  currency?: string;
}): Promise<Tenant> => {
  const response = await api.post("/tenants", data);
  return response.data.data;
};

export const updateTenant = async (
  id: string,
  data: Partial<Tenant>,
): Promise<Tenant> => {
  const response = await api.patch(`/tenants/${id}`, data);
  return response.data.data;
};

export const activateTenant = async (id: string): Promise<Tenant> => {
  const response = await api.post(`/tenants/${id}/activate`);
  return response.data.data;
};

export const suspendTenant = async (id: string): Promise<Tenant> => {
  const response = await api.post(`/tenants/${id}/suspend`);
  return response.data.data;
};

export const deactivateTenant = async (id: string): Promise<Tenant> => {
  const response = await api.post(`/tenants/${id}/deactivate`);
  return response.data.data;
};

export const getCurrentTenant = async (): Promise<Tenant> => {
  const response = await api.get("/tenants/current");
  return response.data.data;
};

export const updateCurrentTenant = async (data: {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  logo?: string;
  timezone?: string;
  currency?: string;
}): Promise<Tenant> => {
  const response = await api.patch("/tenants/current", data);
  return response.data.data;
};
