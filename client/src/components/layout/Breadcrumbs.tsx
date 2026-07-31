import { useLocation } from "react-router-dom";

function Breadcrumbs() {
  const { pathname } = useLocation();

  const text = pathname
    .split("/")
    .filter(Boolean)
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1).replaceAll("-", " "),
    )
    .join(" / ");

  return (
    <div>
      <p className="text-sm text-slate-500">
        {text || "Dashboard"}
      </p>
    </div>
  );
}

export default Breadcrumbs;