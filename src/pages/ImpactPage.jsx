import { Flame, Recycle, RotateCcw, ScanLine, Sparkles, Trophy, Weight } from "lucide-react";
import Leaderboard from "../components/leaderboard/Leaderboard";
import WeeklyActivityChart from "../components/ledger/WeeklyActivityChart";
import PageHeader from "../components/layout/PageHeader";
import WasteIllustration from "../components/illustrations/WasteIllustration";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import ProgressRing from "../components/ui/ProgressRing";
import StatTile from "../components/ui/StatTile";
import { BINS, MATERIAL_LIST } from "../config/wasteTaxonomy";

function BinSplit({ byBin, total }) {
  const rows = [BINS.recyclable, BINS.landfill, BINS.hazardous].filter((b) => byBin[b.id] > 0);
  if (!rows.length) return null;

  return (
    <div>
      <h3 className="text-label">Where your items went</h3>
      <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
        {rows.map((bin) => (
          <div
            key={bin.id}
            className={bin.bar}
            style={{ width: `${(byBin[bin.id] / total) * 100}%` }}
            title={`${bin.label}: ${byBin[bin.id]}`}
          />
        ))}
      </div>
      <ul className="mt-3 space-y-1.5">
        {rows.map((bin) => {
          const Icon = bin.icon;
          return (
            <li key={bin.id} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2 text-slate-300">
                <Icon size={14} className={bin.text} aria-hidden="true" />
                {bin.label}
              </span>
              <span className="font-semibold tabular-nums text-white">{byBin[bin.id]}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function MaterialBreakdown({ byMaterial, total }) {
  const rows = MATERIAL_LIST.filter((m) => (byMaterial[m.id] ?? 0) > 0);
  if (!rows.length) return null;

  return (
    <Card className="p-5">
      <h2 className="text-label">Materials sorted</h2>
      <ul className="mt-3 space-y-3">
        {rows.map((m) => {
          const count = byMaterial[m.id];
          return (
            <li key={m.id} className="flex items-center gap-3">
              <WasteIllustration id={m.id} tint={m.tint} className="h-10 w-10 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-medium text-slate-200">{m.name}</span>
                  <span className="text-sm font-bold tabular-nums text-white">{count}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${(count / total) * 100}%`, backgroundColor: m.tint }}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

export default function ImpactPage({ stats, onReset, onStartScanning }) {
  const hasData = stats.total > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Trophy}
        eyebrow="Your activity"
        title="My impact"
        subtitle="Recorded on this device as you scan. Nothing is uploaded."
        actions={
          hasData && (
            <Button onClick={onReset} icon={RotateCcw} variant="ghost" size="sm">
              Reset
            </Button>
          )
        }
      />

      {!hasData ? (
        <Card>
          <EmptyState
            icon={ScanLine}
            tone="brand"
            title="No scans yet"
            body="Your points, streak and material breakdown build up as you scan items."
            action="Start scanning"
            actionIcon={ScanLine}
            onAction={onStartScanning}
          />
        </Card>
      ) : (
        <>
          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <ProgressRing
                  value={stats.diverted}
                  max={stats.total}
                  label={`${stats.divertedPct}%`}
                  caption="diverted"
                  color="#22C55E"
                />
                <div>
                  <p className="text-label">EcoPoints</p>
                  <p className="mt-1 text-4xl font-extrabold tracking-tight text-white">
                    {stats.points}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-400">
                    <Flame size={14} className="text-warn-400" aria-hidden="true" />
                    {stats.streakDays}-day streak
                  </p>
                </div>
              </div>

              <div className="grid flex-1 grid-cols-2 gap-3 sm:max-w-md sm:grid-cols-3">
                <StatTile icon={ScanLine} label="Scanned" value={stats.total} />
                <StatTile
                  icon={Recycle}
                  label="Diverted"
                  value={stats.diverted}
                  tint="#22C55E"
                />
                <StatTile
                  icon={Weight}
                  label="Est. mass"
                  value={stats.grams >= 1000 ? `${(stats.grams / 1000).toFixed(1)} kg` : `${stats.grams} g`}
                />
              </div>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-slate-500">
              Points are a scoring rule in this app, not a model output. Mass is estimated from
              average per-class weights in the disposal rules, not measured.
            </p>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="space-y-5 p-5">
              <WeeklyActivityChart data={stats.weekly} />
              <BinSplit byBin={stats.byBin} total={stats.total} />
            </Card>

            <MaterialBreakdown byMaterial={stats.byMaterial} total={stats.total} />
          </div>

          <Card className="p-5">
            <h2 className="text-label">Recent scans</h2>
            <ul className="mt-3 divide-y divide-white/[0.06]">
              {stats.recent.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="min-w-0 truncate text-sm text-slate-200">{s.className}</span>
                  <span className="shrink-0 text-xs tabular-nums text-slate-500">
                    {new Date(s.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}

      <div>
        <div className="mb-3 flex items-center gap-2">
          <Sparkles size={14} className="text-slate-500" aria-hidden="true" />
          <p className="text-xs text-slate-500">
            Community leaderboard is sample data from the backend — it doesn't reflect real users.
          </p>
        </div>
        <Leaderboard />
      </div>
    </div>
  );
}
