import { Navigate } from "react-router-dom";
import { useAuthStore } from "../stores/auth.store";

type Props = {
  children: React.ReactNode;
};

function ProtectedRoute({ children }: Props) {
  const isAuthenticated = useAuthStore(
    (state) => state.isAuthenticated
  );

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;