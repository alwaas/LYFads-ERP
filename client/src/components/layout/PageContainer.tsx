type PageContainerProps = {
  children: React.ReactNode;
};

function PageContainer({
  children,
}: PageContainerProps) {
  return (
    <main className="flex-1 p-6 bg-slate-100 min-h-screen">
      {children}
    </main>
  );
}

export default PageContainer;