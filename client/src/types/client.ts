export type Client = {
  id: string;

  companyName: string;
  contactPerson: string;

  email: string;
  phone: string;

  website?: string;
  industry?: string;

  gstNumber?: string;

  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;

  isActive: boolean;

  createdAt: string;
  updatedAt: string;
};