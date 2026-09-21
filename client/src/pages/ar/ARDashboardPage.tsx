import { useQuery } from "@tanstack/react-query";
import { TrendingUp, AlertTriangle, CheckCircle, Clock, DollarSign } from "lucide-react";

import PageLoader from "../../components/common/PageLoader";
import { invoiceService } from "../../services/invoice.service";

const ARDashboardPage = () => {
  const { data: summary, isLoading, isError } = useQuery({
    queryKey: ["ar-summary"],
    queryFn: () => invoiceService.getARSummary(),
  });

  if (isLoading) {
    return <PageLoader />;
  }

  if (isError || !summary) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <h2 className="text-sm font-semibold text-red-800">Unable to load AR summary</h2>
        <p className="mt-1 text-sm text-red-600">The AR service could not be loaded.</p>
      </div>
    );
  }

  const agingBuckets = [
    { label: "0-30 days", value: summary.aging["0-30"] || 0, color: "bg-blue-50 text-blue-700" },
    { label: "31-60 days", value: summary.aging["31-60"] || 0, color: "bg-amber-50 text-amber-700" },
    { label: "61-90 days", value: summary.aging["61-90"] || 0, color: "bg-orange-50 text-orange-700" },
    { label: "90+ days", value: summary.aging["90+"] || 0, color: "bg-red-50 text-red-700" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Accounts Receivable
        </h1>
      </div>
      <p className="text-sm text-slate-500">
        Overview of outstanding invoices and aging analysis
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Total Receivables
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                ${Number(summary.totalOutstanding).toFixed(2)}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Current Receivables
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                ${Number(summary.currentReceivables).toFixed(2)}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Overdue Receivables
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                ${Number(summary.totalOverdue).toFixed(2)}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-50">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Partially Paid
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {summary.partiallyPaid}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-50">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Aging Analysis</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {agingBuckets.map((bucket) => (
            <div key={bucket.label} className="rounded-lg border border-slate-100 p-4">
              <p className="text-xs font-medium text-slate-500">{bucket.label}</p>
              <p className={`mt-2 text-xl font-bold ${bucket.color}`}>
                ${Number(bucket.value).toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ARDashboardPage;
