import { BarChart3, BookOpen, Cpu, Recycle, ScanLine, ScrollText, Sparkles } from "lucide-react";
import HeroScanVisual from "../components/landing/HeroScanVisual";
import WasteIllustration from "../components/illustrations/WasteIllustration";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { MATERIAL_LIST } from "../config/wasteTaxonomy";

const FLOW = [
  { icon: ScanLine, title: "Scan", body: "Hold an item to the camera. Detection runs continuously." },
  { icon: Cpu, title: "Identify", body: "The model returns the object class and its confidence." },
  { icon: ScrollText, title: "Understand", body: "Disposal rules turn that class into real guidance." },
  { icon: Recycle, title: "Act", body: "A colour-coded bin and the steps to prepare the item." },
];

export default function LandingPage({ onStart, onExplore, stats }) {
  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="grid items-center gap-8 lg:grid-cols-2 lg:gap-10">
        <div className="order-2 lg:order-1">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-brand-400">
            <Sparkles size={11} aria-hidden="true" />
            Computer vision waste sorting
          </span>

          <h1 className="mt-4 text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl">
            See it. Sort it.
            <br />
            <span className="bg-gradient-to-r from-brand-400 via-accent-400 to-tech-400 bg-clip-text text-transparent">
              Save the planet.
            </span>
          </h1>

          <p className="mt-4 max-w-lg text-base leading-relaxed text-slate-400">
            EcoScan AI doesn't just identify waste — it tells you exactly what to do with it. Point
            your camera at an item and get the right bin, the prep steps, and the reasoning behind
            both.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Button onClick={onStart} icon={ScanLine} size="lg">
              Start scanning
            </Button>
            <Button onClick={onExplore} icon={BarChart3} variant="secondary" size="lg">
              Explore impact
            </Button>
          </div>

          {stats.total > 0 && (
            <p className="mt-5 text-sm text-slate-500">
              You've sorted{" "}
              <span className="font-bold text-white">{stats.total}</span>{" "}
              {stats.total === 1 ? "item" : "items"} so far · {stats.points} EcoPoints
            </p>
          )}
        </div>

        <div className="order-1 lg:order-2">
          {/* Capped on phones so the hero CTAs stay above the bottom nav. */}
          <HeroScanVisual className="mx-auto max-w-[17rem] sm:max-w-sm lg:max-w-md" />
        </div>
      </section>

      {/* Flow */}
      <section>
        <h2 className="text-label">How it works</h2>
        <ol className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FLOW.map(({ icon: Icon, title, body }, i) => (
            <li key={title}>
              <Card className="h-full p-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand-500/30 bg-brand-500/10 text-brand-400">
                    <Icon size={15} aria-hidden="true" />
                  </span>
                  <span className="text-xs font-bold tabular-nums text-slate-600">
                    0{i + 1}
                  </span>
                </div>
                <h3 className="mt-3 font-bold text-white">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-400">{body}</p>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      {/* Materials */}
      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-label">What it recognises</h2>
            <p className="mt-1 text-sm text-slate-400">
              Eleven object classes across four material families.
            </p>
          </div>
          <Button onClick={onExplore} icon={BookOpen} variant="ghost" size="sm">
            Waste guide
          </Button>
        </div>

        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {MATERIAL_LIST.map((m) => (
            <li key={m.id}>
              <Card interactive className="flex h-full flex-col items-center gap-2 p-4 text-center">
                <WasteIllustration id={m.id} tint={m.tint} className="h-16 w-16" />
                <p className="text-sm font-bold text-white">{m.name}</p>
                <p className="text-xs leading-relaxed text-slate-500">{m.blurb}</p>
              </Card>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
