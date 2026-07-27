import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import DashboardLayout from "../../layouts/DashboardLayout";

import { getDailyWorkReportById } from "../../services/daily-work-report.service";

function ViewDailyWorkReportPage() {
  const { id } = useParams();

  const navigate = useNavigate();

  const [report, setReport] = useState<any>();

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const data =
      await getDailyWorkReportById(id!);

    setReport(data);
  };

  if (!report)
    return (
      <DashboardLayout>
        Loading...
      </DashboardLayout>
    );

  return (
    <DashboardLayout>

      <div className="bg-white rounded-xl shadow p-8 space-y-5">

        <div className="flex justify-between">

          <h1 className="text-3xl font-bold">
            Daily Work Report
          </h1>

          <button
            onClick={() =>
              navigate("/daily-work-reports")
            }
            className="bg-gray-600 text-white px-4 py-2 rounded"
          >
            Back
          </button>

        </div>

        <p>
          <b>Employee :</b>{" "}
          {report.employee.user.fullName}
        </p>

        <p>
          <b>Project :</b>{" "}
          {report.project?.name ?? "-"}
        </p>

        <p>
          <b>Task :</b>{" "}
          {report.task?.title ?? "-"}
        </p>

        <p>
          <b>Date :</b>{" "}
          {new Date(
            report.reportDate
          ).toLocaleDateString()}
        </p>

        <p>
          <b>Status :</b>{" "}
          {report.status}
        </p>

        <p>
          <b>Hours :</b>{" "}
          {report.hoursWorked}
        </p>

        <hr />

        <h2 className="font-bold">
          Yesterday Work
        </h2>

        <p>{report.yesterdayWork}</p>

        <h2 className="font-bold">
          Today Work
        </h2>

        <p>{report.todayWork}</p>

        <h2 className="font-bold">
          Tomorrow Plan
        </h2>

        <p>{report.tomorrowPlan}</p>

        <h2 className="font-bold">
          Manager Remarks
        </h2>

        <p>{report.managerRemarks}</p>

      </div>

    </DashboardLayout>
  );
}

export default ViewDailyWorkReportPage;