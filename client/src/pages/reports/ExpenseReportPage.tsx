import DashboardLayout from "../../layouts/DashboardLayout";

function ExpenseReportPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Expense Report</h1>
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
          <p className="font-medium">Module Not Available</p>
          <p className="text-sm mt-1">
            Expense tracking requires the Expense model and module, which are not yet implemented.
            This report will be available once the Expense module is complete.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default ExpenseReportPage;
