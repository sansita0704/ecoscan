import { AlertTriangle, ArrowRight, Loader2, QrCode, Sparkles } from "lucide-react";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Card from "../ui/Card";
import BinRecommendation from "./BinRecommendation";

const ADVICE_BUTTON = {
  loading: { label: "Getting advice…", icon: Loader2, spin: true },
  ready: { label: "View advice", icon: ArrowRight, spin: false },
  error: { label: "Advice failed — view", icon: ArrowRight, spin: false },
};

/**
 * One detected product, as its own self-contained detection pane: identity,
 * bin, prep tip, a QR token button, and a jump into the (separate) Advice
 * pane. Advice itself is never rendered in here - see AdviceList - so this
 * stays compact even with several items on screen at once.
 */
export default function ItemCard({
  item,
  primary,
  advice,
  onRequestAdvice,
  onViewAdvice,
  onGenerateToken,
  tokenBusy,
  canRequestAdvice,
  adviceReason,
}) {
  const pct = Math.round((item.confidence ?? 0) * 100);
  const adviceButton = ADVICE_BUTTON[advice.status];

  return (
    <Card
      className={`animate-fade-up overflow-hidden ${primary ? "ring-1 ring-brand-500/25" : ""}`}
    >
      <div
        className="flex items-start justify-between gap-3 border-b border-slate-100 p-4"
        style={{ borderTopColor: item.color, borderTopWidth: primary ? 3 : 0 }}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <h3 className="truncate text-base font-bold leading-tight text-slate-800">
              {item.className}
            </h3>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge tone="zinc">{pct}% match</Badge>
            {item.isHazardous && (
              <Badge tone="red">
                <AlertTriangle size={11} aria-hidden="true" />
                Hazardous
              </Badge>
            )}
          </div>
        </div>
        {primary && (
          <span className="shrink-0 rounded-full bg-brand-50 px-2 py-1 text-[0.625rem] font-bold uppercase tracking-wider text-brand-600">
            Most prominent
          </span>
        )}
      </div>

      <div className="space-y-3 p-4">
        <BinRecommendation category={item.bin ?? item.category} color={item.color} />

        {item.tip && <p className="text-xs leading-relaxed text-slate-500">{item.tip}</p>}

        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            onClick={onGenerateToken}
            disabled={tokenBusy}
            icon={QrCode}
            variant="secondary"
            size="sm"
          >
            Generate QR token
          </Button>
        </div>

        {adviceButton ? (
          <Button
            onClick={onViewAdvice}
            icon={adviceButton.spin ? undefined : adviceButton.icon}
            variant="secondary"
            size="sm"
            className="w-full"
          >
            {adviceButton.spin && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
            {adviceButton.label}
          </Button>
        ) : (
          <>
            <Button
              onClick={onRequestAdvice}
              disabled={!canRequestAdvice}
              icon={Sparkles}
              size="sm"
              className="w-full"
            >
              Get advice for this item
            </Button>
            {!canRequestAdvice && (
              <p className="text-center text-xs leading-relaxed text-slate-400">{adviceReason}</p>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
