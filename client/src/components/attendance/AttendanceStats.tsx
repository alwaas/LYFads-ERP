import type { Attendance } from "../../types/attendance";

type Props = {
  attendance: Attendance[];
};

function AttendanceStats({
  attendance,
}: Props) {

  const total = attendance.length;

  const checkedOut = attendance.filter(
    (item) => item.checkOut
  ).length;

  const checkedIn = total - checkedOut;

  const present = attendance.filter(
    (item) => item.status === "PRESENT"
  ).length;

  const absent = attendance.filter(
    (item) => item.status === "ABSENT"
  ).length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

      <div className="bg-white rounded-xl shadow p-5">
        <p className="text-gray-500">
          Present
        </p>

        <h2 className="text-3xl font-bold text-green-600">
          {present}
        </h2>
      </div>

      <div className="bg-white rounded-xl shadow p-5">
        <p className="text-gray-500">
          Absent
        </p>

        <h2 className="text-3xl font-bold text-red-600">
          {absent}
        </h2>
      </div>

      <div className="bg-white rounded-xl shadow p-5">
        <p className="text-gray-500">
          Checked In
        </p>

        <h2 className="text-3xl font-bold text-blue-600">
          {checkedIn}
        </h2>
      </div>

      <div className="bg-white rounded-xl shadow p-5">
        <p className="text-gray-500">
          Checked Out
        </p>

        <h2 className="text-3xl font-bold text-purple-600">
          {checkedOut}
        </h2>
      </div>

    </div>
  );
}

export default AttendanceStats;