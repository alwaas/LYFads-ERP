import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import PageContainer from "../components/layout/PageContainer";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  return (
    <div className="flex">
      <Sidebar />

      <div className="flex flex-col flex-1">
        <Header />

        <PageContainer>
          {children}
        </PageContainer>
      </div>
    </div>
  );
}

export default DashboardLayout;