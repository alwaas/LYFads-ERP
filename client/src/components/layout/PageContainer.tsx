type PageContainerProps = {
  children: React.ReactNode;
};

function PageContainer({
  children,
}: PageContainerProps) {
  return (
    <main className="flex-1 p-6 bg-slate-50 min-w-0">
      {children}
    </main>
  );
}

export default PageContainer;