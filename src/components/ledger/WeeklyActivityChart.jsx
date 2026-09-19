/** Bar chart for the last 7 days. `data`: [{ day, items }] oldest first. */
export default function WeeklyActivityChart({ data }) {
  const max = Math.max(1, ...data.map((d) => d.items));
  const summary = data.map((d) => `${d.day} ${d.items}`).join(", ");
  const empty = data.every((d) => d.items === 0);

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h3 className="text-label">Past 7 days</h3>
        {empty && <span className="text-xs text-slate-500">No scans yet</span>}
      </div>

      <div
        className="flex h-32 items-end gap-1.5"
        role="img"
        aria-label={`Items scanned per day: ${summary}`}
      >
        {data.map((d, i) => {
          const today = i === data.length - 1;
          return (
            <div key={`${d.day}-${i}`} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
              <span
                className={`text-[0.6875rem] font-semibold tabular-nums ${
                  d.items ? "text-slate-600" : "text-slate-300"
                }`}
              >
                {d.items}
              </span>
              <div className="flex w-full flex-1 items-end">
                <div
                  className={`w-full rounded-md transition-all duration-500 ${
                    today ? "bg-brand-600" : "bg-brand-500/25"
                  }`}
                  style={{ height: `${Math.max(d.items ? 8 : 3, (d.items / max) * 100)}%` }}
                />
              </div>
              <span className={`text-[0.6875rem] ${today ? "font-semibold text-brand-400" : "text-slate-500"}`}>
                {d.day}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
