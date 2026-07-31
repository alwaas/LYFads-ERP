import { Route } from "react-router-dom";

import DashboardPage from "../../pages/dashboard/DashboardPage";

import { PATHS } from "../config/paths";

export function DashboardRoutes() {
  return (
    <>
      <Route
        path={PATHS.DASHBOARD}
        element={<DashboardPage />}
      />
    </>
  );
}