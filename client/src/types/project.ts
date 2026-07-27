export type Project = {
  id: string;

  projectCode: string;

  name: string;

  description?: string;

  status:
    | "PLANNING"
    | "ACTIVE"
    | "ON_HOLD"
    | "COMPLETED"
    | "CANCELLED";

  priority:
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "URGENT";

  startDate?: string;

  endDate?: string;

  budget?: number;

  progress: number;

  clientId: string;

  managerId?: string;

  createdAt: string;

  updatedAt: string;

  client: {
    id: string;
    companyName: string;
    contactPerson: string;
    email: string;
  };

  manager?: {
    id: string;
    fullName: string;
    email: string;
  };
};