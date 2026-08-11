const TimelineSkeleton = () => {
  return (
    <div className="space-y-5" aria-label="Loading timeline">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="flex gap-4 animate-pulse"
        >
          <div className="h-10 w-10 shrink-0 rounded-full bg-slate-200" />

          <div className="flex-1 rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-3 h-4 w-1/3 rounded bg-slate-200" />
            <div className="mb-2 h-3 w-5/6 rounded bg-slate-200" />
            <div className="h-3 w-1/2 rounded bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default TimelineSkeleton;
