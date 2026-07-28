export type Employee = {
  id: string;

  employeeCode: string;

  department: string | null;

  designation: string | null;

  joiningDate: string | null;

  salary: number | null;

  phone: string | null;

  address: string | null;

  city: string | null;

  state: string | null;

  country: string | null;

  pincode: string | null;

  status?: string;

  user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    isActive: boolean;
  };
};