export type Client = {
  id: string;

  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;

  website?: string;

  industry?: string;

  city?: string;

  state?: string;

  country?: string;

  address?: string;

  isActive: boolean;

  createdAt: string;

  updatedAt: string;
};