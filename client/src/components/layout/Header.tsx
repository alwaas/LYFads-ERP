import { useLocation } from "react-router-dom";
import { Menu } from "lucide-react";

import Breadcrumbs from "./Breadcrumbs";
import HeaderActions from "./HeaderActions";

type HeaderProps = {
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
};

const ROUTE_TITLE_MAP: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/employees": "Employees",
  "/employees/add": "Add Employee",
  "/employees/profile/me": "My Profile",
  "/users": "Users & Access",
  "/users/add": "Add User",
  "/clients": "Clients",
  "/clients/add": "Add Client",
  "/projects": "Projects",
  "/projects/add": "Add Project",
  "/kanban": "Kanban Board",
  "/tasks": "Tasks",
  "/tasks/add": "Add Task",
  "/milestones": "Milestones",
  "/milestones/add": "Add Milestone",
  "/attendance": "Attendance",
  "/attendance/check-in": "Clock In / Clock Out",
  "/attendance/history": "Attendance History",
  "/leaves": "Leaves Management",
  "/leaves/add": "Apply for Leave",
  "/daily-work-reports": "Daily Work Reports",
  "/daily-work-reports/add": "Submit Daily Report",
  "/payroll": "Payroll",
  "/payroll/add": "Add Payroll Run",
  "/crm": "CRM & Leads",
  "/crm/add": "Add Lead",
  "/invoices": "Invoices & Billing",
  "/invoices/add": "Create Invoice",
  "/payments": "Payments",
  "/payments/add": "Record Payment",
  "/payments/allocations": "Payment Allocations",
  "/expenses": "Expenses",
  "/expenses/add": "Record Expense",
  "/purchases": "Direct Purchases",
  "/purchases/add": "Add Purchase",
  "/purchase-orders": "Purchase Orders",
  "/purchase-orders/add": "Create Purchase Order",
  "/vendors": "Vendors",
  "/vendors/add": "Add Vendor",
  "/vendor-bills": "Vendor Bills",
  "/vendor-bills/add": "Create Vendor Bill",
  "/products": "Products & Items",
  "/products/add": "Add Product",
  "/warehouses": "Warehouses",
  "/warehouses/add": "Add Warehouse",
  "/stock-movements": "Stock Movements",
  "/stock-movements/add": "Record Stock Movement",
  "/stock-counts": "Stock Counts & Audits",
  "/stock-counts/add": "New Stock Count",
  "/inventory-settings": "Inventory Settings",
  "/sales-orders": "Sales Orders",
  "/sales-orders/add": "Create Sales Order",
  "/finance": "Finance & General Ledger",
  "/finance/accounts": "Chart of Accounts",
  "/finance/accounts/add": "Add Account",
  "/finance/journal-entries": "Journal Entries",
  "/finance/journal-entries/add": "New Journal Entry",
  "/finance/trial-balance": "Trial Balance",
  "/finance/profit-loss": "Profit & Loss Statement",
  "/finance/general-ledger": "General Ledger Report",
  "/reports": "Reports Dashboard",
  "/reports/sales": "Sales Report",
  "/reports/receivables": "Receivables Report",
  "/reports/payables": "Payables Report",
  "/reports/inventory": "Inventory Report",
  "/reports/customers": "Customer Report",
  "/reports/expenses": "Expense Report",
  "/reports/purchases": "Purchase Report",
  "/reports/vendors": "Vendor Report",
  "/reports/profitability": "Profitability Report",
  "/reports/employees": "Employee Directory",
  "/reports/attendance-summary": "Attendance Summary",
  "/reports/leave-report": "Leave Report",
  "/reports/payroll-summary": "Payroll Summary",
  "/ar": "Accounts Receivable Dashboard",
  "/ar/dashboard": "Accounts Receivable Dashboard",
  "/notifications": "Notifications",
  "/activity-logs": "Activity Logs",
  "/comments": "Comments",
  "/comments/add": "Add Comment",
  "/timeline": "Activity Timeline",
  "/timesheets": "Timesheets",
  "/timesheets/add": "Submit Timesheet",
  "/project-timeline": "Project Timeline",
  "/attachments": "Attachments",
  "/settings": "Platform Settings",
  "/tenants": "Tenant Management",
  "/tenants/add": "Add Tenant",
  "/plans": "Subscription Plans",
  "/plans/add": "Create Plan",
  "/my-plan": "My Plan & Entitlements",
};

function getPageTitle(pathname: string): string {
  // Direct match
  if (ROUTE_TITLE_MAP[pathname]) {
    return ROUTE_TITLE_MAP[pathname];
  }

  // Dynamic parameterized routes
  if (pathname.startsWith("/invoices/view/") || pathname.match(/^\/invoices\/[^/]+$/)) {
    return "Invoice Details";
  }
  if (pathname.startsWith("/invoices/edit/")) {
    return "Edit Invoice";
  }
  if (pathname.startsWith("/expenses/") && !pathname.includes("add")) {
    return pathname.includes("edit") ? "Edit Expense" : "Expense Details";
  }
  if (pathname.startsWith("/products/edit/")) {
    return "Edit Product";
  }
  if (pathname.startsWith("/products/") && !pathname.includes("add")) {
    return "Product Details";
  }
  if (pathname.startsWith("/sales-orders/edit/") || pathname.endsWith("/edit")) {
    return "Edit Sales Order";
  }
  if (pathname.startsWith("/sales-orders/view/") || pathname.match(/^\/sales-orders\/[^/]+$/)) {
    return "Sales Order Details";
  }
  if (pathname.startsWith("/purchase-orders/view/") || pathname.match(/^\/purchase-orders\/[^/]+$/)) {
    return "Purchase Order Details";
  }
  if (pathname.startsWith("/vendor-bills/view/") || pathname.match(/^\/vendor-bills\/[^/]+$/)) {
    return "Vendor Bill Details";
  }
  if (pathname.startsWith("/vendors/view/") || pathname.match(/^\/vendors\/[^/]+$/)) {
    return "Vendor Details";
  }
  if (pathname.startsWith("/clients/view/") || pathname.match(/^\/clients\/[^/]+$/)) {
    return "Client Details";
  }
  if (pathname.startsWith("/projects/view/") || pathname.match(/^\/projects\/[^/]+$/)) {
    return "Project Details";
  }
  if (pathname.includes("/kanban")) {
    return "Kanban Board";
  }

  // Fallback: take last meaningful segment and title case it
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return "Dashboard";
  const last = segments[segments.length - 1];
  return last.charAt(0).toUpperCase() + last.slice(1).replaceAll("-", " ");
}

function Header({ onToggleSidebar }: HeaderProps) {
  const { pathname } = useLocation();
  const pageTitle = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm shadow-xs">
      <div className="flex items-center justify-between px-6 py-3.5">
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition lg:hidden"
              title="Toggle sidebar"
              aria-label="Toggle sidebar"
            >
              <Menu size={20} />
            </button>
          )}

          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none">
              {pageTitle}
            </h1>
            <div className="mt-1">
              <Breadcrumbs />
            </div>
          </div>
        </div>

        <HeaderActions />
      </div>
    </header>
  );
}

export default Header;