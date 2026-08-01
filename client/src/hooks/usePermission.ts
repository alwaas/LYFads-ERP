import { useAuthStore } from "../stores/auth.store";
import { permissions } from "../utils/permissions";

export function usePermission() {
  const user = useAuthStore((state) => state.user);

  const hasPermission = (
    module: keyof typeof permissions,
    action: keyof typeof permissions.projects
  ) => {
    if (!user) return false;

    return permissions[module][action].includes(
      user.role as never
    );
  };

  return {
    hasPermission,
  };
}