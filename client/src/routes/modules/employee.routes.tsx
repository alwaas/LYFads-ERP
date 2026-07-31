import { Route } from "react-router-dom";

import EmployeesPage from "../../pages/employees/EmployeesPage";
import AddEmployeePage from "../../pages/employees/AddEmployeePage";
import EditEmployeePage from "../../pages/employees/EditEmployeePage";
import ViewEmployeePage from "../../pages/employees/ViewEmployeePage";

import { PATHS } from "../config/paths";

export function EmployeeRoutes() {
  return (
    <>
      <Route
        path={PATHS.EMPLOYEES}
        element={<EmployeesPage />}
      />

      <Route
        path={PATHS.ADD_EMPLOYEE}
        element={<AddEmployeePage />}
      />

      <Route
        path={PATHS.EDIT_EMPLOYEE}
        element={<EditEmployeePage />}
      />

      <Route
        path={PATHS.VIEW_EMPLOYEE}
        element={<ViewEmployeePage />}
      />
    </>
  );
}