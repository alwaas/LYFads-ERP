import { LogOut } from "lucide-react";

import { useAuthStore } from "../../stores/auth.store";

function UserMenu() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <button
      onClick={logout}
      className="flex items-center gap-3 rounded-lg border px-3 py-2 hover:bg-slate-100"
    >
      <div className="text-right">
        <p className="text-sm font-semibold">
          {user?.fullName ?? "Administrator"}
        </p>

        <p className="text-xs text-slate-500">
          {user?.role ?? "SUPER_ADMIN"}
        </p>
      </div>

      <LogOut size={18} />
    </button>
  );
}

export default UserMenu;