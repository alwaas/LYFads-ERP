import type { Attendance } from "../../types/attendance";

type Props = {
  attendance: Attendance[];
};

function AttendanceTable({
  attendance,
}: Props) {
  return (
    <div className="bg-white rounded-xl shadow overflow-x-auto">

      <table className="min-w-full">

        <thead className="bg-gray-100">

          <tr>
            <th className="px-6 py-4 text-left">
              Employee
            </th>

            <th className="px-6 py-4 text-left">
              Employee Code
            </th>

            <th className="px-6 py-4 text-left">
              Check In
            </th>

            <th className="px-6 py-4 text-left">
              Check Out
            </th>

            <th className="px-6 py-4 text-left">
              Working Hours
            </th>

            <th className="px-6 py-4 text-left">
              Status
            </th>
          </tr>

        </thead>

        <tbody>

          {attendance.length === 0 ? (

            <tr>

              <td
                colSpan={6}
                className="text-center py-10 text-gray-500"
              >
                No Attendance Found
              </td>

            </tr>

          ) : (

            attendance.map((item) => (

              <tr
                key={item.id}
                className="border-b hover:bg-gray-50"
              >

                <td className="px-6 py-4 font-medium">
                  {item.employee.user.fullName}
                </td>

                <td className="px-6 py-4">
                  {item.employee.employeeCode}
                </td>

                <td className="px-6 py-4">
                  {item.checkIn
                    ? new Date(item.checkIn).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "-"}
                </td>

                <td className="px-6 py-4">
                  {item.checkOut
                    ? new Date(item.checkOut).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "-"}
                </td>

                <td className="px-6 py-4">
                  {item.workingHours ?? "-"}
                </td>

                <td className="px-6 py-4">

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      item.status === "PRESENT"
                        ? "bg-green-100 text-green-700"
                        : item.status === "ABSENT"
                        ? "bg-red-100 text-red-700"
                        : item.status === "HALF_DAY"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {item.status}
                  </span>

                </td>

              </tr>

            ))

          )}

        </tbody>

      </table>

    </div>
  );
}

export default AttendanceTable;