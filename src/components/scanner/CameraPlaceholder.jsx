import { AlertTriangle, Camera, CameraOff, Loader2, ShieldAlert } from "lucide-react";
import { CAMERA_MESSAGES } from "../../config/constants";
import Button from "../ui/Button";
import EmptyState from "../ui/EmptyState";

const PRESENTATION = {
  idle: { icon: CameraOff, tone: "brand", cta: "Launch webcam" },
  starting: { icon: Loader2, tone: "tech", cta: null },
  denied: { icon: ShieldAlert, tone: "warn", cta: "Try again" },
  error: { icon: AlertTriangle, tone: "danger", cta: "Try again" },
  unsupported: { icon: AlertTriangle, tone: "danger", cta: null },
};

/** Shown in place of the video when the camera is off, starting, denied or failed. */
export default function CameraPlaceholder({ status, onStart }) {
  const copy = CAMERA_MESSAGES[status];
  const { icon, tone, cta } = PRESENTATION[status] ?? PRESENTATION.idle;

  return (
    <div className="absolute inset-0 flex items-center justify-center p-6">
      <EmptyState
        icon={icon}
        tone={tone}
        title={copy.title}
        body={copy.body}
        className={status === "starting" ? "[&_svg]:animate-spin" : ""}
      >
        {cta && (
          <Button onClick={onStart} icon={Camera} size="md">
            {cta}
          </Button>
        )}
      </EmptyState>
    </div>
  );
}
