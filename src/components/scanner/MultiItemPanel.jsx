import { PackageSearch, ScanLine } from "lucide-react";
import Card from "../ui/Card";
import EmptyState from "../ui/EmptyState";
import ItemCard from "./ItemCard";

/**
 * The Detection pane: every confirmed item in the frame, each as its own
 * compact card. Advice lives in the separate Advice pane (see AdviceList) -
 * a card here just says whether advice has been asked for yet and, if so,
 * links over to it.
 */
export default function MultiItemPanel({
  items,
  isLive,
  getAdvice,
  onRequestAdvice,
  onViewAdvice,
  onGenerateToken,
  tokenBusyTrackId,
  canRequestAdvice,
  adviceReason,
}) {
  if (!items.length) {
    return (
      <Card className="flex min-h-[20rem] items-center justify-center">
        <EmptyState
          icon={ScanLine}
          tone={isLive ? "tech" : "neutral"}
          title={isLive ? "Searching for items" : "Scanner idle"}
          body={
            isLive
              ? "Spread items out so each one is visible. Every item the camera confirms gets its own card here."
              : "Start the camera, then hold items in view. Each one detected gets its own card here."
          }
        />
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1 text-sm font-semibold text-slate-600">
        <PackageSearch size={16} className="text-brand-500" aria-hidden="true" />
        {items.length} item{items.length === 1 ? "" : "s"} detected
      </div>

      {items.map((item, i) => (
        <ItemCard
          key={item.trackId}
          item={item}
          primary={i === 0}
          advice={getAdvice(item.trackId)}
          onRequestAdvice={() => onRequestAdvice(item)}
          onViewAdvice={onViewAdvice}
          onGenerateToken={() => onGenerateToken(item)}
          tokenBusy={tokenBusyTrackId === item.trackId}
          canRequestAdvice={canRequestAdvice(item)}
          adviceReason={adviceReason(item)}
        />
      ))}
    </div>
  );
}
