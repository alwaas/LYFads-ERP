import DashboardLayout from "../../layouts/DashboardLayout";

function ProfitabilityReportPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Profitability Report</h1>
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
          <p className="font-medium">Data Not Authoritative</p>
          <p className="text-sm mt-1">
            COGS and inventory valuation are not yet authoritative. Profitability reporting
            requires Purchase, Expense, and Inventory valuation modules.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default ProfitabilityReportPage;
