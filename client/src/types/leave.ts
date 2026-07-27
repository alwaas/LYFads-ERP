export type LeaveStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

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

  fromDate: string;

  toDate: string;

  totalDays: number;

  reason: string;

  status: LeaveStatus;

  approvedBy?: string;

  approvedAt?: string;

  rejectionReason?: string;

  createdAt: string;

  updatedAt: string;
}

export interface CreateLeaveDto {
  employeeId: string;

  leaveType: LeaveType;

  fromDate: string;

  toDate: string;

  reason: string;
}