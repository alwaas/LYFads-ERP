import { Route } from "react-router-dom";

import ClientsPage from "../../pages/clients/ClientsPage";
import AddClientPage from "../../pages/clients/AddClientPage";
import EditClientPage from "../../pages/clients/EditClientPage";
import ViewClientPage from "../../pages/clients/ViewClientPage";

import { PATHS } from "../config/paths";

export function ClientRoutes() {
  return (
    <>
      <Route
        path={PATHS.CLIENTS}
        element={<ClientsPage />}
      />

      <Route
        path={PATHS.ADD_CLIENT}
        element={<AddClientPage />}
      />

      <Route
        path={PATHS.EDIT_CLIENT}
        element={<EditClientPage />}
      />

      <Route
        path={PATHS.VIEW_CLIENT}
        element={<ViewClientPage />}
      />
    </>
  );
}