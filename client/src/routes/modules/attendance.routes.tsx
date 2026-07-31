import { Route } from "react-router-dom";

import AttendancePage from "../../pages/attendance/AttendancePage";
import AttendanceHistoryPage from "../../pages/attendance/AttendanceHistoryPage";
import CheckInPage from "../../pages/attendance/CheckInPage";

import { PATHS } from "../config/paths";

export function AttendanceRoutes() {
  return (
    <>
      <Route
        path={PATHS.ATTENDANCE}
        element={<AttendancePage />}
      />

      <Route
        path="/attendance/history"
        element={<AttendanceHistoryPage />}
      />

      <Route
        path="/attendance/check-in"
        element={<CheckInPage />}
      />
    </>
  );
}