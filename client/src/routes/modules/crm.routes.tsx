import { Route } from "react-router-dom";

import LeadsPage from "../../pages/crm/LeadsPage";
import AddLeadPage from "../../pages/crm/AddLeadPage";
import EditLeadPage from "../../pages/crm/EditLeadPage";
import ViewLeadPage from "../../pages/crm/ViewLeadPage";

import { PATHS } from "../config/paths";

export function CrmRoutes() {
  return (
    <>
      <Route
        path={PATHS.CRM}
        element={<LeadsPage />}
      />

      <Route
        path={PATHS.ADD_LEAD}
        element={<AddLeadPage />}
      />

      <Route
        path={PATHS.EDIT_LEAD}
        element={<EditLeadPage />}
      />

      <Route
        path={PATHS.VIEW_LEAD}
        element={<ViewLeadPage />}
      />
    </>
  );
}