import api from "./api";
import type { TenantSubscription, UsageItem, Entitlements } from "./tenant.service";

export const getCurrentSubscription = async (): Promise<TenantSubscription | null> => {
  const response = await api.get("/subscriptions/current");
  return response.data.data;
};

export const getTenantSubscription = async (
  tenantId: string,
): Promise<TenantSubscription | null> => {
  const response = await api.get(`/tenants/${tenantId}/subscription`);
  return response.data.data;
};

export const assignSubscription = async (
  tenantId: string,
  data: {
    planId: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    trialEndDate?: string;
    autoRenew?: boolean;
  },
): Promise<TenantSubscription> => {
  const response = await api.post(`/tenants/${tenantId}/subscription`, data);
  return response.data.data;
};

export const updateSubscription = async (
  tenantId: string,
  data: {
    planId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    trialEndDate?: string;
    autoRenew?: boolean;
  },
): Promise<TenantSubscription> => {
  const response = await api.patch(`/tenants/${tenantId}/subscription`, data);
  return response.data.data;
};

export const cancelSubscription = async (
  tenantId: string,
): Promise<TenantSubscription> => {
  const response = await api.post(`/tenants/${tenantId}/subscription/cancel`);
  return response.data.data;
};

export const getCurrentUsage = async (): Promise<{
  hasSubscription: boolean;
  usage: UsageItem[];
}> => {
  const response = await api.get("/tenants/current/usage");
  return response.data.data;
};

export const getCurrentLimits = async (): Promise<
  Array<{ resourceCode: string; limitValue: number }>
> => {
  const response = await api.get("/tenants/current/limits");
  return response.data.data;
};

export const getCurrentEntitlements = async (): Promise<Entitlements> => {
  const response = await api.get("/tenants/current/entitlements");
  return response.data.data;
};
