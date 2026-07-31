import PageLoader from "../components/common/PageLoader";
import { createBrowserRouter } from "react-router-dom";
import { lazy, Suspense } from "react";

import LoginPage from "../pages/auth/LoginPage";
// import DashboardPage from "../pages/dashboard/DashboardPage";

// import EmployeesPage from "../pages/employees/EmployeesPage";
import AddEmployeePage from "../pages/employees/AddEmployeePage";
import EditEmployeePage from "../pages/employees/EditEmployeePage";
import ViewEmployeePage from "../pages/employees/ViewEmployeePage";

import ClientsPage from "../pages/clients/ClientsPage";
import AddClientPage from "../pages/clients/AddClientPage";
import EditClientPage from "../pages/clients/EditClientPage";

// import ProjectsPage from "../pages/projects/ProjectsPage";
import AddProjectPage from "../pages/projects/AddProjectPage";
import ViewProjectPage from "../pages/projects/ViewProjectPage";
import EditProjectPage from "../pages/projects/EditProjectPage";

import TasksPage from "../pages/tasks/TasksPage";
import AddTaskPage from "../pages/tasks/AddTaskPage";
import ViewTaskPage from "../pages/tasks/ViewTaskPage";
import EditTaskPage from "../pages/tasks/EditTaskPage";

import AttendancePage from "../pages/attendance/AttendancePage";
import CheckInPage from "../pages/attendance/CheckInPage";
import AttendanceHistoryPage from "../pages/attendance/AttendanceHistoryPage";

import LeavesPage from "../pages/leaves/LeavesPage";
import AddLeavePage from "../pages/leaves/AddLeavePage";
import EditLeavePage from "../pages/leaves/EditLeavePage";
import ViewLeavePage from "../pages/leaves/ViewLeavePage";
import ReportsPage from "../pages/reports/ReportsPage";

import LeadsPage from "../pages/crm/LeadsPage";
import AddLeadPage from "../pages/crm/AddLeadPage";
import EditLeadPage from "../pages/crm/EditLeadPage";
import ViewLeadPage from "../pages/crm/ViewLeadPage";

import CommentsPage from "../components/comments/CommentsPage";
import AddCommentPage from "../pages/comments/AddCommentPage";
// import EditCommentPage from "../pages/comments/EditCommentPage";

import DailyWorkReportsPage from "../pages/daily-work-reports/DailyWorkReportsPage";
import AddDailyWorkReportPage from "../pages/daily-work-reports/AddDailyWorkReportPage";
import EditDailyWorkReportPage from "../pages/daily-work-reports/EditDailyWorkReportPage";
import ViewDailyWorkReportPage from "../pages/daily-work-reports/ViewDailyWorkReportPage";

import NotificationsPage from "../pages/notifications/NotificationsPage";
import ActivityLogsPage from "../pages/activity-logs/ActivityLogsPage";
import SettingsPage from "../pages/settings/SettingsPage";
import NotFoundPage from "../pages/NotFoundPage";

import ProtectedRoute from "./ProtectedRoute";

const DashboardPage = lazy(
  () => import("../pages/dashboard/DashboardPage")
);

const EmployeesPage = lazy(
  () => import("../pages/employees/EmployeesPage")
);

const ProjectsPage = lazy(
  () => import("../pages/projects/ProjectsPage")
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
        <ViewEmployeePage />
      </ProtectedRoute>
    ),
  },

  {
    path: "/employees/add",
    element: (
      <ProtectedRoute>
        <AddEmployeePage />
      </ProtectedRoute>
    ),
  },

  {
    path: "/employees/edit/:id",
    element: (
      <ProtectedRoute>
        <EditEmployeePage />
      </ProtectedRoute>
    ),
  },

  {
    path: "/clients/edit/:id",
    element: (
      <ProtectedRoute>
        <EditClientPage />
      </ProtectedRoute>
    ),
  },

  {
    path: "/clients",
    element: (
      <ProtectedRoute>
        <ClientsPage />
      </ProtectedRoute>
    ),
  },

  {
    path: "/clients/add",
    element: (
      <ProtectedRoute>
        <AddClientPage />
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
        <AddProjectPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/projects/view/:id",
    element: (
      <ProtectedRoute>
        <ViewProjectPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/projects/edit/:id",
    element: (
      <ProtectedRoute>
        <EditProjectPage />
      </ProtectedRoute>
    ),
  },

  {
    path: "/tasks",
    element: (
      <ProtectedRoute>
        <TasksPage />
      </ProtectedRoute>
    ),
  },

  {
    path: "/tasks/add",
    element: (
      <ProtectedRoute>
        <AddTaskPage />
      </ProtectedRoute>
    ),
  },

  {
    path: "/tasks/view/:id",
    element: (
      <ProtectedRoute>
        <ViewTaskPage />
      </ProtectedRoute>
    ),
  },

  {
    path: "/tasks/edit/:id",
    element: (
      <ProtectedRoute>
        <EditTaskPage />
      </ProtectedRoute>
    ),
  },

  {
    path: "/attendance",
    element: (
      <ProtectedRoute>
        <AttendancePage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/attendance/checkin",
    element: (
      <ProtectedRoute>
        <CheckInPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/attendance/history",
    element: (
      <ProtectedRoute>
        <AttendanceHistoryPage />
      </ProtectedRoute>
    ),
  },

  {
    path: "/leaves",
    element: (
      <ProtectedRoute>
        <LeavesPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/leaves/add",
    element: (
      <ProtectedRoute>
        <AddLeavePage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/leaves/edit/:id",
    element: (
      <ProtectedRoute>
        <EditLeavePage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/leaves/view/:id",
    element: (
      <ProtectedRoute>
        <ViewLeavePage />
      </ProtectedRoute>
    ),
  },

  {
    path: "/daily-work-reports",
    element: (
      <ProtectedRoute>
        <DailyWorkReportsPage />
      </ProtectedRoute>
    ),
  },

  {
    path: "/daily-work-reports/add",
    element: (
      <ProtectedRoute>
        <AddDailyWorkReportPage />
      </ProtectedRoute>
    ),
  },

  {
    path: "/daily-work-reports/edit/:id",
    element: (
      <ProtectedRoute>
        <EditDailyWorkReportPage />
      </ProtectedRoute>
    ),
  },

  {
    path: "/daily-work-reports/view/:id",
    element: (
      <ProtectedRoute>
        <ViewDailyWorkReportPage />
      </ProtectedRoute>
    ),
  },

  {
    path: "/notifications",
    element: (
      <ProtectedRoute>
        <NotificationsPage />
      </ProtectedRoute>
    ),
  },

  {
    path: "/activity-logs",
    element: (
      <ProtectedRoute>
        <ActivityLogsPage />
      </ProtectedRoute>
    ),
  },

  {
    path: "/reports",
    element: (
      <ProtectedRoute>
        <ReportsPage />
      </ProtectedRoute>
    ),
  },

  {
    path: "/comments",
    element: (
      <ProtectedRoute>
        <CommentsPage />
      </ProtectedRoute>
    ),
  },

  {
    path: "/comments/add",
    element: (
      <ProtectedRoute>
        <AddCommentPage />
      </ProtectedRoute>
    ),
  },

  // {
  //   path: "/comments/edit/:id",
  //   element: (
  //     <ProtectedRoute>
  //       <EditCommentPage />
  //     </ProtectedRoute>
  //   ),
  // },

  {
    path: "/crm",
    element: (
      <ProtectedRoute>
        <LeadsPage />
      </ProtectedRoute>
    ),
  },

  {
    path: "/crm/add",
    element: (
      <ProtectedRoute>
        <AddLeadPage />
      </ProtectedRoute>
    ),
  },

  {
    path: "/crm/edit/:id",
    element: (
      <ProtectedRoute>
        <EditLeadPage />
      </ProtectedRoute>
    ),
  },

  {
    path: "/crm/view/:id",
    element: (
      <ProtectedRoute>
        <ViewLeadPage />
      </ProtectedRoute>
    ),
  },

  {
    path: "/settings",
    element: (
      <ProtectedRoute>
        <SettingsPage />
      </ProtectedRoute>
    ),
  },

  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

export default router;