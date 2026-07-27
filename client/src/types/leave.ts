export type LeaveStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

export type LeaveType =
  | "CASUAL"
  | "SICK"
  | "EARNED"
  | "UNPAID"
  | "MATERNITY"
  | "PATERNITY";

export interface Leave {
  id: string;

  employeeId: string;

  employee: {
    id: string;
    employeeCode: string;

    user: {
      id: string;
      fullName: string;
      email: string;
    };
  };

  leaveType: LeaveType;

  startDate: string;

  endDate: string;

  reason: string;

  remarks?: string;

  status: LeaveStatus;

  createdAt: string;

  updatedAt: string;
}

export interface CreateLeaveDto {
  employeeId: string;

  leaveType: LeaveType;

  startDate: string;

  endDate: string;

  reason: string;

  remarks?: string;
}