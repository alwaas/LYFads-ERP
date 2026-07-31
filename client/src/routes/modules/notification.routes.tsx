import { Route } from "react-router-dom";

import NotificationsPage from "../../pages/notifications/NotificationsPage";

import { PATHS } from "../config/paths";

export function NotificationRoutes() {
  return (
    <Route
      path={PATHS.NOTIFICATIONS}
      element={<NotificationsPage />}
    />
  );
}