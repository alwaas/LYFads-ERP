import { useState } from "react";
import toast from "react-hot-toast";

import { checkInSelf, checkOutSelf, type MyAttendanceStatus } from "../../services/attendance.service";

type Props = {
  initialStatus: MyAttendanceStatus;
};

function CheckInForm({ initialStatus }: Props) {
  const [status, setStatus] = useState<MyAttendanceStatus>(initialStatus);
  const [loading, setLoading] = useState(false);
  const [remarks, setRemarks] = useState("");

  const handleCheckIn = async () => {
    try {
      setLoading(true);
      const response = await checkInSelf(remarks || undefined);
      setStatus(response.data);
      toast.success("Checked in successfully.");
      setRemarks("");
    } catch (error: unknown) {
      console.error(error);
      const message =
        (error as any)?.response?.data?.message?.[0] ??
        (error as any)?.response?.data?.message ??
        "Failed to check in.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setLoading(true);
      const response = await checkOutSelf();
      setStatus(response.data);
      toast.success("Checked out successfully.");
    } catch (error: unknown) {
      console.error(error);
      const message =
        (error as any)?.response?.data?.message?.[0] ??
        (error as any)?.response?.data?.message ??
        "Failed to check out.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

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
    <div className="bg-white rounded-xl shadow border p-6 space-y-6">
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

      {!status.checkedIn && !status.checkedOut && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Remarks (optional)
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              placeholder="Add optional remarks..."
            />
          </div>

          <button
            type="button"
            onClick={handleCheckIn}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-xl bg-green-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? "Checking in..." : "Check In"}
          </button>
        </div>
      )}

      {status.checkedIn && !status.checkedOut && (
        <button
          type="button"
          onClick={handleCheckOut}
          disabled={loading}
          className="inline-flex items-center justify-center rounded-xl bg-red-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? "Checking out..." : "Check Out"}
        </button>
      )}

      {status.checkedIn && status.checkedOut && (
        <div className="rounded-xl bg-green-50 border border-green-200 text-green-800 px-4 py-3">
          <p className="text-sm font-medium">
            Attendance completed for today.
          </p>
        </div>
      )}
    </div>
  );
}

export default CheckInForm;
