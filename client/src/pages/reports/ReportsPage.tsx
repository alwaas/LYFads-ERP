import { useEffect, useState } from "react";

import DashboardLayout from "../../layouts/DashboardLayout";

import ReportStats from "../../components/reports/ReportStats";

import { getDashboardReport } from "../../services/report.service";

import type { DashboardReport } from "../../types/report";

function ReportsPage() {
  const [report, setReport] =
    useState<DashboardReport>();

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      const data =
        await getDashboardReport();

      setReport(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>

      <div className="space-y-6">

        <h1 className="text-3xl font-bold">
          Reports
        </h1>

        {loading ? (
          <div>Loading...</div>
        ) : (
          report && (
            <ReportStats
              report={report}
            />
          )
        )}

      </div>

    </DashboardLayout>
  );
}

export default ReportsPage;