import { Route } from "react-router-dom";

import SettingsPage from "../../pages/settings/SettingsPage";

import { PATHS } from "../config/paths";

export function SettingsRoutes() {
  return (
    <Route
      path={PATHS.SETTINGS}
      element={<SettingsPage />}
    />
  );
}