export interface Vendor {
  id: string;
  tenantId: string;
  name: string;
  vendorCode: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  alternatePhone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  taxNumber?: string;
  paymentTerms?: string;
  notes?: string;
  status: VendorStatus;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  createdByUser?: {
    id: string;
    fullName: string;
    email: string;
  };
}

export type VendorStatus = "ACTIVE" | "INACTIVE";

export interface CreateVendorDto {
  name: string;
  vendorCode: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  alternatePhone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  taxNumber?: string;
  paymentTerms?: string;
  notes?: string;
  status?: VendorStatus;
  tenantId: string;
}

export interface UpdateVendorDto {
  name?: string;
  vendorCode?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  alternatePhone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  taxNumber?: string;
  paymentTerms?: string;
  notes?: string;
  status?: VendorStatus;
}
