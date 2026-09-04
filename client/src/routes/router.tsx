import PageLoader from "../components/common/PageLoader";
import { createBrowserRouter } from "react-router-dom";
import { lazy, Suspense } from "react";
import { ROLES } from "../constants/roles";

const LoginPage = lazy(
  () => import("../pages/auth/LoginPage")
);

const DashboardPage = lazy(
  () => import("../pages/dashboard/DashboardPage")
);

const EmployeesPage = lazy(
  () => import("../pages/employees/EmployeesPage")
);

const AddEmployeePage = lazy(
  () => import("../pages/employees/AddEmployeePage")
);

const EditEmployeePage = lazy(
  () => import("../pages/employees/EditEmployeePage")
);

const ViewEmployeePage = lazy(
  () => import("../pages/employees/ViewEmployeePage")
);

const MyProfilePage = lazy(
  () => import("../pages/employees/MyProfilePage")
);

const UsersPage = lazy(
  () => import("../pages/users/UsersPage")
);

const AddUserPage = lazy(
  () => import("../pages/users/AddUserPage")
);

const EditUserPage = lazy(
  () => import("../pages/users/EditUserPage")
);

const ViewUserPage = lazy(
  () => import("../pages/users/ViewUserPage")
);

const KanbanPage = lazy(
  () => import("../pages/kanban/KanbanPage")
);

const PayrollPage = lazy(
  () => import("../pages/payroll/PayrollPage")
);

const AddPayrollPage = lazy(
  () => import("../pages/payroll/AddPayrollPage")
);

const EditPayrollPage = lazy(
  () => import("../pages/payroll/EditPayrollPage")
);

const ViewPayrollPage = lazy(
  () => import("../pages/payroll/ViewPayrollPage")
);

const ProjectsPage = lazy(
  () => import("../pages/projects/ProjectsPage")
);

const AddProjectPage = lazy(
  () => import("../pages/projects/AddProjectPage")
);

const ViewProjectPage = lazy(
  () => import("../pages/projects/ViewProjectPage")
);

const EditProjectPage = lazy(
  () => import("../pages/projects/EditProjectPage")
);

const MilestonesPage = lazy(
  () => import("../pages/milestones/MilestonesPage")
);

const AddMilestonePage = lazy(
  () => import("../pages/milestones/AddMilestonePage")
);

const EditMilestonePage = lazy(
  () => import("../pages/milestones/EditMilestonePage")
);

const ViewMilestonePage = lazy(
  () => import("../pages/milestones/ViewMilestonePage")
);

const TasksPage = lazy(
  () => import("../pages/tasks/TasksPage")
);

const AddTaskPage = lazy(
  () => import("../pages/tasks/AddTaskPage")
);

const ViewTaskPage = lazy(
  () => import("../pages/tasks/ViewTaskPage")
);

const EditTaskPage = lazy(
  () => import("../pages/tasks/EditTaskPage")
);

const ClientsPage = lazy(
  () => import("../pages/clients/ClientsPage")
);

const AddClientPage = lazy(
  () => import("../pages/clients/AddClientPage")
);

const EditClientPage = lazy(
  () => import("../pages/clients/EditClientPage")
);

const ViewClientPage = lazy(
  () => import("../pages/clients/ViewClientPage")
);

const CheckInPage = lazy(
  () => import("../pages/attendance/CheckInPage")
);

const AddAttendancePage = lazy(
  () => import("../pages/attendance/AddAttendancePage")
);

const AttendancePage = lazy(
  () => import("../pages/attendance/AttendancePage")
);

const AttendanceHistoryPage = lazy(
  () => import("../pages/attendance/AttendanceHistoryPage")
);

const LeavesPage = lazy(
  () => import("../pages/leaves/LeavesPage")
);

const AddLeavePage = lazy(
  () => import("../pages/leaves/AddLeavePage")
);

const EditLeavePage = lazy(
  () => import("../pages/leaves/EditLeavePage")
);

const ViewLeavePage = lazy(
  () => import("../pages/leaves/ViewLeavePage")
);

const DailyWorkReportsPage = lazy(
  () => import("../pages/daily-work-reports/DailyWorkReportsPage")
);

const AddDailyWorkReportPage = lazy(
  () => import("../pages/daily-work-reports/AddDailyWorkReportPage")
);

const EditDailyWorkReportPage = lazy(
  () => import("../pages/daily-work-reports/EditDailyWorkReportPage")
);

const ViewDailyWorkReportPage = lazy(
  () => import("../pages/daily-work-reports/ViewDailyWorkReportPage")
);

const LeadsPage = lazy(
  () => import("../pages/crm/LeadsPage")
);

const AddLeadPage = lazy(
  () => import("../pages/crm/AddLeadPage")
);

const EditLeadPage = lazy(
  () => import("../pages/crm/EditLeadPage")
);

const ViewLeadPage = lazy(
  () => import("../pages/crm/ViewLeadPage")
);

const ReportsPage = lazy(
  () => import("../pages/reports/ReportsDashboardPage")
);

const SalesReportPage = lazy(
  () => import("../pages/reports/SalesReportPage")
);

const ReceivablesReportPage = lazy(
  () => import("../pages/reports/ReceivablesReportPage")
);

const CustomerReportPage = lazy(
  () => import("../pages/reports/CustomerReportPage")
);

const ExpenseReportPage = lazy(
  () => import("../pages/reports/ExpenseReportPage")
);

const PurchaseReportPage = lazy(
  () => import("../pages/reports/PurchaseReportPage")
);

const VendorReportPage = lazy(
  () => import("../pages/reports/VendorReportPage")
);

const ProfitabilityReportPage = lazy(
  () => import("../pages/reports/ProfitabilityReportPage")
);

const EmployeeDirectoryReportPage = lazy(
  () => import("../pages/reports/EmployeeDirectoryReportPage")
);

const AttendanceSummaryReportPage = lazy(
  () => import("../pages/reports/AttendanceSummaryReportPage")
);

const LeaveReportPage = lazy(
  () => import("../pages/reports/LeaveReportPage")
);

const PayrollSummaryReportPage = lazy(
  () => import("../pages/reports/PayrollSummaryReportPage")
);

const SalesOrdersPage = lazy(
  () => import("../pages/sales-orders/SalesOrdersPage")
);

const AddSalesOrderPage = lazy(
  () => import("../pages/sales-orders/AddSalesOrderPage")
);

const EditSalesOrderPage = lazy(
  () => import("../pages/sales-orders/EditSalesOrderPage")
);

const ViewSalesOrderPage = lazy(
  () => import("../pages/sales-orders/ViewSalesOrderPage")
);

const NotificationsPage = lazy(
  () => import("../pages/notifications/NotificationsPage")
);

const ActivityLogsPage = lazy(
  () => import("../pages/activity-logs/ActivityLogsPage")
);

const CommentsPage = lazy(
  () => import("../components/comments/CommentsPage")
);

const AddCommentPage = lazy(
  () => import("../pages/comments/AddCommentPage")
);

const EditCommentPage = lazy(
  () => import("../pages/comments/EditCommentPage")
);

const SettingsPage = lazy(
  () => import("../pages/settings/SettingsPage")
);

const TenantsPage = lazy(
  () => import("../pages/tenants/TenantsPage")
);

const AddTenantPage = lazy(
  () => import("../pages/tenants/AddTenantPage")
);

const TenantDetailsPage = lazy(
  () => import("../pages/tenants/TenantDetailsPage")
);

const PlansPage = lazy(
  () => import("../pages/plans/PlansPage")
);

const AddPlanPage = lazy(
  () => import("../pages/plans/AddPlanPage")
);

const TenantSubscriptionPage = lazy(
  () => import("../pages/subscriptions/TenantSubscriptionPage")
);

const MyPlanPage = lazy(
  () => import("../pages/subscriptions/MyPlanPage")
);

const NotFoundPage = lazy(
  () => import("../pages/NotFoundPage")
);

const ProtectedRoute = lazy(
  () => import("./ProtectedRoute")
);

const TimelinePage = lazy(
  () => import("../pages/timeline/TimelinePage")
);

const TimesheetsPage = lazy(
  () => import("../pages/timesheets/TimesheetsPage")
);

const AddTimesheetPage = lazy(
  () => import("../pages/timesheets/AddTimesheetPage")
);

const EditTimesheetPage = lazy(
  () => import("../pages/timesheets/EditTimesheetPage")
);

const ViewTimesheetPage = lazy(
  () => import("../pages/timesheets/ViewTimesheetPage")
);

const ProjectTimelinePage = lazy(
  () => import("../pages/project-timeline/ProjectTimelinePage")
);

const PaymentsPage = lazy(
  () => import("../pages/payments/PaymentsPage")
);

const AddPaymentPage = lazy(
  () => import("../pages/payments/AddPaymentPage")
);

const EditPaymentPage = lazy(
  () => import("../pages/payments/EditPaymentPage")
);

const ViewPaymentPage = lazy(
  () => import("../pages/payments/ViewPaymentPage")
);

const PaymentAllocationsPage = lazy(
  () => import("../pages/payments/allocations/PaymentAllocationsPage")
);

const AddPaymentAllocationPage = lazy(
  () => import("../pages/payments/allocations/AddPaymentAllocationPage")
);

const ExpensesPage = lazy(
  () => import("../pages/expenses/ExpensesPage")
);

const AddExpensePage = lazy(
  () => import("../pages/expenses/AddExpensePage")
);

const EditExpensePage = lazy(
  () => import("../pages/expenses/EditExpensePage")
);

const PurchasesPage = lazy(
  () => import("../pages/purchases/PurchasesPage")
);

const AddPurchasePage = lazy(
  () => import("../pages/purchases/AddPurchasePage")
);

const EditPurchasePage = lazy(
  () => import("../pages/purchases/EditPurchasePage")
);

const PurchaseOrdersPage = lazy(
  () => import("../pages/purchase-orders/PurchaseOrdersPage")
);

const AddPurchaseOrderPage = lazy(
  () => import("../pages/purchase-orders/AddPurchaseOrderPage")
);

const EditPurchaseOrderPage = lazy(
  () => import("../pages/purchase-orders/EditPurchaseOrderPage")
);

const ViewPurchaseOrderPage = lazy(
  () => import("../pages/purchase-orders/ViewPurchaseOrderPage")
);

const ReceivePurchaseOrderPage = lazy(
  () => import("../pages/purchase-orders/ReceivePurchaseOrderPage")
);

const VendorsPage = lazy(
  () => import("../pages/vendors/VendorsPage")
);

const AddVendorPage = lazy(
  () => import("../pages/vendors/AddVendorPage")
);

const EditVendorPage = lazy(
  () => import("../pages/vendors/EditVendorPage")
);

const ViewVendorPage = lazy(
  () => import("../pages/vendors/ViewVendorPage")
);

const VendorBillsPage = lazy(
  () => import("../pages/vendor-bills/VendorBillsPage")
);

const AddVendorBillPage = lazy(
  () => import("../pages/vendor-bills/AddVendorBillPage")
);

const EditVendorBillPage = lazy(
  () => import("../pages/vendor-bills/EditVendorBillPage")
);

const ViewVendorBillPage = lazy(
  () => import("../pages/vendor-bills/ViewVendorBillPage")
);

const ApplyVendorBillPaymentPage = lazy(
  () => import("../pages/vendor-bills/ApplyVendorBillPaymentPage")
);

const ProductsPage = lazy(
  () => import("../pages/products/ProductsPage")
);

const AddProductPage = lazy(
  () => import("../pages/products/AddProductPage")
);

const EditProductPage = lazy(
  () => import("../pages/products/EditProductPage")
);

const ViewProductPage = lazy(
  () => import("../pages/products/ViewProductPage")
);

const WarehousesPage = lazy(
  () => import("../pages/warehouses/WarehousesPage")
);

const AddWarehousePage = lazy(
  () => import("../pages/warehouses/AddWarehousePage")
);

const EditWarehousePage = lazy(
  () => import("../pages/warehouses/EditWarehousePage")
);

const ViewWarehousePage = lazy(
  () => import("../pages/warehouses/ViewWarehousePage")
);

const StockMovementsPage = lazy(
  () => import("../pages/stock-movements/StockMovementsPage")
);

const AddStockMovementPage = lazy(
  () => import("../pages/stock-movements/AddStockMovementPage")
);

const ViewStockMovementPage = lazy(
  () => import("../pages/stock-movements/ViewStockMovementPage")
);

const StockCountsPage = lazy(
  () => import("../pages/stock-counts/StockCountsPage")
);

const AddStockCountPage = lazy(
  () => import("../pages/stock-counts/AddStockCountPage")
);

const InventoryReportPage = lazy(
  () => import("../pages/reports/InventoryReportPage")
);

const InventorySettingsPage = lazy(
  () => import("../pages/settings/InventorySettingsPage")
);

const AttachmentsPage = lazy(
  () => import("../pages/attachments/AttachmentsPage")
);

const InvoicesPage = lazy(
  () => import("../pages/invoices/InvoicesPage")
);

const AddInvoicePage = lazy(
  () => import("../pages/invoices/AddInvoicePage")
);

const EditInvoicePage = lazy(
  () => import("../pages/invoices/EditInvoicePage")
);

const ViewInvoicePage = lazy(
  () => import("../pages/invoices/ViewInvoicePage")
);

const router = createBrowserRouter([
  {
    path: "/",
    element: <LoginPage />,
  },

  {
    path: "/login",
    element: <LoginPage />,
  },

  {
    path: "/dashboard",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE]}>
        <Suspense fallback={<PageLoader />}>
          <DashboardPage />
        </Suspense>
      </ProtectedRoute>
    )
  },

  {
    path: "/employees",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE]}>
        <Suspense fallback={<PageLoader />}>
          <EmployeesPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/employees/view/:id",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE]}>
        <Suspense fallback={<PageLoader />}>
          <ViewEmployeePage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/employees/add",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}>
        <Suspense fallback={<PageLoader />}>
          <AddEmployeePage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/employees/edit/:id",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}>
        <Suspense fallback={<PageLoader />}>
          <EditEmployeePage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/employees/profile/me",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE]}>
        <Suspense fallback={<PageLoader />}>
          <MyProfilePage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/users",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE]}>
        <Suspense fallback={<PageLoader />}>
          <UsersPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/users/add",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]}>
        <Suspense fallback={<PageLoader />}>
          <AddUserPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/users/edit/:id",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]}>
        <Suspense fallback={<PageLoader />}>
          <EditUserPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/users/view/:id",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE]}>
        <Suspense fallback={<PageLoader />}>
          <ViewUserPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/clients/edit/:id",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}>
        <Suspense fallback={<PageLoader />}>
          <EditClientPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/clients",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE]}>
        <Suspense fallback={<PageLoader />}>
          <ClientsPage />
        </Suspense> 
      </ProtectedRoute>
    ),
  },

  {
    path: "/clients/view/:id",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE]}>
        <Suspense fallback={<PageLoader />}>
          <ViewClientPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/clients/add",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}>
        <Suspense fallback={<PageLoader />}>
          <AddClientPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/projects",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE]}>
        <Suspense fallback={<PageLoader />}>
          <ProjectsPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/projects/add",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]}>
        <Suspense fallback={<PageLoader />}>
          <AddProjectPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "/projects/view/:id",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE]}>
        <Suspense fallback={<PageLoader />}>
          <ViewProjectPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "/projects/edit/:id",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]}>
        <Suspense fallback={<PageLoader />}>
          <EditProjectPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "/projects/:projectId/kanban",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE]}>
        <Suspense fallback={<PageLoader />}>
          <KanbanPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  
  {
    path: "/milestones",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE]}>
        <Suspense fallback={<PageLoader />}>
          <MilestonesPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/timeline",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE]}>
        <TimelinePage />
      </ProtectedRoute>
    ),
  },

  {
    path: "/milestones/add",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]}>
        <Suspense fallback={<PageLoader />}>
          <AddMilestonePage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/milestones/view/:id",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE]}>
        <Suspense fallback={<PageLoader />}>
          <ViewMilestonePage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/milestones/edit/:id",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]}>
        <Suspense fallback={<PageLoader />}>
          <EditMilestonePage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/tasks",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE]}>
        <Suspense fallback={<PageLoader />}>
          <TasksPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/tasks/add",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]}>
        <Suspense fallback={<PageLoader />}>
          <AddTaskPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/tasks/view/:id",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE]}>
        <Suspense fallback={<PageLoader />}>
          <ViewTaskPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/tasks/edit/:id",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]}>
        <Suspense fallback={<PageLoader />}>
          <EditTaskPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/timesheets",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]}>
        <TimesheetsPage />
      </ProtectedRoute>
    ),
  },

  {
    path: "/timesheets/add",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE]}>
        <AddTimesheetPage />
      </ProtectedRoute>
    ),
  },

  {
    path: "/timesheets/edit/:id",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]}>
        <EditTimesheetPage />
      </ProtectedRoute>
    ),
  },

  {
    path: "/timesheets/:id",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE]}>
        <ViewTimesheetPage />
      </ProtectedRoute>
    ),
  },

  {
    path: "/project-timeline",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE]}>
        <Suspense fallback={<PageLoader />}>
          <ProjectTimelinePage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/invoices",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]}>
        <Suspense fallback={<PageLoader />}>
          <InvoicesPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/invoices/add",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]}>
        <Suspense fallback={<PageLoader />}>
          <AddInvoicePage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/invoices/edit/:id",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]}>
        <Suspense fallback={<PageLoader />}>
          <EditInvoicePage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/invoices/:id",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]}>
        <Suspense fallback={<PageLoader />}>
          <ViewInvoicePage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/payments",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]}>
        <Suspense fallback={<PageLoader />}>
          <PaymentsPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/payments/add",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]}>
        <Suspense fallback={<PageLoader />}>
          <AddPaymentPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/payments/edit/:id",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]}>
        <Suspense fallback={<PageLoader />}>
          <EditPaymentPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/payments/:id",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]}>
        <Suspense fallback={<PageLoader />}>
          <ViewPaymentPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/payments/allocations",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]}>
        <Suspense fallback={<PageLoader />}>
          <PaymentAllocationsPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/payments/allocations/add",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]}>
        <Suspense fallback={<PageLoader />}>
          <AddPaymentAllocationPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/expenses",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]}>
        <Suspense fallback={<PageLoader />}>
          <ExpensesPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/expenses/add",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]}>
        <Suspense fallback={<PageLoader />}>
          <AddExpensePage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/expenses/edit/:id",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]}>
        <Suspense fallback={<PageLoader />}>
          <EditExpensePage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/purchases",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]}>
        <Suspense fallback={<PageLoader />}>
          <PurchasesPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/purchases/add",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]}>
        <Suspense fallback={<PageLoader />}>
          <AddPurchasePage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/purchases/edit/:id",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]}>
        <Suspense fallback={<PageLoader />}>
          <EditPurchasePage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/purchase-orders",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]}>
        <Suspense fallback={<PageLoader />}>
          <PurchaseOrdersPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/purchase-orders/add",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]}>
        <Suspense fallback={<PageLoader />}>
          <AddPurchaseOrderPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/purchase-orders/edit/:id",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]}>
        <Suspense fallback={<PageLoader />}>
          <EditPurchaseOrderPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/purchase-orders/:id",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]}>
        <Suspense fallback={<PageLoader />}>
          <ViewPurchaseOrderPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/purchase-orders/:id/receive",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]}>
        <Suspense fallback={<PageLoader />}>
          <ReceivePurchaseOrderPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/vendors",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]}>
        <Suspense fallback={<PageLoader />}>
          <VendorsPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/vendors/add",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]}>
        <Suspense fallback={<PageLoader />}>
          <AddVendorPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/vendors/edit/:id",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]}>
        <Suspense fallback={<PageLoader />}>
          <EditVendorPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/vendors/:id",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]}>
        <Suspense fallback={<PageLoader />}>
          <ViewVendorPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/vendor-bills",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]}>
        <Suspense fallback={<PageLoader />}>
          <VendorBillsPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/vendor-bills/add",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]}>
        <Suspense fallback={<PageLoader />}>
          <AddVendorBillPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/vendor-bills/:id/edit",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]}>
        <Suspense fallback={<PageLoader />}>
          <EditVendorBillPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/vendor-bills/:id",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]}>
        <Suspense fallback={<PageLoader />}>
          <ViewVendorBillPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/vendor-bills/:id/apply-payment",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]}>
        <Suspense fallback={<PageLoader />}>
          <ApplyVendorBillPaymentPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/products",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]}>
        <Suspense fallback={<PageLoader />}>
          <ProductsPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/products/add",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]}>
        <Suspense fallback={<PageLoader />}>
          <AddProductPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/products/edit/:id",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]}>
        <Suspense fallback={<PageLoader />}>
          <EditProductPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/products/:id",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]}>
        <Suspense fallback={<PageLoader />}>
          <ViewProductPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/warehouses",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]}>
        <Suspense fallback={<PageLoader />}>
          <WarehousesPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/warehouses/add",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]}>
        <Suspense fallback={<PageLoader />}>
          <AddWarehousePage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/warehouses/edit/:id",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]}>
        <Suspense fallback={<PageLoader />}>
          <EditWarehousePage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/warehouses/:id",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]}>
        <Suspense fallback={<PageLoader />}>
          <ViewWarehousePage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/stock-movements",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]}>
        <Suspense fallback={<PageLoader />}>
          <StockMovementsPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/stock-movements/add",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]}>
        <Suspense fallback={<PageLoader />}>
          <AddStockMovementPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/stock-movements/:id",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]}>
        <Suspense fallback={<PageLoader />}>
          <ViewStockMovementPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/stock-counts",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]}>
        <Suspense fallback={<PageLoader />}>
          <StockCountsPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/stock-counts/add",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]}>
        <Suspense fallback={<PageLoader />}>
          <AddStockCountPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/reports/inventory",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]}>
        <Suspense fallback={<PageLoader />}>
          <InventoryReportPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/inventory-settings",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}>
        <Suspense fallback={<PageLoader />}>
          <InventorySettingsPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/attachments",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE]}>
        <Suspense fallback={<PageLoader />}>
          <AttachmentsPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/attendance",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.EMPLOYEE]}>
        <Suspense fallback={<PageLoader />}>
          <AttendancePage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "/attendance/add",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.EMPLOYEE]}>
        <Suspense fallback={<PageLoader />}>
          <AddAttendancePage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "/attendance/check-in",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.EMPLOYEE]}>
        <Suspense fallback={<PageLoader />}>
          <CheckInPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "/attendance/history",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.EMPLOYEE]}>
        <Suspense fallback={<PageLoader />}>
          <AttendanceHistoryPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/leaves",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.EMPLOYEE]}>
        <Suspense fallback={<PageLoader />}>
          <LeavesPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "/leaves/add",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.EMPLOYEE]}>
        <Suspense fallback={<PageLoader />}>
          <AddLeavePage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "/leaves/edit/:id",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.EMPLOYEE]}>
        <Suspense fallback={<PageLoader />}>
          <EditLeavePage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "/leaves/view/:id",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.EMPLOYEE]}>
        <Suspense fallback={<PageLoader />}>
          <ViewLeavePage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/daily-work-reports",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE]}>
        <Suspense fallback={<PageLoader />}>
          <DailyWorkReportsPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/daily-work-reports/add",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE]}>
        <Suspense fallback={<PageLoader />}>
          <AddDailyWorkReportPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/daily-work-reports/edit/:id",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE]}>
        <Suspense fallback={<PageLoader />}>
          <EditDailyWorkReportPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/daily-work-reports/view/:id",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE]}>
        <Suspense fallback={<PageLoader />}>
          <ViewDailyWorkReportPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/payroll",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]}>
        <Suspense fallback={<PageLoader />}>
          <PayrollPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/payroll/add",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]}>
        <Suspense fallback={<PageLoader />}>
          <AddPayrollPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/payroll/edit/:id",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]}>
        <Suspense fallback={<PageLoader />}>
          <EditPayrollPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/payroll/view/:id",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]}>
        <Suspense fallback={<PageLoader />}>
          <ViewPayrollPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/notifications",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE]}>
        <Suspense fallback={<PageLoader />}>
          <NotificationsPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/activity-logs",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
        <Suspense fallback={<PageLoader />}>
          <ActivityLogsPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/reports",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <ReportsPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/reports/sales",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <SalesReportPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/reports/receivables",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <ReceivablesReportPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/reports/customers",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <CustomerReportPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/reports/expenses",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <ExpenseReportPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/reports/purchases",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <PurchaseReportPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/reports/vendors",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <VendorReportPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/reports/profitability",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <ProfitabilityReportPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/reports/employees",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <EmployeeDirectoryReportPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/reports/attendance-summary",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <AttendanceSummaryReportPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/reports/leave-report",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <LeaveReportPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/reports/payroll-summary",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <PayrollSummaryReportPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/comments",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE]}>
        <Suspense fallback={<PageLoader />}>
          <CommentsPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/comments/add",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE]}>
        <Suspense fallback={<PageLoader />}>
          <AddCommentPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/comments/edit/:id",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE]}>
        <Suspense fallback={<PageLoader />}>
          <EditCommentPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/crm",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE]}>
        <Suspense fallback={<PageLoader />}>
          <LeadsPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/crm/add",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]}>
        <Suspense fallback={<PageLoader />}>
          <AddLeadPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/crm/edit/:id",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]}>
        <Suspense fallback={<PageLoader />}>
          <EditLeadPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/crm/view/:id",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE]}>
        <Suspense fallback={<PageLoader />}>
          <ViewLeadPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/sales-orders",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]}>
        <Suspense fallback={<PageLoader />}>
          <SalesOrdersPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/sales-orders/add",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]}>
        <Suspense fallback={<PageLoader />}>
          <AddSalesOrderPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/sales-orders/edit/:id",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]}>
        <Suspense fallback={<PageLoader />}>
          <EditSalesOrderPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/sales-orders/view/:id",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]}>
        <Suspense fallback={<PageLoader />}>
          <ViewSalesOrderPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/sales-orders/:id",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]}>
        <Suspense fallback={<PageLoader />}>
          <ViewSalesOrderPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/sales-orders/:id/edit",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]}>
        <Suspense fallback={<PageLoader />}>
          <EditSalesOrderPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/settings",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
        <Suspense fallback={<PageLoader />}>
          <SettingsPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/tenants",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
        <Suspense fallback={<PageLoader />}>
          <TenantsPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/tenants/add",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
        <Suspense fallback={<PageLoader />}>
          <AddTenantPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/tenants/:id",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
        <Suspense fallback={<PageLoader />}>
          <TenantDetailsPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/tenants/:id/subscription",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
        <Suspense fallback={<PageLoader />}>
          <TenantSubscriptionPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/plans",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
        <Suspense fallback={<PageLoader />}>
          <PlansPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/plans/add",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
        <Suspense fallback={<PageLoader />}>
          <AddPlanPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/my-plan",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}>
        <Suspense fallback={<PageLoader />}>
          <MyPlanPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

export default router;