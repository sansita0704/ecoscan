import { useCallback, useEffect, useRef, useState } from "react";
import { FALLBACK_LOCATION } from "../config/constants";

// Hard ceiling on waiting for coordinates. Falling back to the configured city
// is far better than leaving the user on a spinner.
const GEOLOCATION_TIMEOUT_MS = 6000;

/**
 * Best-known user location for the facility search.
 *
 * Resolution is requested lazily - asking on page load would throw a permission
 * prompt at someone who has not yet done anything. Until (or unless) the user
 * allows it, the configured fallback city is used, and `precise` says which is
 * in play so the UI can be honest about it.
 */
export function useGeolocation() {
  const [location, setLocation] = useState({ ...FALLBACK_LOCATION, precise: false });
  const [status, setStatus] = useState("idle"); // idle | locating | precise | denied | unsupported
  const requested = useRef(false);

  /**
   * Resolves to the best location available RIGHT NOW.
   *
   * Returns a promise rather than only setting state, because callers need the
   * coordinates in the same turn they fire a request - reading `location` from
   * the closure would hand them the previous render's value and silently search
   * the fallback city instead of where the user actually is.
   */
  const resolve = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus("unsupported");
      return Promise.resolve({ ...FALLBACK_LOCATION, precise: false });
    }

    setStatus((s) => (s === "precise" ? s : "locating"));
    return new Promise((done) => {
      // getCurrentPosition is not guaranteed to call back at all: with a
      // permission prompt still open, or geolocation blocked by policy, neither
      // callback ever fires and its own `timeout` option doesn't apply. Callers
      // await this before requesting advice, so it MUST always settle.
      let settled = false;
      const finish = (value, nextStatus) => {
        if (settled) return;
        settled = true;
        clearTimeout(guard);
        if (nextStatus) setStatus(nextStatus);
        done(value);
      };

      const guard = setTimeout(
        () => finish({ ...FALLBACK_LOCATION, precise: false }, "idle"),
        GEOLOCATION_TIMEOUT_MS
      );

      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          const next = {
            lat: coords.latitude,
            lon: coords.longitude,
            label: null, // we don't reverse-geocode; the server doesn't need a name
            precise: true,
          };
          requested.current = true;
          setLocation(next);
          finish(next, "precise");
        },
        () => finish({ ...FALLBACK_LOCATION, precise: false }, "denied"),
        { enableHighAccuracy: false, timeout: GEOLOCATION_TIMEOUT_MS, maximumAge: 300000 }
      );
    });
  }, []);

  const requestPrecise = useCallback(() => {
    if (requested.current) return;
    resolve();
  }, [resolve]);

  useEffect(() => {
    // If permission was already granted in a previous visit, use it silently
    // rather than falling back to a city centre.
    navigator.permissions
      ?.query({ name: "geolocation" })
      .then((p) => {
        if (p.state === "granted") requestPrecise();
      })
      .catch(() => {});
  }, [requestPrecise]);

  return { location, status, requestPrecise, resolve };
}
