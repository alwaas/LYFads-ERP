import Breadcrumbs from "./Breadcrumbs";
import HeaderActions from "./HeaderActions";

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">

      <div className="flex items-center justify-between px-8 py-4">

        <Breadcrumbs />

        <HeaderActions />

      </div>

    </header>
  );
}

export default Header;