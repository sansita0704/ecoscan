import { Clock, ExternalLink, MapPin, Navigation, Phone } from "lucide-react";

/**
 * Real drop-off locations from OpenStreetMap.
 *
 * Every value here came from the maps database - the language model is never
 * asked for places. Fields OSM doesn't have (hours, phone, address) are left
 * out rather than filled in, which is why each row looks slightly different.
 */
export default function FacilityList({ facilities, source, note, radiusKm }) {
  if (note === "no_location") {
    return (
      <p className="text-xs leading-relaxed text-slate-400">
        Share your location to look up real drop-off points nearby.
      </p>
    );
  }

  if (!facilities?.length) {
    return (
      <p className="text-xs leading-relaxed text-slate-400">
        {note === "lookup_failed"
          ? "Couldn't reach the facilities database just now."
          : `No matching drop-off points found within ${radiusKm ?? 50} km of you in ${source ?? "the maps database"}.`}
      </p>
    );
  }

  return (
    <>
      <ul className="space-y-2">
        {facilities.map((f) => (
          <li
            key={f.id}
            className="rounded-xl border border-white/[0.06] bg-ink-800/50 p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{f.name}</p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {f.kind}
                  {f.operator ? ` · ${f.operator}` : ""}
                </p>
              </div>
              <span className="shrink-0 rounded-lg bg-brand-500/12 px-2 py-1 text-xs font-bold tabular-nums text-brand-400">
                {f.distanceKm} km
              </span>
            </div>

            {f.address && (
              <p className="mt-2 flex items-start gap-1.5 text-xs text-slate-400">
                <MapPin size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
                {f.address}
              </p>
            )}
            {f.openingHours && (
              <p className="mt-1 flex items-start gap-1.5 text-xs text-slate-400">
                <Clock size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
                {f.openingHours}
              </p>
            )}
            {f.phone && (
              <p className="mt-1 flex items-start gap-1.5 text-xs text-slate-400">
                <Phone size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
                <a href={`tel:${f.phone}`} className="hover:text-white">
                  {f.phone}
                </a>
              </p>
            )}

            {f.accepts?.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-1">
                {f.accepts.slice(0, 6).map((a) => (
                  <li
                    key={a}
                    className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[0.625rem] text-slate-400"
                  >
                    {a.replace(/_/g, " ")}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-2.5 flex items-center gap-3">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${f.lat},${f.lon}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-400 hover:text-brand-300"
              >
                <Navigation size={12} aria-hidden="true" />
                Directions
              </a>
              <a
                href={f.osmUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300"
              >
                <ExternalLink size={11} aria-hidden="true" />
                Source
              </a>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-2.5 text-[0.6875rem] leading-relaxed text-slate-500">
        Locations and distances from {source}. Listings are community-maintained — check hours
        before travelling.
      </p>
    </>
  );
}
