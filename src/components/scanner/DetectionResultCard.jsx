import { Layers, Loader2, QrCode, ScanLine, Sparkles, Weight } from "lucide-react";
import { getMaterial } from "../../config/wasteTaxonomy";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Card from "../ui/Card";
import EmptyState from "../ui/EmptyState";
import StatTile from "../ui/StatTile";
import BinRecommendation from "./BinRecommendation";
import CompositeNotice from "./CompositeNotice";
import ConfidenceMeter from "./ConfidenceMeter";
import ContaminationMeter from "./ContaminationMeter";
import PrepChecklist from "./PrepChecklist";
import WhyThisBin from "./WhyThisBin";

/**
 * The result panel: what was detected, which bin it belongs in, and what to do
 * to it first. Ordered by decision value - identity, then bin, then actions.
 */
export default function DetectionResultCard({
  detection,
  tokenStatus,
  tokenError,
  onGenerateToken,
  isLive,
}) {
  if (!detection) {
    return (
      <Card className="flex min-h-[20rem] items-center justify-center">
        <EmptyState
          icon={ScanLine}
          tone={isLive ? "tech" : "neutral"}
          title={isLive ? "Searching for an item" : "Scanner idle"}
          body={
            isLive
              ? "Hold an item inside the frame. Keep it steady and well lit for a confident read."
              : "Start the camera, then hold an item in view. Results appear here."
          }
        />
      </Card>
    );
  }

  const issuing = tokenStatus === "loading";
  const material = getMaterial(detection.rawClass);

  return (
    <Card className="animate-fade-up overflow-hidden">
      {/* Identity */}
      <div className="border-b border-white/[0.06] bg-gradient-to-br from-brand-600/[0.16] to-transparent p-5">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/15 px-2.5 py-1 text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-brand-400">
            <Sparkles size={11} aria-hidden="true" />
            AI detected
          </span>
        </div>

        <h2 className="mt-2.5 text-2xl font-bold leading-tight tracking-tight text-white">
          {detection.className}
        </h2>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge tone="zinc">{detection.category}</Badge>
          {material && (
            <Badge tone="zinc">
              <span
                aria-hidden="true"
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: material.tint }}
              />
              {material.name}
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-5 p-5">
        <ConfidenceMeter confidence={detection.confidence} />

        <BinRecommendation category={detection.category} />

        <CompositeNotice detections={detection.detections} />

        <div className="grid grid-cols-2 gap-3">
          <StatTile icon={Weight} label="Est. weight" value={`${detection.weightG} g`} />
          <StatTile icon={Layers} label="Material grade" value={detection.grade} />
        </div>

        {detection.contamination && <ContaminationMeter {...detection.contamination} />}

        {/* key resets checked steps when the detected item changes */}
        <PrepChecklist key={detection.className} steps={detection.steps} />

        <WhyThisBin detection={detection} />

        {tokenStatus === "error" && (
          <p role="alert" className="text-sm text-danger-400">
            Couldn't generate a token. {tokenError?.message}
          </p>
        )}

        <Button
          onClick={onGenerateToken}
          disabled={issuing}
          icon={issuing ? undefined : QrCode}
          size="lg"
          className="w-full"
        >
          {issuing && <Loader2 size={18} className="animate-spin" aria-hidden="true" />}
          Generate QR disposal token
        </Button>
      </div>
    </Card>
  );
}
