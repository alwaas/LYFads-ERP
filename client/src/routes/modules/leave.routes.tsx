import { Route } from "react-router-dom";

import LeavesPage from "../../pages/leaves/LeavesPage";
import AddLeavePage from "../../pages/leaves/AddLeavePage";
import EditLeavePage from "../../pages/leaves/EditLeavePage";
import ViewLeavePage from "../../pages/leaves/ViewLeavePage";

import { PATHS } from "../config/paths";

export function LeaveRoutes() {
  return (
    <>
      <Route
        path={PATHS.LEAVES}
        element={<LeavesPage />}
      />

      <Route
        path={PATHS.ADD_LEAVE}
        element={<AddLeavePage />}
      />

      <Route
        path={PATHS.EDIT_LEAVE}
        element={<EditLeavePage />}
      />

      <Route
        path={PATHS.VIEW_LEAVE}
        element={<ViewLeavePage />}
      />
    </>
  );
}