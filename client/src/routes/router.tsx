import PageLoader from "../components/common/PageLoader";
import { createBrowserRouter } from "react-router-dom";
import { lazy, Suspense } from "react";

import LoginPage from "../pages/auth/LoginPage";
import ViewClientPage from "../pages/clients/ViewClientPage";
// import DashboardPage from "../pages/dashboard/DashboardPage";

// import EmployeesPage from "../pages/employees/EmployeesPage";
// import AddEmployeePage from "../pages/employees/AddEmployeePage";
// import EditEmployeePage from "../pages/employees/EditEmployeePage";
// import ViewEmployeePage from "../pages/employees/ViewEmployeePage";

// import ClientsPage from "../pages/clients/ClientsPage";
// import AddClientPage from "../pages/clients/AddClientPage";
// import EditClientPage from "../pages/clients/EditClientPage";

// import ProjectsPage from "../pages/projects/ProjectsPage";
// import AddProjectPage from "../pages/projects/AddProjectPage";
// import ViewProjectPage from "../pages/projects/ViewProjectPage";
// import EditProjectPage from "../pages/projects/EditProjectPage";

// import TasksPage from "../pages/tasks/TasksPage";
// import AddTaskPage from "../pages/tasks/AddTaskPage";
// import ViewTaskPage from "../pages/tasks/ViewTaskPage";
// import EditTaskPage from "../pages/tasks/EditTaskPage";

// import AttendancePage from "../pages/attendance/AttendancePage";
// import CheckInPage from "../pages/attendance/CheckInPage";
// import AttendanceHistoryPage from "../pages/attendance/AttendanceHistoryPage";

// import LeavesPage from "../pages/leaves/LeavesPage";
// import AddLeavePage from "../pages/leaves/AddLeavePage";
// import EditLeavePage from "../pages/leaves/EditLeavePage";
// import ViewLeavePage from "../pages/leaves/ViewLeavePage";
// import ReportsPage from "../pages/reports/ReportsPage";

// import LeadsPage from "../pages/crm/LeadsPage";
// import AddLeadPage from "../pages/crm/AddLeadPage";
// import EditLeadPage from "../pages/crm/EditLeadPage";
// import ViewLeadPage from "../pages/crm/ViewLeadPage";

// import CommentsPage from "../components/comments/CommentsPage";
// import AddCommentPage from "../pages/comments/AddCommentPage";
// import EditCommentPage from "../pages/comments/EditCommentPage";

// import DailyWorkReportsPage from "../pages/daily-work-reports/DailyWorkReportsPage";
// import AddDailyWorkReportPage from "../pages/daily-work-reports/AddDailyWorkReportPage";
// import EditDailyWorkReportPage from "../pages/daily-work-reports/EditDailyWorkReportPage";
// import ViewDailyWorkReportPage from "../pages/daily-work-reports/ViewDailyWorkReportPage";

// import NotificationsPage from "../pages/notifications/NotificationsPage";
// import ActivityLogsPage from "../pages/activity-logs/ActivityLogsPage";
// import SettingsPage from "../pages/settings/SettingsPage";
// import NotFoundPage from "../pages/NotFoundPage";

// import ProtectedRoute from "./ProtectedRoute";
// import EditCommentPage from "../pages/comments/EditCommentPage";

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
  () => import("../pages/reports/ReportsPage")
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
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <DashboardPage />
        </Suspense>
      </ProtectedRoute>
    )
  },

  {
    path: "/employees",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <EmployeesPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/employees/view/:id",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <ViewEmployeePage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/employees/add",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <AddEmployeePage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/employees/edit/:id",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <EditEmployeePage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/clients/edit/:id",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <EditClientPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/clients",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <ClientsPage />
        </Suspense> 
      </ProtectedRoute>
    ),
  },

  {
    path: "/clients/view/:id",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <ViewClientPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/clients/add",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <AddClientPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/projects",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <ProjectsPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/projects/add",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <AddProjectPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "/projects/view/:id",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <ViewProjectPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "/projects/edit/:id",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <EditProjectPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  
  {
    path: "/milestones",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <MilestonesPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/timeline",
    element: (
      <ProtectedRoute>
        <TimelinePage />
      </ProtectedRoute>
    ),
  },

  {
    path: "/milestones/add",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <AddMilestonePage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/milestones/view/:id",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <ViewMilestonePage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/milestones/edit/:id",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <EditMilestonePage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/tasks",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <TasksPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/tasks/add",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <AddTaskPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/tasks/view/:id",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <ViewTaskPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/tasks/edit/:id",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <EditTaskPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/timesheets",
    element: (
      <ProtectedRoute>
        <TimesheetsPage />
      </ProtectedRoute>
    ),
  },

  {
    path: "/timesheets/add",
    element: (
      <ProtectedRoute>
        <AddTimesheetPage />
      </ProtectedRoute>
    ),
  },

  {
    path: "/timesheets/edit/:id",
    element: (
      <ProtectedRoute>
        <EditTimesheetPage />
      </ProtectedRoute>
    ),
  },

  {
    path: "/timesheets/:id",
    element: (
      <ProtectedRoute>
        <ViewTimesheetPage />
      </ProtectedRoute>
    ),
  },

  {
    path: "/project-timeline",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <ProjectTimelinePage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/invoices",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <InvoicesPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/invoices/add",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <AddInvoicePage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/invoices/edit/:id",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <EditInvoicePage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/invoices/:id",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <ViewInvoicePage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/payments",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <PaymentsPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/payments/add",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <AddPaymentPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/payments/edit/:id",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <EditPaymentPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/payments/:id",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <ViewPaymentPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/attachments",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <AttachmentsPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/attendance",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <AttendancePage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "/attendance/add",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <AddAttendancePage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "/attendance/check-in",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <CheckInPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "/attendance/history",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <AttendanceHistoryPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/leaves",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <LeavesPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "/leaves/add",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <AddLeavePage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "/leaves/edit/:id",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <EditLeavePage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "/leaves/view/:id",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <ViewLeavePage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/daily-work-reports",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <DailyWorkReportsPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/daily-work-reports/add",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <AddDailyWorkReportPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/daily-work-reports/edit/:id",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <EditDailyWorkReportPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/daily-work-reports/view/:id",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <ViewDailyWorkReportPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/notifications",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <NotificationsPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/activity-logs",
    element: (
      <ProtectedRoute>
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
    path: "/comments",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <CommentsPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/comments/add",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <AddCommentPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/comments/edit/:id",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <EditCommentPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/crm",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <LeadsPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/crm/add",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <AddLeadPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/crm/edit/:id",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <EditLeadPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/crm/view/:id",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <ViewLeadPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/settings",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <SettingsPage />
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