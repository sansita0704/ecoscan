import { useCallback, useEffect, useRef, useState } from "react";
import { CAMERA_CONSTRAINTS } from "../config/constants";

/**
 * Owns the MediaStream lifecycle (WebRTC getUserMedia).
 * status: idle | starting | live | denied | error | unsupported
 * The stream is kept in state so any <video> can attach to it via srcObject.
 */
export function useCamera() {
  const streamRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [settings, setSettings] = useState(null);
  const [status, setStatus] = useState("idle");

  const releaseTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const stop = useCallback(() => {
    releaseTracks();
    setStream(null);
    setSettings(null);
    setStatus("idle");
  }, [releaseTracks]);

  const start = useCallback(async () => {
    if (streamRef.current) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("unsupported");
      return;
    }
    setStatus("starting");
    try {
      const next = await navigator.mediaDevices.getUserMedia(CAMERA_CONSTRAINTS);
      const [track] = next.getVideoTracks();
      if (!track) {
        next.getTracks().forEach((item) => item.stop());
        setStatus("error");
        return;
      }
      // Camera unplugged or taken by another app.
      track.addEventListener("ended", () => {
        releaseTracks();
        setStream(null);
        setSettings(null);
        setStatus("error");
      });
      streamRef.current = next;
      setStream(next);
      setSettings(track?.getSettings() ?? null);
      setStatus("live");
    } catch (err) {
      const denied = err?.name === "NotAllowedError" || err?.name === "SecurityError";
      setStatus(denied ? "denied" : "error");
    }
  }, [releaseTracks]);

  const toggle = useCallback(() => (streamRef.current ? stop() : start()), [start, stop]);

  // Always release the camera when the app unmounts.
  useEffect(() => releaseTracks, [releaseTracks]);

  return { stream, settings, status, isLive: status === "live", start, stop, toggle };
}
