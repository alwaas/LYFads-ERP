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

  date: string;

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

export interface MyAttendanceStatus {
  checkedIn: boolean;
  checkedOut: boolean;
  attendanceId: string | null;
  checkIn: string | null;
  checkOut: string | null;
  status: string | null;
  date: string;
}
