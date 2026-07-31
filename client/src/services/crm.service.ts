import api from "./api";

export const getLeads = async (search?: string) => {
  const { data } = await api.get("/crm/leads", {
    params: { search },
  });

  return data.data.data;
};

export const getLead = async (id: string) => {
  const { data } = await api.get(`/crm/leads/${id}`);

  return data.data;
};

export const createLead = async (payload: any) => {
  const { data } = await api.post("/crm/leads", payload);

  return data.data;
};

export const updateLead = async (
  id: string,
  payload: any,
) => {
  const { data } = await api.patch(
    `/crm/leads/${id}`,
    payload,
  );

  return data.data;
};

export const deleteLead = async (id: string) => {
  const { data } = await api.delete(`/crm/leads/${id}`);

  return data.data;
};