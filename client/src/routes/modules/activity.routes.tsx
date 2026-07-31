import { Route } from "react-router-dom";

import ActivityLogsPage from "../../pages/activity-logs/ActivityLogsPage";

import { PATHS } from "../config/paths";

export function ActivityRoutes() {
  return (
    <Route
      path={PATHS.ACTIVITY_LOGS}
      element={<ActivityLogsPage />}
    />
  );
}