import api from "./api";

export const checkIn = async (data: unknown) => {
  const response = await api.post("/attendance/check-in", data);
  return response.data;
};

export const checkOut = async (employeeId: string) => {
  const response = await api.patch(
    `/attendance/check-out/${employeeId}`
  );
  return response.data;
};

export const getTodayAttendance = async () => {
  const response = await api.get("/attendance/today");
  return response.data.data;
};

export const getAttendanceHistory = async (
  page = 1,
  limit = 10,
  search = ""
) => {
  const response = await api.get("/attendance/history", {
    params: {
      page,
      limit,
      search,
    },
  });

  console.log("Attendance History:", response.data);

  return response.data.data.data;
};