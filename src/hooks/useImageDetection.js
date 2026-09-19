import { useCallback, useEffect, useRef, useState } from "react";
import { detectImage } from "../services/detectionService";

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // matches backend ECOSCAN_MAX_UPLOAD_BYTES default

const IDLE = { status: "idle", previewUrl: null, detection: null, error: null };

/**
 * Items from a live camera frame get `trackId` from utils/objectTracker; a
 * one-shot upload never goes through that tracker, but ItemCard/AdviceList
 * key off `trackId` regardless of source. Namespaced by `sessionId` (bumped
 * per upload) so a second photo's first item can never collide with - and
 * inherit the first photo's advice for - the previous photo's first item.
 */
function stampTrackIds(detection, sessionId) {
  if (!detection) return detection;
  const items = (detection.detections ?? []).map((item, i) => ({
    ...item,
    trackId: `upload-${sessionId}-${i}`,
  }));
  return { ...detection, ...items[0], detections: items };
}

/**
 * Owns one uploaded image's lifecycle: pick a file, show it immediately,
 * run detection on it once, hold the result (or error) until a new file
 * replaces it or it's cleared.
 *
 * Deliberately separate from hooks/useDetection - that hook drives the live
 * camera loop (temporal voting, box smoothing, one request every 150ms) and
 * none of that applies to a single still photo; this is a plain one-shot
 * request so it stays simple and doesn't risk that code path.
 *
 * status: idle | loading | ready | error
 */
export function useImageDetection() {
  const [state, setState] = useState(IDLE);
  const [file, setFile] = useState(null);
  const controllerRef = useRef(null);
  const urlRef = useRef(null);
  const sessionIdRef = useRef(0);

  const abort = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
  }, []);

  const revoke = useCallback(() => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
  }, []);

  useEffect(
    () => () => {
      abort();
      revoke();
    },
    [abort, revoke]
  );

  const runDetection = useCallback(
    async (targetFile) => {
      abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      const sessionId = ++sessionIdRef.current;

      setState((prev) => ({ ...prev, status: "loading", error: null }));
      try {
        const raw = await detectImage(targetFile, { signal: controller.signal });
        if (controller.signal.aborted) return;
        setState((prev) => ({ ...prev, status: "ready", detection: stampTrackIds(raw, sessionId), error: null }));
      } catch (error) {
        if (controller.signal.aborted || error.name === "AbortError") return;
        setState((prev) => ({ ...prev, status: "error", detection: null, error }));
      } finally {
        if (controllerRef.current === controller) controllerRef.current = null;
      }
    },
    [abort]
  );

  /** @param {File} nextFile */
  const selectFile = useCallback(
    (nextFile) => {
      if (!nextFile) return;
      if (!nextFile.type?.startsWith("image/")) {
        setState({ status: "error", previewUrl: null, detection: null, error: new Error("Choose an image file.") });
        return;
      }
      if (nextFile.size > MAX_UPLOAD_BYTES) {
        setState({
          status: "error",
          previewUrl: null,
          detection: null,
          error: new Error(`Image is larger than ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)}MB.`),
        });
        return;
      }

      revoke();
      const url = URL.createObjectURL(nextFile);
      urlRef.current = url;
      setFile(nextFile);
      setState({ status: "loading", previewUrl: url, detection: null, error: null });
      runDetection(nextFile);
    },
    [revoke, runDetection]
  );

  const retry = useCallback(() => {
    if (file) runDetection(file);
  }, [file, runDetection]);

  const clear = useCallback(() => {
    abort();
    revoke();
    setFile(null);
    setState(IDLE);
  }, [abort, revoke]);

  return { ...state, selectFile, retry, clear };
}
