import { useAuthStore } from "../stores/auth.store";
import { permissions } from "../utils/permissions";

type ModuleName = keyof typeof permissions;

export function usePermission() {
  const user = useAuthStore((state) => state.user);

  function hasPermission(
    module: ModuleName,
    action: "view" | "create" | "edit" | "delete"
  ) {
    if (!user) return false;

    const allowedRoles = permissions[module]?.[action] ?? [];

    return (allowedRoles as readonly string[]).includes(user.role);
  }

  return {
    hasPermission,
  };
}
