export type Employee = {
  id: string;

  employeeCode: string;

  department: string | null;

  designation: string | null;

  joiningDate: string | null;

  salary: number | null;

  status?: string;

  user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    isActive: boolean;
  };
};