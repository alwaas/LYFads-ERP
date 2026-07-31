export interface Lead {
  id: string;

  companyName: string;

  contactPerson: string;

  email?: string;

  phone?: string;

  status: string;

  source?: string;

  estimatedValue?: number;

  remarks?: string;

  createdAt: string;
}