import { Bell } from "lucide-react";
import { Link } from "react-router-dom";

import UserMenu from "./UserMenu";

function HeaderActions() {
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <Link
        to="/notifications"
        className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
        title="View Notifications"
        aria-label="View Notifications"
      >
        <Bell size={20} />
      </Link>

      <UserMenu />
    </div>
  );
}

export default HeaderActions;