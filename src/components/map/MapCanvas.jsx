import { MapPin, Recycle } from "lucide-react";
import { BRAND, LOCATION_LABEL, SUCCESS } from "../../config/constants";
import Badge from "../ui/Badge";

/**
 * Static illustrative map. To use a real map (Leaflet / Mapbox / Google Maps),
 * replace this component and keep the same props: pass `hub.lat` / `hub.lng`
 * as the marker.
 */
export default function MapCanvas() {
  return (
    <div className="relative h-56 bg-ink-950 sm:h-64">
      <svg
        viewBox="0 0 400 256"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <pattern id="map-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(255,255,255,.05)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="400" height="256" fill="url(#map-grid)" />
        <g stroke="rgba(255,255,255,.08)" strokeWidth="10" fill="none" strokeLinecap="round">
          <path d="M -10 190 C 90 170 140 120 230 130 S 340 60 420 70" />
          <path d="M 120 -10 L 150 270" />
          <path d="M 300 -10 C 290 80 320 180 280 270" />
        </g>
        <rect x="170" y="150" width="60" height="40" rx="8" fill={`${SUCCESS}14`} stroke={`${SUCCESS}44`} />
        <path
          d="M 96 170 C 130 150 160 150 210 132"
          fill="none"
          stroke={BRAND}
          strokeWidth="3"
          strokeDasharray="6 6"
        />
      </svg>

      <div className="absolute" style={{ left: "22%", top: "62%" }}>
        <span className="relative flex h-4 w-4">
          <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-tech-400" />
          <span className="relative inline-flex h-4 w-4 rounded-full border-2 border-white bg-tech-500" />
        </span>
        <span className="sr-only">Your approximate location</span>
      </div>

      <div className="absolute -translate-x-1/2 -translate-y-full" style={{ left: "53%", top: "50%" }}>
        <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-success-500 text-ink-950 shadow-lg">
          <Recycle size={18} aria-hidden="true" />
        </div>
        <span className="sr-only">Recycling hub</span>
      </div>

      <div className="absolute left-4 top-4">
        <Badge tone="zinc" className="!bg-ink-950/70 backdrop-blur-sm">
          <MapPin size={12} aria-hidden="true" /> {LOCATION_LABEL}
        </Badge>
      </div>

      <div className="absolute bottom-3 right-4">
        <span className="rounded-md bg-ink-950/70 px-2 py-1 text-[0.625rem] text-slate-400 backdrop-blur-sm">
          Illustrative map
        </span>
      </div>
    </div>
  );
}
