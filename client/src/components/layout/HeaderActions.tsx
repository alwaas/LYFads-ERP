import { Bell, Search } from "lucide-react";

import UserMenu from "./UserMenu";

function HeaderActions() {
  return (
    <div className="flex items-center gap-4">

      <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
        <Search size={18} />
        <input
          placeholder="Search..."
          className="outline-none bg-transparent"
        />
      </div>

      <button className="relative">
        <Bell size={22} />
      </button>

      <UserMenu />

    </div>
  );
}

export default HeaderActions;