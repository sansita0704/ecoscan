import { Flame } from "lucide-react";
import { useAsyncData } from "../../hooks/useAsyncData";
import { getLeaderboard } from "../../services/ledgerService";
import AsyncView from "../ui/AsyncView";
import Card from "../ui/Card";

const MEDAL = ["text-warn-400", "text-slate-300", "text-accent-400"];

export default function Leaderboard() {
  const query = useAsyncData(getLeaderboard);

  return (
    <Card className="p-5">
      <h2 className="text-label">Community leaderboard</h2>
      <AsyncView query={query} skeletonClassName="h-64">
        {(entries) => (
          <ol className="mt-3 divide-y divide-white/[0.06]">
            {entries.map((p, i) => (
              <li
                key={p.id}
                className={`flex items-center justify-between gap-4 py-3 ${
                  p.isYou ? "rounded-lg bg-brand-500/[0.08] px-2" : ""
                }`}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span
                    className={`w-5 shrink-0 text-sm font-bold tabular-nums ${
                      MEDAL[i] ?? "text-slate-600"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span
                    className={`truncate font-medium ${
                      p.isYou ? "text-brand-400" : "text-slate-200"
                    }`}
                  >
                    {p.name}
                    {p.isYou && <span className="sr-only"> (you)</span>}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-4 text-sm">
                  <span className="flex items-center gap-1 text-slate-500">
                    <Flame size={13} aria-hidden="true" />
                    {p.streakDays}d
                  </span>
                  <span className="font-bold tabular-nums text-white">{p.points}</span>
                </span>
              </li>
            ))}
          </ol>
        )}
      </AsyncView>
    </Card>
  );
}
