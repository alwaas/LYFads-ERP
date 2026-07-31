import { Navigate, Outlet } from "react-router-dom";

import DashboardLayout from "../layouts/DashboardLayout";
import { useAuthStore } from "../stores/auth.store";

import { PATHS } from "./config/paths";

function ProtectedLayout() {
  const isAuthenticated = useAuthStore(
    (state) => state.isAuthenticated,
  );

  if (!isAuthenticated) {
    return (
      <Navigate
        replace
        to={PATHS.LOGIN}
      />
    );
  }

  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}

export default ProtectedLayout;