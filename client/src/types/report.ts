export interface DashboardReport {
  totalSales: number;
  totalPurchases: number;
  totalExpenses: number;
  totalPaymentsReceived: number;
  netCashFlow: number;
  outstandingReceivables: number;
  overdueReceivables: number;
  customerCount: number;
  vendorCount: number;
  invoiceCount: number;
  orderCount: number;
  totalProducts?: number;
  lowStockCount?: number;
  totalStockValue?: number;
  valuationMethod?: string;
  lowStockItems?: LowStockItem[];
}

export interface LowStockItem {
  id: string;
  sku: string;
  name: string;
  stockQuantity: number;
  minStockLevel: number;
}

export interface InventoryReport {
  available: boolean;
  valuationMethod: "FIFO" | "WEIGHTED_AVERAGE" | string;
  totalProducts: number;
  totalStockQuantity: number;
  totalStockValue: number;
  lowStockCount: number;
  byStatus: { active: number; inactive: number };
  products: InventoryReportProduct[];
  warehouseBreakdown: InventoryWarehouseBreakdown[];
}

export interface InventoryReportProduct {
  id: string;
  sku: string;
  name: string;
  stockQuantity: number;
  minStockLevel: number;
  unitPrice: number;
  costPrice: number;
  isActive: boolean;
  isLowStock: boolean;
  totalValue: number;
  warehouseStocks: InventoryWarehouseStock[];
}

export interface InventoryWarehouseStock {
  warehouseId: string;
  warehouseName: string;
  quantity: number;
  averageCost: number;
}

export interface InventoryWarehouseBreakdown {
  warehouseId: string;
  warehouseName: string;
  productCount: number;
  totalQuantity: number;
}

export interface ProfitabilityReport {
  available: boolean;
  reason?: string;
  method?: string;
  dateFrom?: string;
  dateTo?: string;
  totalRevenue?: number;
  totalCogs?: number;
  grossProfit?: number;
  cogsByProduct?: { productId: string; totalCogs: number }[];
}

export interface SalesReport {
  totalSales: number;
  invoiceCount: number;
  averageInvoiceValue: number;
  paidAmount: number;
  outstandingAmount: number;
  salesByMonth: Array<{
    month: string;
    total: number;
    count: number;
  }>;
  salesByCustomer: Array<{
    clientId: string;
    customerName: string;
    total: number;
    paid: number;
    outstanding: number;
    count: number;
  }>;
  salesByProject: Array<{
    projectId: string;
    projectName: string;
    total: number;
    count: number;
  }>;
  salesByStatus: Array<{
    status: string;
    total: number;
    count: number;
  }>;
}

export interface ReceivablesReport {
  totalReceivables: number;
  currentReceivables: number;
  overdueReceivables: number;
  paid: number;
  aging: {
    '0-30': number;
    '31-60': number;
    '61-90': number;
    '90+': number;
  };
  topOutstandingCustomers: Array<{
    clientId: string;
    customerName: string;
    outstanding: number;
    invoiceCount: number;
  }>;
}

export interface PayablesReport {
  totalPayables: number;
  aging: {
    current: number;
    days31to60: number;
    days61to90: number;
    days90plus: number;
  };
  billCount: number;
  topOutstandingVendors: Array<{
    purchaseInvoiceId: string;
    invoiceNumber: string;
    vendorId: string;
    vendorName: string;
    balanceAmount: number;
    dueDate: string;
    daysOverdue: number;
    status: string;
  }>;
}

export interface CustomerReport {
  customerCount: number;
  topCustomers: Array<{
    clientId: string;
    customerName: string;
    totalSales: number;
    paid: number;
    outstanding: number;
    invoiceCount: number;
  }>;
  salesByCustomer: Array<{
    clientId: string;
    customerName: string;
    totalSales: number;
    paid: number;
    outstanding: number;
    invoiceCount: number;
  }>;
  outstandingByCustomer: Array<{
    clientId: string;
    customerName: string;
    outstanding: number;
    invoiceCount: number;
  }>;
  paymentHistory: Array<{
    id: string;
    amount: number;
    paymentDate: string;
    method: string;
    referenceNo: string | null;
    invoiceNumber: string | null;
    customerName: string;
  }>;
}

export interface UnavailableReport {
  available: false;
  reason: string;
}

export interface EmployeeDirectoryReport {
  total: number;
  data: Array<{
    id: string;
    employeeCode: string;
    fullName: string;
    email: string;
    role: string;
    designation: string;
    department: string;
    phone: string;
    joiningDate: string;
    status: string;
  }>;
}

export interface AttendanceSummaryReport {
  dateFrom: string;
  dateTo: string;
  summary: Array<{
    employeeId: string;
    employeeName: string;
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
  }>;
}

export interface LeaveReport {
  dateFrom: string;
  dateTo: string;
  totalLeaves: number;
  byStatus: Record<string, number>;
  leaves: Array<{
    id: string;
    employeeName: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    status: string;
    reason: string;
    rejectionReason?: string;
  }>;
}

export interface PayrollSummaryReport {
  totalPayrolls: number;
  totalNetSalary: number;
  totalBasicSalary: number;
  byStatus: Record<string, number>;
  payrolls: Array<{
    id: string;
    employeeName: string;
    month: number;
    year: number;
    basicSalary: number;
    netSalary: number;
    status: string;
    paidAt?: string;
  }>;
}

export interface ExpenseReport {
  available: boolean;
  totalExpenses: number;
  expenseCount: number;
  byCategory: Array<{ category: string; total: number }>;
  byMonth: Array<{ month: string; total: number }>;
}

export interface PurchaseReport {
  available: boolean;
  totalPurchases: number;
  purchaseCount: number;
  byVendor: Array<{ vendorId: string; vendorName: string; total: number }>;
  byMonth: Array<{ month: string; total: number }>;
}

export interface VendorReport {
  available: boolean;
  totalVendors: number;
  activeVendors: number;
  vendors: Array<{
    id: string;
    name: string;
    contactPerson: string | null;
    email: string | null;
    phone: string | null;
    isActive: boolean;
    purchaseCount: number;
    totalPurchases: number;
  }>;
}

export type ReportResponse =
  | DashboardReport
  | SalesReport
  | ReceivablesReport
  | PayablesReport
  | ExpenseReport
  | PurchaseReport
  | VendorReport
  | ProfitabilityReport
  | CustomerReport
  | UnavailableReport
  | EmployeeDirectoryReport
  | AttendanceSummaryReport
  | LeaveReport
  | PayrollSummaryReport;

export interface ReportQueryParams {
  dateFrom?: string;
  dateTo?: string;
  clientId?: string;
  projectId?: string;
  status?: string;
  category?: string;
  vendorId?: string;
  search?: string;
}
