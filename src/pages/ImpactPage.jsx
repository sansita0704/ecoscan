import { 
  AlertTriangle, 
  CalendarDays, 
  CircleCheck, 
  Flame, 
  Info, 
  Recycle, 
  RotateCcw, 
  ScanLine, 
  Sparkles, 
  Trophy, 
  Weight 
} from "lucide-react";
import Leaderboard from "../components/leaderboard/Leaderboard";
import WeeklyActivityChart from "../components/ledger/WeeklyActivityChart";
import PageHeader from "../components/layout/PageHeader";
import WasteIllustration from "../components/illustrations/WasteIllustration";
import SortIllustration from "../components/illustrations/SortIllustration";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import ProgressRing from "../components/ui/ProgressRing";
import StatTile from "../components/ui/StatTile";
import { BINS, getBin, getMaterial, MATERIAL_LIST } from "../config/wasteTaxonomy";

function BinSplit({ byBin, total }) {
  const rows = [BINS.recyclable, BINS.landfill, BINS.hazardous].filter((b) => byBin[b.id] > 0);
  if (!rows.length) return null;

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-label">Where your items went</h3>
        <span className="text-xs text-slate-400">{total} total</span>
      </div>
      <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-slate-100">
        {rows.map((bin) => (
          <div
            key={bin.id}
            className={bin.bar}
            style={{ width: `${(byBin[bin.id] / total) * 100}%` }}
            title={`${bin.label}: ${byBin[bin.id]}`}
          />
        ))}
      </div>
      <ul className="mt-3 grid gap-2 sm:grid-cols-3">
        {rows.map((bin) => {
          const Icon = bin.icon;
          const count = byBin[bin.id];
          return (
            <li key={bin.id} className="rounded-lg border border-slate-200/80 bg-slate-50 px-2.5 py-2">
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <Icon size={13} className={bin.text} aria-hidden="true" />
                {bin.label}
              </span>
              <span className="mt-1 block text-base font-bold tabular-nums text-slate-800">
                {count} <span className="text-xs font-normal text-slate-400">({Math.round((count / total) * 100)}%)</span>
              </span>
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
    <Card className="h-full p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-label">Materials sorted</h2>
          <p className="mt-1 text-xs text-slate-400">Your most scanned material families</p>
        </div>
        <CircleCheck size={17} className="text-brand-500" aria-hidden="true" />
      </div>
      <ul className="mt-3 space-y-3">
        {rows.map((m) => {
          const count = byMaterial[m.id];
          return (
            <li key={m.id} className="flex items-center gap-3">
              <WasteIllustration id={m.id} tint={m.tint} className="h-10 w-10 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-medium text-slate-700">{m.name}</span>
                  <span className="text-sm font-bold tabular-nums text-slate-800">{count}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
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

function RecentScans({ scans }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-label">Recent scans</h2>
          <p className="mt-1 text-xs text-slate-400">Your latest confirmed items</p>
        </div>
        <CalendarDays size={17} className="text-slate-400" aria-hidden="true" />
      </div>
      <ul className="mt-4 divide-y divide-slate-100">
        {scans.map((scan) => {
          const material = getMaterial(scan.rawClass);
          const bin = getBin(scan.category);
          const MaterialIcon = material ? null : bin.icon;
          return (
            <li key={scan.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              {material ? (
                <WasteIllustration id={material.id} tint={material.tint} className="h-9 w-9 shrink-0" />
              ) : (
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${bin.surface} ${bin.text}`}>
                  <MaterialIcon size={16} aria-hidden="true" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-700">{scan.className}</p>
                <p className="mt-0.5 text-xs text-slate-400">{bin.label}</p>
              </div>
              <time className="shrink-0 text-xs tabular-nums text-slate-400">
                {new Date(scan.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </time>
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
            <Button
              onClick={() => {
                if (window.confirm("Clear your scan history? This cannot be undone.")) onReset();
              }}
              icon={RotateCcw}
              variant="secondary"
              size="sm"
            >
              Clear history
            </Button>
          )
        }
      />

      {!hasData ? (
        <Card>
          <EmptyState
            icon={ScanLine}
            illustration={SortIllustration}
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
          <Card className="overflow-hidden">
            <div className="flex flex-col gap-6 bg-brand-50/60 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="flex items-center gap-5">
                <ProgressRing
                  value={stats.diverted}
                  max={stats.total}
                  label={`${stats.divertedPct}%`}
                  caption="kept out"
                  size={118}
                  stroke={10}
                  color="#477A5C"
                />
                <div>
                  <p className="text-label">Your sorting snapshot</p>
                  <p className="mt-1 text-2xl font-extrabold tracking-tight text-slate-800 sm:text-3xl">
                    {stats.diverted} {stats.diverted === 1 ? "item" : "items"} kept out of general waste
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                    <Flame size={14} className="text-warn-400" aria-hidden="true" />
                    {stats.streakDays}-day streak
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:w-[22rem] sm:grid-cols-2">
                <StatTile icon={Trophy} label="EcoPoints" value={stats.points} hint="app score" />
                <StatTile icon={ScanLine} label="Scanned" value={stats.total} hint="all time" />
                <StatTile
                  icon={Recycle}
                  label="Kept out"
                  value={stats.diverted}
                  hint={`${stats.divertedPct}% of total`}
                  tint="#477A5C"
                />
                <StatTile
                  icon={Weight}
                  label="Est. mass"
                  value={stats.grams >= 1000 ? `${(stats.grams / 1000).toFixed(1)} kg` : `${stats.grams} g`}
                />
              </div>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-slate-400">
              Points are a scoring rule in this app, not a model output. Mass is estimated from
              average per-class weights in the disposal rules, not measured.
            </p>
          </Card>

          <div className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
            <Card className="space-y-6 p-5">
              <WeeklyActivityChart data={stats.weekly} />
              <BinSplit byBin={stats.byBin} total={stats.total} />
            </Card>

            <MaterialBreakdown byMaterial={stats.byMaterial} total={stats.total} />
          </div>

          <div className="grid gap-4 xl:grid-cols-[.9fr_1.1fr]">
            <RecentScans scans={stats.recent} />
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Info size={14} className="text-slate-400" aria-hidden="true" />
                <p className="text-xs text-slate-400">
                  Sample community data — the leaderboard does not reflect real users.
                </p>
              </div>
              <Leaderboard />
            </div>
          </div>
        </>
      )}

      {!hasData && <div>
        <div className="mb-3 flex items-center gap-2">
          <Info size={14} className="text-slate-400" aria-hidden="true" />
          <p className="text-xs text-slate-400">
            Sample community data — the leaderboard does not reflect real users.
          </p>
        </div>
        <Leaderboard />
      </div>}
    </div>
  );
}
