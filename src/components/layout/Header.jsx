import { Camera, CameraOff, Leaf, Loader2, MapPin } from "lucide-react";
import { LOCATION_LABEL } from "../../config/constants";
import Badge from "../ui/Badge";
import Button from "../ui/Button";

/** Top bar. The sidebar carries navigation on desktop; this carries identity + camera. */
export default function Header({ camera, onNavigate }) {
  const running = camera.isLive || camera.status === "starting";

  return (
    <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-ink-950/80 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
        {/* Brand shows on mobile only; the sidebar has it on desktop. */}
        <button
          type="button"
          onClick={() => onNavigate("home")}
          className="flex items-center gap-2.5 lg:hidden"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500">
            <Leaf size={18} className="text-white" aria-hidden="true" />
          </span>
          <span className="text-[0.9375rem] font-extrabold tracking-tight text-white">
            EcoScan AI
          </span>
        </button>

        <div className="hidden lg:block" />

        <div className="flex items-center gap-2.5">
          <Badge tone="zinc" className="hidden sm:inline-flex">
            <MapPin size={12} aria-hidden="true" /> {LOCATION_LABEL}
          </Badge>

          <Button
            onClick={camera.toggle}
            disabled={camera.status === "starting"}
            variant={running ? "danger" : "primary"}
            size="sm"
          >
            {camera.status === "starting" ? (
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            ) : running ? (
              <CameraOff size={16} aria-hidden="true" />
            ) : (
              <Camera size={16} aria-hidden="true" />
            )}
            <span className="hidden sm:inline">{running ? "Stop camera" : "Start camera"}</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
