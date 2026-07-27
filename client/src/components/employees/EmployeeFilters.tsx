type Props = {
  search: string;
  setSearch: (value: string) => void;

  department: string;
  setDepartment: (value: string) => void;

  role: string;
  setRole: (value: string) => void;

  status: string;
  setStatus: (value: string) => void;

  resetFilters: () => void;
};

function EmployeeFilters({
  search,
  setSearch,
  department,
  setDepartment,
  role,
  setRole,
  status,
  setStatus,
  resetFilters,
}: Props) {
  return (
    <div className="bg-white rounded-xl shadow-md p-5">

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">

        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded-lg px-4 py-3"
        />

        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="border rounded-lg px-4 py-3"
        >
          <option value="">All Departments</option>
          <option>IT</option>
          <option>Marketing</option>
          <option>Sales</option>
          <option>HR</option>
          <option>Testing</option>
        </select>

        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="border rounded-lg px-4 py-3"
        >
          <option value="">All Roles</option>
          <option>SUPER_ADMIN</option>
          <option>ADMIN</option>
          <option>MANAGER</option>
          <option>EMPLOYEE</option>
          <option>CLIENT</option>
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border rounded-lg px-4 py-3"
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>

        <button
          onClick={resetFilters}
          className="bg-red-500 hover:bg-red-600 text-white rounded-lg px-4 py-3"
        >
          Reset
        </button>

      </div>

    </div>
  );
}

export default EmployeeFilters;