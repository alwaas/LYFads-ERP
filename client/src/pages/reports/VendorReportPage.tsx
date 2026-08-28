import DashboardLayout from "../../layouts/DashboardLayout";

function VendorReportPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Vendor Report</h1>
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
          <p className="font-medium">Module Not Available</p>
          <p className="text-sm mt-1">
            Vendor management requires the Vendor model and module, which are not yet implemented.
            This report will be available once the Vendor module is complete.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default VendorReportPage;
