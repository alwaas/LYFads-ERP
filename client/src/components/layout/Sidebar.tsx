import { NavLink } from "react-router-dom";
import { ChevronLeft, ChevronRight, LayoutDashboard, X } from "lucide-react";

import { SIDEBAR_ITEMS } from "../../config/navigation/sidebar";
import { useAuthStore } from "../../stores/auth.store";

type SidebarProps = {
  collapsed?: boolean;
  onToggle?: () => void;
};

function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const role =
    useAuthStore((state) => state.user?.role) ??
    "SUPER_ADMIN";

  const menus = SIDEBAR_ITEMS.filter((item) =>
    item.roles.includes(role),
  );

  return (
    <>
      {/* Mobile overlay backdrop when expanded */}
      {onToggle && !collapsed && (
        <div
          onClick={onToggle}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 lg:sticky lg:top-0 h-screen bg-slate-900 text-white border-r border-slate-800 flex flex-col transition-all duration-300 z-50 lg:z-30 ${
          collapsed
            ? "w-0 -translate-x-full lg:translate-x-0 lg:w-20 overflow-hidden"
            : "w-64 translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="px-4 py-5 border-b border-slate-800 flex items-center justify-between">
          {!collapsed ? (
            <div className="overflow-hidden">
              <h1 className="text-xl font-bold tracking-tight text-white whitespace-nowrap">
                LYFads ERP
              </h1>
              <p className="text-xs text-slate-400 mt-0.5 truncate">
                {role.replaceAll("_", " ")}
              </p>
            </div>
          ) : (
            <div className="mx-auto">
              <div
                className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-sm shadow-md"
                title="LYFads ERP"
              >
                LYF
              </div>
            </div>
          )}

          {onToggle && !collapsed && (
            <>
              <button
                onClick={onToggle}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition hidden lg:flex"
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft size={18} />
              </button>

              <button
                onClick={onToggle}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition lg:hidden flex"
                title="Close menu"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </>
          )}
        </div>

        {/* Navigation List */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
          {menus.map((item) => {
            const Icon = item.icon || LayoutDashboard;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                title={collapsed ? item.title : undefined}
                onClick={() => {
                  if (window.innerWidth < 1024 && onToggle && !collapsed) {
                    onToggle();
                  }
                }}
                className={({ isActive }) =>
                  [
                    "flex items-center rounded-lg transition-all",
                    collapsed
                      ? "justify-center p-3"
                      : "gap-3 px-3 py-2.5 text-sm",
                    isActive
                      ? "bg-blue-600 text-white shadow-sm font-medium"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white",
                  ].join(" ")
                }
              >
                <Icon size={collapsed ? 22 : 18} className="shrink-0" />

                {!collapsed && (
                  <span className="truncate">{item.title}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Toggle for Collapsed State on Desktop */}
        {onToggle && collapsed && (
          <div className="p-3 border-t border-slate-800 hidden lg:flex justify-center">
            <button
              onClick={onToggle}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

export default Sidebar;