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

  managerId?: string | null;

  bankName?: string | null;

  bankAccountNumber?: string | null;

  ifscCode?: string | null;

  emergencyContactName?: string | null;

  emergencyContactPhone?: string | null;

  manager?: {
    id: string;
    user: {
      fullName: string;
    };
  };

  user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    isActive: boolean;
  };
};
