import React, { createContext, useContext, useState } from "react";
import { Outlet } from "react-router-dom";

import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import PageContainer from "../components/layout/PageContainer";
import Footer from "../components/layout/Footer";

export const DashboardLayoutContext = createContext<boolean>(false);

type DashboardLayoutProps = {
  children?: React.ReactNode;
};

function DashboardLayout({ children }: DashboardLayoutProps) {
  const isInside = useContext(DashboardLayoutContext);

  // Prevent nested duplicate sidebars/headers/footers if a child page also renders DashboardLayout
  if (isInside) {
    return <>{children || <Outlet />}</>;
  }

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem("lyfads_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("lyfads_sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  };

  return (
    <DashboardLayoutContext.Provider value={true}>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar collapsed={collapsed} onToggle={toggleSidebar} />

        <div className="flex flex-col flex-1 min-w-0 min-h-screen">
          <Header onToggleSidebar={toggleSidebar} isSidebarCollapsed={collapsed} />

          <PageContainer>
            {children || <Outlet />}
          </PageContainer>

          <Footer />
        </div>
      </div>
    </DashboardLayoutContext.Provider>
  );
}

export default DashboardLayout;