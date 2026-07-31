import api from "./api";

export const getNotifications = async (search?: string) => {
  const { data } = await api.get("/notifications", {
    params: { search },
  });

  return data.data.data;
};

export const markNotificationRead = async (
  id: string,
) => {
  const { data } = await api.patch(
    `/notifications/${id}/read`,
  );

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