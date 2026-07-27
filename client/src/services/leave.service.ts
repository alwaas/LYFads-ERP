import api from "./api";

import type {
  Leave,
  CreateLeaveDto,
} from "../types/leave";

/* ===========================
   Get All Leaves
=========================== */

export const getLeaves = async (): Promise<Leave[]> => {
  const response = await api.get("/leaves");


  return response.data.data.data;
};

/* ===========================
   Get Leave By ID
=========================== */

export const getLeaveById = async (
  id: string
): Promise<Leave> => {
  const response = await api.get(
    `/leaves/${id}`
  );

  return response.data.data;
};

/* ===========================
   Create Leave
=========================== */

export const createLeave = async (
  data: CreateLeaveDto
) => {
  const response = await api.post(
    "/leaves",
    data
  );

  return response.data;
};

/* ===========================
   Update Leave
=========================== */

export const updateLeave = async (
  id: string,
  data: Partial<CreateLeaveDto>
) => {
  const response = await api.patch(
    `/leaves/${id}`,
    data
  );

  return response.data;
};

/* ===========================
   Delete Leave
=========================== */

export const deleteLeave = async (
  id: string
) => {
  const response = await api.delete(
    `/leaves/${id}`
  );

  return response.data;
};

/* ===========================
   Approve Leave
=========================== */

export const approveLeave = async (
  id: string
) => {
  const response = await api.patch(
    `/leaves/${id}/approve`
  );

  return response.data;
};

/* ===========================
   Reject Leave
=========================== */

export const rejectLeave = async (
  id: string,
  rejectionReason: string
) => {
  const response = await api.patch(
    `/leaves/${id}/reject`,
    {
      rejectionReason,
    }
  );

  return response.data;
};