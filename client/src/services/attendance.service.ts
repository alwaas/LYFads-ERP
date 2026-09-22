import api from "./api";

export interface CheckInAttendanceDto {
  employeeId?: string;
  remarks?: string;
}

export interface MyAttendanceStatus {
  checkedIn: boolean;
  checkedOut: boolean;
  attendanceId: string | null;
  checkIn: string | null;
  checkOut: string | null;
  status: string | null;
  date: string;
}

export const checkIn = async (
  data: CheckInAttendanceDto
) => {
  const response = await api.post(
    "/attendance/check-in",
    data
  );

  return response.data;
};

export const checkInSelf = async (remarks?: string) => {
  const response = await api.post(
    "/attendance/check-in/self",
    { remarks }
  );

  return response.data;
};

export const checkOut = async (
  employeeId: string
) => {
  const response = await api.patch(
    `/attendance/check-out/${employeeId}`
  );

  return response.data;
};

export const checkOutSelf = async () => {
  const response = await api.patch(
    "/attendance/check-out/self"
  );

  return response.data;
};

export const getMyStatus = async (): Promise<MyAttendanceStatus> => {
  const response = await api.get("/attendance/my-status");
  return response.data.data;
};

export const getTodayAttendance = async () => {
  const response = await api.get(
    "/attendance/today"
  );

  return response.data.data;
};

export const getAttendanceHistory = async (
  page = 1,
  limit = 10,
  search = "",
  status?: string,
  fromDate?: string,
  toDate?: string
) => {
  const params: Record<string, string | number> = { page, limit };
  if (search) params.search = search;
  if (status) params.status = status;
  if (fromDate) params.fromDate = fromDate;
  if (toDate) params.toDate = toDate;

  const response = await api.get(
    "/attendance/history",
    { params }
  );

  return response.data.data;
};
