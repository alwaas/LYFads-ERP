import { NavLink } from "react-router-dom";

function Sidebar() {
  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen p-6">
      <h2 className="text-2xl font-bold mb-8">
        LYFads
      </h2>

      <nav className="space-y-4">
        <NavLink to="/dashboard">Dashboard</NavLink>
        <NavLink to="/employees">Employees</NavLink>
        <NavLink to="/clients">Clients</NavLink>
        <NavLink to="/projects">Projects</NavLink>
        <NavLink to="/tasks">Tasks</NavLink>
        <NavLink to="/attendance">Attendance</NavLink>
        <NavLink to="/leaves">Leaves</NavLink>
        <NavLink to="/notifications">Notifications</NavLink>
        <NavLink to="/activity-logs">Activity Logs</NavLink>
        <NavLink to="/settings">Settings</NavLink>
      </nav>
    </aside>
  );
}

export default Sidebar;