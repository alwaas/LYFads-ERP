import { Route } from "react-router-dom";

import MilestonesPage from "../../pages/milestones/MilestonesPage";
import AddMilestonePage from "../../pages/milestones/AddMilestonePage";
import EditMilestonePage from "../../pages/milestones/EditMilestonePage";
import ViewMilestonePage from "../../pages/milestones/ViewMilestonePage";

import { PATHS } from "../config/paths";

export function MilestoneRoutes() {
  return (
    <>
      <Route
        path={PATHS.MILESTONES}
        element={<MilestonesPage />}
      />

      <Route
        path={PATHS.ADD_MILESTONE}
        element={<AddMilestonePage />}
      />

      <Route
        path={PATHS.EDIT_MILESTONE}
        element={<EditMilestonePage />}
      />

      <Route
        path={PATHS.VIEW_MILESTONE}
        element={<ViewMilestonePage />}
      />
    </>
  );
}