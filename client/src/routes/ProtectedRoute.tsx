import { Navigate } from "react-router-dom";
import { useAuthStore } from "../stores/auth.store";
import { ROLES } from "../constants/roles";
import UnauthorizedPage from "../pages/UnauthorizedPage";

type Props = {
  children: React.ReactNode;
  allowedRoles?: readonly (typeof ROLES)[keyof typeof ROLES][];
};

function ProtectedRoute({ children, allowedRoles }: Props) {
  const isAuthenticated = useAuthStore(
    (state) => state.isAuthenticated
  );

  const userRole = useAuthStore(
    (state) => state.user?.role
  );

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(userRole as any)) {
    return <UnauthorizedPage />;
  }

  return children;
}

export default ProtectedRoute;
