import api from "./api";

export const getNotifications = async (page = 1, limit = 10, search?: string): Promise<any> => {
  const params: Record<string, string | number> = { page, limit };
  if (search) params.search = search;

  const { data } = await api.get("/notifications", { params });
  return data.data;
};

export const getNotificationById = async (id: string) => {
  const { data } = await api.get(`/notifications/${id}`);
  return data.data;
};

export const updateNotification = async (id: string, data: Record<string, unknown>) => {
  const { data: response } = await api.patch(`/notifications/${id}`, data);
  return response.data;
};

export const markNotificationRead = async (
  id: string,
) => {
  const { data } = await api.patch(
    `/notifications/${id}/read`,
  );
  return data.data;
};

export const deleteNotification = async (id: string) => {
  const { data } = await api.delete(`/notifications/${id}`);
  return data.data;
};

export const getUnreadCount = async (
  userId: string,
) => {
  const { data } = await api.get(
    `/notifications/unread-count/${userId}`,
  );
  return data.data;
};
