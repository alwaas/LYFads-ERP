import DashboardLayout from "../../layouts/DashboardLayout";
import PageContainer from "../../components/layout/PageContainer";
import InventoryValuationSettings from "../../components/settings/InventoryValuationSettings";

function InventorySettingsPage() {
  return (
    <DashboardLayout>
      <PageContainer>
        <div className="w-full max-w-2xl space-y-6">
          <div className="rounded-2xl bg-white border border-slate-200 shadow-2xs p-5 sm:p-8">
            <div className="space-y-1 mb-6">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Inventory Settings
              </h1>
              <p className="text-sm text-slate-500 font-medium">
                Configure inventory valuation and operational preferences.
              </p>
            </div>
            <InventoryValuationSettings />
          </div>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}

export default InventorySettingsPage;
