function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-slate-200 bg-white py-3 px-8 text-xs text-slate-500">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">LYFads ERP</span>
          <span>© {currentYear} All rights reserved.</span>
          <span className="hidden md:inline text-slate-300">•</span>
          <span className="hidden md:inline">Multi-tenant Enterprise Edition</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-600 font-medium">System Operational</span>
          </div>
          <span className="text-slate-300">•</span>
          <span>v1.0.0</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
