/** Bar chart for the last 7 days. `data`: [{ day, items }] oldest first. */
export default function WeeklyActivityChart({ data }) {
  const max = Math.max(1, ...data.map((d) => d.items));
  const total = data.reduce((sum, d) => sum + d.items, 0);
  const summary = data.map((d) => `${d.day} ${d.items}`).join(", ");

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-label">Weekly activity</h3>
          <p className="mt-1 text-xs text-slate-400">Your confirmed scans over the past 7 days</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold tabular-nums text-slate-800">{total}</p>
          <p className="text-[0.6875rem] text-slate-400">this week</p>
        </div>
      </div>

      <div
        className="relative mt-5 flex h-36 items-end gap-2"
        role="img"
        aria-label={`Items scanned per day: ${summary}`}
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-6 top-0 flex flex-col justify-between">
          <span className="border-t border-dashed border-slate-100" />
          <span className="border-t border-dashed border-slate-100" />
          <span className="border-t border-slate-200" />
        </div>
        {data.map((d, i) => {
          const today = i === data.length - 1;
          return (
            <div key={`${d.day}-${i}`} className="relative z-10 flex h-full flex-1 flex-col items-center justify-end gap-1.5">
              <span
                className={`text-[0.6875rem] font-semibold tabular-nums ${
                  d.items ? "text-slate-600" : "text-slate-300"
                }`}
              >
                {d.items}
              </span>
              <div className="flex w-full flex-1 items-end px-1">
                <div
                  className={`w-full rounded-t-md transition-all duration-500 ${
                    today ? "bg-brand-600" : d.items ? "bg-brand-500/35" : "bg-slate-100"
                  }`}
                  style={{ height: `${Math.max(d.items ? 8 : 3, (d.items / max) * 100)}%` }}
                />
              </div>
              <span className={`text-[0.6875rem] ${today ? "font-semibold text-brand-600" : "text-slate-500"}`}>
                {d.day}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
