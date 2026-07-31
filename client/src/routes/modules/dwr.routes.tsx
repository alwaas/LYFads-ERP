import { Route } from "react-router-dom";

import DailyWorkReportsPage from "../../pages/daily-work-reports/DailyWorkReportsPage";
import AddDailyWorkReportPage from "../../pages/daily-work-reports/AddDailyWorkReportPage";
import EditDailyWorkReportPage from "../../pages/daily-work-reports/EditDailyWorkReportPage";
import ViewDailyWorkReportPage from "../../pages/daily-work-reports/ViewDailyWorkReportPage";

import { PATHS } from "../config/paths";

export function DailyWorkReportRoutes() {
  return (
    <>
      <Route
        path={PATHS.DAILY_WORK_REPORTS}
        element={<DailyWorkReportsPage />}
      />

      <Route
        path={PATHS.ADD_DAILY_WORK_REPORT}
        element={<AddDailyWorkReportPage />}
      />

      <Route
        path={PATHS.EDIT_DAILY_WORK_REPORT}
        element={<EditDailyWorkReportPage />}
      />

      <Route
        path={PATHS.VIEW_DAILY_WORK_REPORT}
        element={<ViewDailyWorkReportPage />}
      />
    </>
  );
}