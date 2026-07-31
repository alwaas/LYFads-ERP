import { NavLink } from "react-router-dom";

import { SIDEBAR_ITEMS } from "../../config/navigation/sidebar";
import { useAuthStore } from "../../stores/auth.store";

function Sidebar() {
  const role =
    useAuthStore((state) => state.user?.role) ??
    "SUPER_ADMIN";

  const menus = SIDEBAR_ITEMS.filter((item) =>
    item.roles.includes(role),
  );

  return (
    <aside className="w-64 min-h-screen bg-slate-900 text-white border-r border-slate-800">

      <div className="px-6 py-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold">
          LYFads ERP
        </h1>

        <p className="text-sm text-slate-400 mt-1">
          {role.replaceAll("_", " ")}
        </p>
      </div>

      <nav className="p-4 space-y-2">

        {menus.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 rounded-lg px-4 py-3 transition-all",
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white",
                ].join(" ")
              }
            >
              <Icon size={20} />

              <span>{item.title}</span>
            </NavLink>
          );
        })}

      </nav>
    </aside>
  );
}

export default Sidebar;