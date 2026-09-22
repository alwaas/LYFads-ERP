import type { User } from "../../types/user";

type Props = {
  users: User[];
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

function UserTable({ users, onView, onEdit, onDelete }: Props) {
  if (users.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-slate-500">No users found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="px-4 py-3 font-medium text-slate-500">Name</th>
            <th className="px-4 py-3 font-medium text-slate-500">Email</th>
            <th className="px-4 py-3 font-medium text-slate-500">Role</th>
            <th className="px-4 py-3 font-medium text-slate-500">Status</th>
            <th className="px-4 py-3 font-medium text-slate-500">Created</th>
            <th className="px-4 py-3 font-medium text-slate-500 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-900">{user.fullName}</td>
              <td className="px-4 py-3 text-slate-600">{user.email}</td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                  {user.role}
                </span>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    user.isActive
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {user.isActive ? "Active" : "Inactive"}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-600">
                {new Date(user.createdAt).toLocaleDateString()}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => onView(user.id)}
                    className="text-slate-600 hover:text-blue-600"
                    title="View"
                  >
                    View
                  </button>
                  <button
                    onClick={() => onEdit(user.id)}
                    className="text-slate-600 hover:text-blue-600"
                    title="Edit"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(user.id)}
                    className="text-slate-600 hover:text-red-600"
                    title="Delete"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default UserTable;
