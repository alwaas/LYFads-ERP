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
  const response = await api.get(`/leaves/${id}`);

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

  return response.data.data;
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

  return response.data.data;
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

  return response.data.data;
};

/* ===========================
   Update Leave Status
=========================== */

export const updateLeaveStatus = async (
  id: string,
  status: "APPROVED" | "REJECTED" | "PENDING",
  remarks?: string
) => {
  const response = await api.patch(
    `/leaves/${id}/status`,
    {
      status,
      remarks,
    }
  );

  return response.data.data;
};

/* ===========================
   Approve Leave
=========================== */

export const approveLeave = async (
  id: string,
  remarks?: string
) => {
  return updateLeaveStatus(
    id,
    "APPROVED",
    remarks
  );
};

/* ===========================
   Reject Leave
=========================== */

export const rejectLeave = async (
  id: string,
  remarks?: string
) => {
  return updateLeaveStatus(
    id,
    "REJECTED",
    remarks
  );
};