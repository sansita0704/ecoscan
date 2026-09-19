import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { clearScans, loadScans, recordScan, summarise } from "../services/scanHistory";

/**
 * Owns the local scan log.
 *
 * `track(detection)` is safe to call on every render of a live detection: it
 * only writes when the confirmed item actually changes, so holding one bottle
 * in frame for ten seconds logs a single scan rather than fifty.
 */
export function useScanLog() {
  const [scans, setScans] = useState(loadScans);
  const lastLogged = useRef(null);

  const track = useCallback((detection) => {
    if (!detection) {
      // Item left the frame; the next appearance counts as a new scan.
      lastLogged.current = null;
      return;
    }
    if (detection.className === lastLogged.current) return;
    lastLogged.current = detection.className;
    setScans((prev) => recordScan(detection, prev));
  }, []);

  const reset = useCallback(() => {
    lastLogged.current = null;
    setScans(clearScans());
  }, []);

  // Keep other tabs in step.
  useEffect(() => {
    const onStorage = () => setScans(loadScans());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const stats = useMemo(() => summarise(scans), [scans]);
  return { scans, stats, track, reset };
}
