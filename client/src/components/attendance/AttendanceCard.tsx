import type { MyAttendanceStatus } from "../../services/attendance.service";

type Props = {
  status: MyAttendanceStatus;
};

function AttendanceCard({ status }: Props) {
  const formatTime = (iso: string | null) => {
    if (!iso) return "-";
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateDuration = (): string => {
    if (!status.checkIn || !status.checkOut) return "-";
    const start = new Date(status.checkIn).getTime();
    const end = new Date(status.checkOut).getTime();
    const diffMs = end - start;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="bg-white rounded-xl shadow border p-6 space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-slate-900">
          Today's Attendance
        </h2>
        <p className="text-sm text-slate-500">
          {new Date(status.date).toLocaleDateString(undefined, {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-50 rounded-lg p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">
            Check In
          </p>
          <p className="text-lg font-semibold text-slate-900">
            {formatTime(status.checkIn)}
          </p>
        </div>

        <div className="bg-slate-50 rounded-lg p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">
            Check Out
          </p>
          <p className="text-lg font-semibold text-slate-900">
            {formatTime(status.checkOut)}
          </p>
        </div>

        <div className="bg-slate-50 rounded-lg p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">
            Duration
          </p>
          <p className="text-lg font-semibold text-slate-900">
            {calculateDuration()}
          </p>
        </div>
      </div>

      <div>
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
            status.checkedIn && status.checkedOut
              ? "bg-green-100 text-green-700"
              : status.checkedIn
                ? "bg-blue-100 text-blue-700"
                : "bg-slate-100 text-slate-700"
          }`}
        >
          {status.checkedIn && status.checkedOut
            ? "Completed"
            : status.checkedIn
              ? "In Progress"
              : "Not Checked In"}
        </span>
      </div>
    </div>
  );
}

export default AttendanceCard;
