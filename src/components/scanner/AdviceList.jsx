import { Sparkles } from "lucide-react";
import Card from "../ui/Card";
import EmptyState from "../ui/EmptyState";
import AdvicePanel from "./AdvicePanel";

/**
 * The Advice pane: one AdvicePanel per item that's been asked about, most
 * recently requested first. Separate from the Detection pane on purpose (see
 * ScannerPage) - so a busy multi-item frame doesn't make every card double in
 * height, and so an answer stays readable here even after its item leaves
 * the camera.
 */
export default function AdviceList({ byTrack, onRetry, onClear }) {
  const entries = Object.entries(byTrack).sort((a, b) => Number(b[0]) - Number(a[0]));

  if (!entries.length) {
    return (
      <Card>
        <EmptyState
          icon={Sparkles}
          tone="brand"
          title="No advice yet"
          body="Scan items in the Detection tab, then ask for advice on whichever ones you want. Each answer gets its own pane here."
        />
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map(([trackId, entry]) => (
        <AdvicePanel
          key={trackId}
          status={entry.status}
          advice={entry.advice}
          error={entry.error}
          subject={entry.subject}
          onRetry={() => onRetry(Number(trackId))}
          onClear={() => onClear(Number(trackId))}
          canRequest
        />
      ))}
    </div>
  );
}
