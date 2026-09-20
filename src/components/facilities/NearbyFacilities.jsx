import { useCallback, useEffect, useRef, useState } from "react";
import { Crosshair, Loader2, MapPin, Navigation, RefreshCw, Search } from "lucide-react";
import { FALLBACK_LOCATION } from "../../config/constants";
import { useGeolocation } from "../../hooks/useGeolocation";
import { geocodeLocation, getNearbyFacilities } from "../../services/facilitiesService";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Card from "../ui/Card";
import EmptyState from "../ui/EmptyState";
import FacilityList from "../scanner/FacilityList";

const searchInputClass =
  "w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20";

/**
 * Drop-off points near the user, for browsing without having scanned
 * anything first.
 *
 * Two ways to pick where to search: live GPS ("Use my location", asked for
 * on a tap, never on page load - the same policy hooks/useGeolocation
 * already applies for disposal advice), or typing any place name, geocoded
 * via OpenStreetMap's Nominatim. The second exists because live GPS isn't
 * always available or convenient to test with, and because someone might
 * reasonably want to check a different area than the one they're in.
 *
 * Results come from OpenStreetMap via the Node route; nothing here is
 * generated, and a failed lookup says so instead of showing a plausible
 * list of places that don't exist.
 */
export default function NearbyFacilities({ onSchedulePickup }) {
  const { location, status: geoStatus, resolve } = useGeolocation();
  const [state, setState] = useState({ status: "idle", data: null, error: null });
  // What's actually being searched, independent of the live geolocation hook -
  // covers "precise GPS", "fallback city" and "a place you typed" alike, so
  // the header always says the truth about the ACTIVE search, not just GPS.
  const [origin, setOrigin] = useState(null); // { kind: "precise"|"approximate"|"manual", label }
  const [query, setQuery] = useState("");
  const [geocodeState, setGeocodeState] = useState({ status: "idle", results: [], error: null });
  const controllerRef = useRef(null);
  const geocodeControllerRef = useRef(null);
  const lastSearched = useRef(null);

  useEffect(
    () => () => {
      controllerRef.current?.abort();
      geocodeControllerRef.current?.abort();
    },
    []
  );

  const search = useCallback(async (target, nextOrigin) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setState((prev) => ({ ...prev, status: "loading", error: null }));
    try {
      const data = await getNearbyFacilities({
        lat: target.lat,
        lon: target.lon,
        limit: 8,
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      lastSearched.current = { target, nextOrigin };
      setOrigin(nextOrigin);
      setState({ status: "ready", data, error: null });
    } catch (error) {
      if (controller.signal.aborted || error.name === "AbortError") return;
      setState({ status: "error", data: null, error });
    }
  }, []);

  const retry = useCallback(() => {
    if (lastSearched.current) search(lastSearched.current.target, lastSearched.current.nextOrigin);
  }, [search]);

  const useMyLocation = useCallback(async () => {
    // resolve() settles with the best location available right now - precise
    // if allowed, the fallback city otherwise - so this always searches
    // something rather than dead-ending on a refused prompt.
    const next = await resolve();
    search(next, { kind: next.precise ? "precise" : "approximate" });
  }, [resolve, search]);

  const submitSearch = useCallback(
    async (e) => {
      e.preventDefault();
      const trimmed = query.trim();
      if (!trimmed) return;

      geocodeControllerRef.current?.abort();
      const controller = new AbortController();
      geocodeControllerRef.current = controller;

      setGeocodeState({ status: "loading", results: [], error: null });
      try {
        const results = await geocodeLocation(trimmed, { signal: controller.signal });
        if (controller.signal.aborted) return;
        if (results.length === 1) {
          // Unambiguous - search it directly instead of making them pick
          // from a list of one.
          setGeocodeState({ status: "idle", results: [], error: null });
          search(results[0], { kind: "manual", label: results[0].label });
        } else {
          setGeocodeState({ status: "ready", results, error: null });
        }
      } catch (error) {
        if (controller.signal.aborted || error.name === "AbortError") return;
        setGeocodeState({ status: "error", results: [], error });
      }
    },
    [query, search]
  );

  const pickResult = useCallback(
    (result) => {
      setGeocodeState({ status: "idle", results: [], error: null });
      search(result, { kind: "manual", label: result.label });
    },
    [search]
  );

  const originBadge = (() => {
    if (!origin) return null;
    if (origin.kind === "precise") {
      return { tone: "green", text: "Precise location", sub: "your current location" };
    }
    if (origin.kind === "manual") {
      return { tone: "brand", text: "Chosen location", sub: origin.label };
    }
    return { tone: "zinc", text: "Approximate location", sub: `${FALLBACK_LOCATION.label} (approximate)` };
  })();

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-label">Centres near you</h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">
            Recycling centres, waste-disposal points and transfer stations you can take items to
            yourself.
          </p>
        </div>
        <Button
          onClick={useMyLocation}
          icon={geoStatus === "locating" ? undefined : Crosshair}
          variant={state.status === "idle" ? "primary" : "secondary"}
          size="sm"
          disabled={geoStatus === "locating" || state.status === "loading"}
        >
          {(geoStatus === "locating" || state.status === "loading") && (
            <Loader2 size={14} className="animate-spin" aria-hidden="true" />
          )}
          {state.status === "idle" ? "Use my location" : "Search again"}
        </Button>
      </div>

      <form onSubmit={submitSearch} className="relative mt-4">
        <Search
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Or search any location - city, area, address…"
          className={searchInputClass}
        />
        <button type="submit" className="sr-only">
          Search location
        </button>
      </form>

      {geocodeState.status === "loading" && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
          <Loader2 size={12} className="animate-spin" aria-hidden="true" />
          Looking that up…
        </p>
      )}

      {geocodeState.status === "error" && (
        <p className="mt-2 text-xs text-danger-500">
          Couldn't search for that place. {geocodeState.error?.message ?? ""}
        </p>
      )}

      {geocodeState.status === "ready" && (
        <ul className="mt-2 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
          {geocodeState.results.length === 0 ? (
            <li className="p-3 text-xs text-slate-400">No matching places found. Try a different search.</li>
          ) : (
            geocodeState.results.map((r) => (
              <li key={`${r.lat},${r.lon}`}>
                <button
                  type="button"
                  onClick={() => pickResult(r)}
                  className="flex w-full items-start gap-2 p-3 text-left text-xs text-slate-600 hover:bg-slate-50"
                >
                  <MapPin size={13} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
                  <span className="min-w-0 truncate">{r.label}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}

      {originBadge && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge tone={originBadge.tone}>
            <Navigation size={11} aria-hidden="true" />
            {originBadge.text}
          </Badge>
          <span className="truncate text-xs text-slate-500">Searching around {originBadge.sub}.</span>
        </div>
      )}

      <div className="mt-4">
        {state.status === "idle" && (
          <EmptyState
            icon={MapPin}
            tone="brand"
            title="Find drop-off points near you"
            body={
              geoStatus === "denied" || geoStatus === "unsupported"
                ? `Location is unavailable in this browser - search for a place above, and we'll look up real centres from OpenStreetMap.`
                : "Share your location, or search for any place above, and we'll look up real centres from OpenStreetMap."
            }
          />
        )}

        {state.status === "loading" && (
          <div
            role="status"
            aria-label="Looking up nearby centres"
            className="relative h-40 overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
          >
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/70 to-transparent" />
            <p className="absolute inset-x-0 bottom-3 text-center text-xs text-slate-400">
              Checking real listings and their locations - this can take up to 20 seconds.
            </p>
          </div>
        )}

        {state.status === "error" && (
          <div role="alert">
            <EmptyState
              icon={RefreshCw}
              tone="danger"
              title="Couldn't search for centres"
              body={state.error?.message ?? "The lookup service didn't respond."}
            />
            <div className="flex justify-center">
              <Button onClick={retry} icon={RefreshCw} variant="secondary" size="sm">
                Try again
              </Button>
            </div>
          </div>
        )}

        {state.status === "ready" && state.data && (
          <>
            <FacilityList
              facilities={state.data.facilities}
              source={state.data.source}
              note={state.data.facilityNote}
              radiusKm={state.data.searchRadiusKm}
            />
            {state.data.facilities.length > 0 && (
              <div className="mt-2 flex justify-end">
                <Button onClick={retry} icon={RefreshCw} variant="ghost" size="sm">
                  Refresh
                </Button>
              </div>
            )}
            {onSchedulePickup && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-200 bg-brand-50 p-3">
                <p className="text-xs leading-relaxed text-slate-600">
                  Can't get to one of these yourself?
                </p>
                <Button onClick={onSchedulePickup} size="sm">
                  Schedule a pickup instead
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
