import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import DashboardLayout from "../../layouts/DashboardLayout";
import PageContainer from "../../components/layout/PageContainer";
import CheckInForm from "../../components/attendance/CheckInForm";
import { getMyStatus, type MyAttendanceStatus } from "../../services/attendance.service";

function CheckInPage() {
  const [status, setStatus] = useState<MyAttendanceStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const data = await getMyStatus();
      setStatus(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load attendance status.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <PageContainer>
          <div className="w-full space-y-6">
            <h1 className="text-3xl font-bold">Check In / Check Out</h1>
            <div className="w-full rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-sm">
              <p className="text-slate-500 text-base animate-pulse font-medium">
                Loading attendance status...
              </p>
            </div>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="w-full space-y-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold">Check In / Check Out</h1>
            <p className="text-sm text-slate-500 font-medium">
              Manage your daily attendance.
            </p>
          </div>

          {status && <CheckInForm initialStatus={status} />}
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}

export default CheckInPage;
