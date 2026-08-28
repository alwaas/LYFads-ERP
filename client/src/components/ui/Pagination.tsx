import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  limit?: number;
  onLimitChange?: (limit: number) => void;
}

export default function Pagination({
  page,
  totalPages,
  onPageChange,
  limit = 10,
  onLimitChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showEllipsis = totalPages > 7;

    if (!showEllipsis) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    pages.push(1);

    if (page > 3) pages.push("...");

    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);

    for (let i = start; i <= end; i++) {
      if (!pages.includes(i)) pages.push(i);
    }

    if (page < totalPages - 2) pages.push("...");

    if (!pages.includes(totalPages)) pages.push(totalPages);

    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
      {onLimitChange && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Show</span>
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <span>per page</span>
        </div>
      )}

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={16} />
          Previous
        </button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((p, idx) =>
            typeof p === "string" ? (
              <span
                key={`ellipsis-${idx}`}
                className="px-2 py-1.5 text-sm text-gray-500"
              >
                {p}
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  p === page
                    ? "bg-blue-600 text-white"
                    : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {p}
              </button>
            ),
          )}
        </div>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
