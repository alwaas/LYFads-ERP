export interface Attendance {
  id: string;

  employeeId: string;

  employee: {
    id: string;
    employeeCode: string;

    user: {
      id: string;
      fullName: string;
    };
  };

  checkIn: string;

  checkOut: string | null;

  workingHours: number | null;

  status:
    | "PRESENT"
    | "ABSENT"
    | "HALF_DAY"
    | "LEAVE";

  createdAt: string;

  updatedAt: string;
}