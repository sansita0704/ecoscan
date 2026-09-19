import {
  AlertTriangle,
  Brush,
  CheckCircle2,
  Leaf,
  Loader2,
  MapPin,
  Recycle,
  RefreshCw,
  Repeat,
  ScanLine,
  Sparkles,
  Trash2,
  Wrench,
  X,
} from "lucide-react";
import Button from "../ui/Button";
import Card from "../ui/Card";
import FacilityList from "./FacilityList";

const ACTION_META = {
  reuse: { icon: Repeat, label: "Reuse" },
  clean: { icon: Brush, label: "Clean" },
  repair: { icon: Wrench, label: "Repair" },
  repurpose: { icon: Sparkles, label: "Repurpose" },
  recycle: { icon: Recycle, label: "Recycle" },
  compost: { icon: Leaf, label: "Compost" },
  special_disposal: { icon: AlertTriangle, label: "Special disposal" },
  general_disposal: { icon: Trash2, label: "General waste" },
};

const SUITABILITY = {
  recommended: { ring: "border-success-500/35 bg-success-500/[0.08]", text: "text-success-400", note: "Recommended" },
  possible: { ring: "border-white/[0.07] bg-ink-800/50", text: "text-slate-300", note: "Possible" },
  not_advised: { ring: "border-white/[0.05] bg-ink-800/30", text: "text-slate-500", note: "Not advised" },
};

function Section({ title, children }) {
  return (
    <section>
      <h3 className="text-label">{title}</h3>
      <div className="mt-2">{children}</div>
    </section>
  );
}

/**
 * Banner naming the item this advice was generated for.
 *
 * The advice outlives the detection that produced it, so without this the user
 * can end up reading guidance for a bottle while the camera has moved on to a
 * can. It also carries the dismiss control.
 */
function SubjectBar({ subject, onClear }) {
  if (!subject) return null;
  return (
    <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-ink-900/60 px-3 py-2">
      <p className="min-w-0 text-xs text-slate-400">
        Advice for{" "}
        <span className="font-semibold text-white">{subject.className}</span>
      </p>
      {onClear && (
        <Button onClick={onClear} icon={X} variant="ghost" size="sm" className="shrink-0 !px-2 !py-1">
          <span className="sr-only">Dismiss advice</span>
        </Button>
      )}
    </div>
  );
}

export default function AdvicePanel({
  status,
  advice,
  error,
  subject,
  onRequest,
  onRetry,
  onClear,
  canRequest,
  reason,
}) {
  if (status === "idle") {
    return (
      <Card variant="inset" className="p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-brand-500/30 bg-brand-500/10 text-brand-400">
            <Sparkles size={17} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white">What should I do with this?</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              {canRequest
                ? "Get reuse, repair and disposal options for this item, plus real drop-off points near you."
                : reason}
            </p>
            <Button
              onClick={onRequest}
              disabled={!canRequest}
              icon={Sparkles}
              size="sm"
              className="mt-3"
            >
              Get disposal advice
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (status === "loading") {
    return (
      <Card variant="inset" className="p-4">
        <SubjectBar subject={subject} />
        <div className="flex items-center gap-3">
          <Loader2 size={17} className="animate-spin text-brand-400" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-white">Working out your options…</p>
            <p className="mt-0.5 text-xs text-slate-400">
              Checking disposal routes and nearby facilities.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (status === "error") {
    return (
      <Card variant="inset" className="p-4" role="alert">
        <SubjectBar subject={subject} onClear={onClear} />
        <p className="text-sm font-medium text-danger-400">Couldn't get advice</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-400">
          {error?.message ?? "The advice service didn't respond."}
        </p>
        <Button onClick={onRetry} icon={RefreshCw} variant="secondary" size="sm" className="mt-3">
          Try again
        </Button>
      </Card>
    );
  }

  if (advice?.status === "low_confidence") {
    return (
      <Card variant="inset" className="border-warn-500/30 bg-warn-500/[0.07] p-4">
        <div className="flex items-start gap-3">
          <ScanLine size={17} className="mt-0.5 shrink-0 text-warn-400" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-white">Scan again for a clearer read</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">{advice.message}</p>
            <p className="mt-2 text-[0.6875rem] text-slate-500">
              Confidence {(advice.confidence * 100).toFixed(0)}% · advice needs{" "}
              {(advice.threshold * 100).toFixed(0)}%
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (!advice) return null;

  const finalMeta = ACTION_META[advice.finalAction?.type] ?? ACTION_META.recycle;
  const FinalIcon = finalMeta.icon;

  return (
    <Card variant="inset" className="animate-fade-up p-4">
      <SubjectBar subject={subject} onClear={onClear} />

      <div className="space-y-5">
      <p className="text-sm leading-relaxed text-slate-200">{advice.summary}</p>

      {advice.safety && (
        <div className="flex items-start gap-2.5 rounded-xl border border-danger-500/35 bg-danger-500/[0.08] p-3">
          <AlertTriangle size={15} className="mt-0.5 shrink-0 text-danger-400" aria-hidden="true" />
          <p className="text-xs leading-relaxed text-slate-200">{advice.safety}</p>
        </div>
      )}

      {advice.segregation && (
        <Section title="Segregation">
          <div className="rounded-xl border border-white/[0.06] bg-ink-900/60 p-3">
            <p className="text-sm font-bold text-white">{advice.segregation.bin}</p>
            <p className="mt-0.5 text-xs text-brand-400">{advice.segregation.stream}</p>
            {advice.segregation.tips?.length > 0 && (
              <ul className="mt-2.5 space-y-1.5">
                {advice.segregation.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs leading-relaxed text-slate-300">
                    <span aria-hidden="true" className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand-400" />
                    {tip}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Section>
      )}

      {advice.actions?.length > 0 && (
        <Section title="Your options">
          <ul className="space-y-2">
            {advice.actions.map((a, i) => {
              const meta = ACTION_META[a.type] ?? ACTION_META.recycle;
              const tone = SUITABILITY[a.suitability] ?? SUITABILITY.possible;
              const Icon = meta.icon;
              return (
                <li key={`${a.type}-${i}`} className={`rounded-xl border p-3 ${tone.ring}`}>
                  <div className="flex items-center gap-2">
                    <Icon size={14} className={tone.text} aria-hidden="true" />
                    <p className={`text-sm font-semibold ${a.suitability === "not_advised" ? "text-slate-400" : "text-white"}`}>
                      {a.title}
                    </p>
                    <span className={`ml-auto shrink-0 text-[0.625rem] font-bold uppercase tracking-wider ${tone.text}`}>
                      {tone.note}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{a.detail}</p>
                </li>
              );
            })}
          </ul>
        </Section>
      )}

      {advice.preparation?.length > 0 && (
        <Section title="Preparation">
          <ol className="space-y-1.5">
            {advice.preparation.map((step, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs leading-relaxed text-slate-300">
                <span className="mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded bg-white/[0.08] text-[0.625rem] font-bold text-slate-300">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </Section>
      )}

      {advice.finalAction && (
        <div className="flex items-start gap-3 rounded-xl border border-success-500/35 bg-success-500/[0.08] p-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-success-500/15 text-success-400">
            <FinalIcon size={16} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-success-400">
              <CheckCircle2 size={11} aria-hidden="true" />
              Best action
            </p>
            <p className="mt-0.5 text-sm font-bold text-white">{finalMeta.label}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-300">{advice.finalAction.why}</p>
          </div>
        </div>
      )}

      <Section title="Where to take it">
        <FacilityList
          facilities={advice.facilities}
          source={advice.facilitySource}
          note={advice.facilityNote}
          radiusKm={advice.searchRadiusKm}
        />
      </Section>

      <footer className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-white/[0.06] pt-3 text-[0.6875rem] text-slate-500">
        {advice.source === "ai" ? (
          <>
            <Sparkles size={11} aria-hidden="true" />
            <span>Guidance generated by {advice.model}.</span>
          </>
        ) : (
          <>
            <MapPin size={11} aria-hidden="true" />
            <span>
              {advice.degraded
                ? "AI service unavailable — showing the app's configured disposal rules."
                : "From the app's configured disposal rules."}
            </span>
          </>
        )}
        <span>Locations from {advice.facilitySource}. Verify before acting.</span>
      </footer>
      </div>
    </Card>
  );
}
