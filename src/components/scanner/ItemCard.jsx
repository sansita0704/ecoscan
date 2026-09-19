import { AlertTriangle, QrCode } from "lucide-react";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Card from "../ui/Card";
import AdvicePanel from "./AdvicePanel";
import BinRecommendation from "./BinRecommendation";

/**
 * One detected product, as its own self-contained pane: identity, bin, prep
 * tip, and an inline "Get advice" that expands to that item's own advice -
 * independent of every other item's card.
 */
export default function ItemCard({
  item,
  primary,
  advice,
  onRequestAdvice,
  onRetryAdvice,
  onClearAdvice,
  onGenerateToken,
  tokenBusy,
  canRequestAdvice,
  adviceReason,
}) {
  const pct = Math.round((item.confidence ?? 0) * 100);

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

        <AdvicePanel
          status={advice.status}
          advice={advice.advice}
          error={advice.error}
          subject={advice.subject}
          onRequest={onRequestAdvice}
          onRetry={onRetryAdvice}
          onClear={onClearAdvice}
          canRequest={canRequestAdvice}
          reason={adviceReason}
        />
      </div>
    </Card>
  );
}
